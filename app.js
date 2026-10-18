/**
 * AURÉL STOREFRONT CONTROLLER
 *
 * This module connects index.html controls to catalogue.js and updates the page.
 * Read it by section: helpers, state, catalogue, bag, checkout, slideshow, events.
 * HTML templates build dynamic cards/dialogs. escapeHTML() protects text values.
 * Payment methods are a preview: this file creates no real payments or orders.
 * For a map of the important functions, see docs/CODE-GUIDE.md.
 */

import {
  products,
  findProduct,
  filterProducts,
  cleanCart,
  cartTotal,
  currency,
} from './catalogue.js';
import { information } from './data/information.js';

// 1. Small helpers: $ finds one element; $$ returns an array of matching elements.
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
// Escape special characters before inserting dynamic text into an HTML template.
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

// Reusable inline SVG paths; data-icon names in index.html refer to these keys.
const icons = {
  'arrow-right': /* HTML */ `<path d="M4 12h15m-6-6 6 6-6 6" />`,
  'arrow-left': /* HTML */ `<path d="M20 12H5m6-6-6 6 6 6" />`,
  'arrow-up-right': /* HTML */ `<path d="M6 18 18 6M6 6h12v12" />`,
  search: /* HTML */ `<circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />`,
  heart: /* HTML */ `<path
    d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"
  />`,
  bag: /* HTML */ `<path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" />`,
  close: /* HTML */ `<path d="m6 6 12 12M6 18 18 6" />`,
  menu: /* HTML */ `<path d="M4 7h16M4 12h16M4 17h16" />`,
  plus: /* HTML */ `<path d="M12 5v14M5 12h14" />`,
  pause: /* HTML */ `<path d="M9 5v14M15 5v14" />`,
  play: /* HTML */ `<path d="m8 5 11 7-11 7V5Z" />`,
  check: /* HTML */ `<path d="m5 12 4 4L19 6" />`,
};

/**
 * Return one decorative SVG from the icon collection.
 * @param {string} name - A key in the icons object.
 */
function icon(name) {
  return /* HTML */ `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.45"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${icons[name] || ''}
  </svg>`;
}

/**
 * Fill data-icon placeholders after the static HTML has loaded.
 * @param {Document|Element} root - The area in which to find icon placeholders.
 */
function injectIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
  });
}

/**
 * Read saved browser data; use the fallback if it is missing or invalid.
 * Storage can be blocked in some browser settings, so reads must be optional.
 */
function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save only bag variants and favourite product IDs in this browser.
 * The try/catch keeps shopping usable when storage is blocked or full.
 */
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* The shop still works if browser storage is unavailable. */
  }
}

// 2. Browser state: bag and favourites persist; selected sizes and delivery drafts do not.
let cart = cleanCart(readStorage('aurel-bag-v1', []));
const saved = readStorage('aurel-favourites-v1', []);
let favourites = Array.isArray(saved) ? [...new Set(saved.filter((id) => findProduct(id)))] : [];
let selectedProduct = null;
let selectedSize = null;
let checkoutDraft = null;
let toastTimer;

// Changing these filter values and calling renderProducts() refreshes the catalogue.
const state = {
  category: 'all',
  occasion: 'all',
  size: 'all',
  query: '',
  sort: 'featured',
  savedOnly: false,
  visibleCount: 8,
};

/**
 * Show a short message in the aria-live toast, then hide it.
 */
function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200);
}

/**
 * Close every open overlay and restore page scrolling.
 */
function closeDialogs() {
  $$('dialog[open]').forEach((dialog) => dialog.close());
  document.body.classList.remove('dialog-open');
}

/**
 * Open a native dialog and pause the slideshow behind it.
 * @param {HTMLDialogElement} dialog - The dialog to display.
 * @param {boolean} stack - Keep another dialog open for the nested size guide.
 */
function openDialog(dialog, stack = false) {
  if (!stack) closeDialogs();
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('dialog-open');
  resetSlideshowTimer();
}

// Native dialog close events also clear the temporary checkout draft.
$$('dialog').forEach((dialog) => {
  dialog.addEventListener('close', () => {
    document.body.classList.toggle('dialog-open', Boolean($('dialog[open]')));
    resetSlideshowTimer();
    if (dialog.id === 'checkout-dialog') {
      checkoutDraft = null;
      $('#checkout-body').innerHTML = '';
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  });
});

// 3. Catalogue cards, filtering, product details, and saved pieces.

/**
 * Show one garment from a 6-column × 3-row contact sheet.
 * CSS sets background-size to 600% 300%; percentages select the correct tile.
 * @param {object} product - A product from data/products.js.
 * @param {string} additionalClass - Optional extra styling class.
 */
function productImage(product, additionalClass = '') {
  const x = (product.index % 6) * 20;
  const y = Math.floor(product.index / 6) * 50;
  return /* HTML */ `<div
    class="product-image ${additionalClass}"
    role="img"
    aria-label="${escapeHTML(product.color)} ${escapeHTML(product.name)} — product concept"
    style="background-image:url('${product.image}');background-position:${x}% ${y}%"
  ></div>`;
}

/**
 * Turn a product size list into a compact first-to-last display label.
 */
function sizeRange(product) {
  return product.sizes.length === 1
    ? product.sizes[0]
    : `${product.sizes[0]} – ${product.sizes.at(-1)}`;
}

/**
 * Build one catalogue card, including its current favourite state.
 * data-product and data-save are handled by the delegated click listener below.
 */
function productCard(product) {
  const isSaved = favourites.includes(product.id);
  return /* HTML */ `<article class="product-card">
    <div class="product-visual">
      <button
        class="product-photo-button"
        data-product="${product.id}"
        aria-label="View ${escapeHTML(product.name)}"
      >
        ${productImage(product)}
      </button>
      ${product.badge ? /* HTML */ `<span class="product-badge">${product.badge}</span>` : ''}
      <button
        class="icon-button product-save"
        data-save="${product.id}"
        aria-label="${isSaved ? 'Unsave' : 'Save'} ${escapeHTML(product.name)}"
        aria-pressed="${isSaved}"
      >
        ${icon('heart')}
      </button>
      <button
        class="quick-add"
        data-product="${product.id}"
        aria-label="Choose a size for ${escapeHTML(product.name)}"
      >
        <span class="quick-add-label">Choose your size</span>${icon('plus')}
      </button>
    </div>
    <div class="product-information">
      <p class="product-meta">
        <span>${titleCase(product.category)} / ${product.fabric}</span
        ><span>${product.occasions[0]}</span>
      </p>
      <button class="product-name" data-product="${product.id}">${escapeHTML(product.name)}</button>
      <p class="product-price">${currency(product.price)}</p>
      <p class="product-size-line">
        <span>${escapeHTML(sizeRange(product))}</span
        ><span
          class="product-color"
          style="background:${product.swatch}"
          title="${escapeHTML(product.color)}"
          aria-label="${escapeHTML(product.color)}"
        ></span>
      </p>
    </div>
  </article>`;
}

/**
 * Build the size dropdown from the selected category and reset invalid choices.
 */
function updateSizeFilter() {
  const sizes = [
    ...new Set(
      products
        .filter((product) => state.category === 'all' || product.category === state.category)
        .flatMap((product) => product.sizes),
    ),
  ];
  if (!sizes.includes(state.size)) state.size = 'all';
  $('#size-filter').innerHTML =
    /* HTML */ `<option value="all">All sizes</option>` +
    sizes
      .map((size) => /* HTML */ `<option value="${escapeHTML(size)}">${escapeHTML(size)}</option>`)
      .join('');
  $('#size-filter').value = state.size;
}

/**
 * Apply all active filters, show the requested number of cards, and update labels.
 * This changes only the rendered view; it never edits the product catalogue.
 */
function renderProducts() {
  const filtered = filterProducts(state, favourites);
  const visible = filtered.slice(0, state.visibleCount);
  $('#product-grid').innerHTML = visible.map(productCard).join('');
  $('#empty-products').hidden = filtered.length !== 0;
  const pieceLabel = filtered.length === 1 ? 'piece' : 'pieces';
  let resultDescription = ' to make your own';
  if (state.savedOnly) {
    resultDescription = ' saved for you';
  } else if (state.category !== 'all') {
    const collectionName = state.category === 'kids' ? 'little' : `${state.category}'s`;
    resultDescription = ` in the ${collectionName} edit`;
  }
  $('#results-count').textContent = `${filtered.length} ${pieceLabel}${resultDescription}`;
  $('#shown-count').textContent = filtered.length
    ? `Showing ${visible.length} of ${filtered.length} considered pieces`
    : '';
  $('#show-more').hidden = visible.length >= filtered.length;
  $('#show-more').innerHTML = `Explore all ${filtered.length} pieces ${icon('arrow-right')}`;
  $('#clear-filters').hidden = !(
    state.category !== 'all' ||
    state.occasion !== 'all' ||
    state.size !== 'all' ||
    state.query ||
    state.savedOnly ||
    state.sort !== 'featured'
  );
  $('#catalogue-eyebrow').textContent = state.savedOnly
    ? 'YOUR SAVED PIECES'
    : state.occasion !== 'all'
      ? `THE ${state.occasion.toUpperCase()} EDIT`
      : 'THE CONSIDERED COLLECTION';
  const collectionHeadings = {
    all: 'Your next <em>favourite.</em>',
    women: 'For every <em>version of you.</em>',
    men: 'Effortlessly <em>considered.</em>',
    kids: 'Little things. <em>Big joy.</em>',
  };
  $('#catalogue-heading').innerHTML = state.savedOnly
    ? 'The pieces <em>you love.</em>'
    : collectionHeadings[state.category] || collectionHeadings.all;
  $$('[data-tab]').forEach((button) => {
    const active = button.dataset.tab === state.category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
  $('#occasion-filter').value = state.occasion;
  $('#sort-filter').value = state.sort;
  if ($('#catalogue-search').value !== state.query) $('#catalogue-search').value = state.query;
}

/**
 * Start a fresh catalogue view from a navigation link, search, or collection.
 * @param {object} options - Overrides for the default filter state.
 * @param {boolean} scroll - Move to the catalogue after updating it.
 */
function goShopping(options = {}, scroll = true) {
  closeDialogs();
  Object.assign(
    state,
    {
      category: 'all',
      occasion: 'all',
      size: 'all',
      query: '',
      sort: 'featured',
      savedOnly: false,
      visibleCount: products.length,
    },
    options,
  );
  updateSizeFilter();
  renderProducts();
  if (scroll)
    $('#collection').scrollIntoView({
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
      block: 'start',
    });
}

/**
 * Restore the homepage catalogue with its first eight featured pieces.
 */
function resetFilters() {
  goShopping({ visibleCount: 8 }, false);
}

/**
 * Refresh bag and favourite badges, including their screen-reader labels.
 */
function updateCounts() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $('#bag-count').textContent = String(count);
  $('#bag-toggle').setAttribute(
    'aria-label',
    `Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`,
  );
  $('#bag-title-count').textContent = `(${count})`;
  $('#favourites-count').textContent = String(favourites.length);
  $('#favourites-count').hidden = !favourites.length;
  $('#favourites-toggle').setAttribute(
    'aria-label',
    `View ${favourites.length} saved ${favourites.length === 1 ? 'piece' : 'pieces'}`,
  );
}

/**
 * Save or unsave one product, persist the IDs, and update visible heart buttons.
 */
function toggleFavourite(id) {
  const product = findProduct(id);
  if (!product) return;
  const wasSaved = favourites.includes(id);
  favourites = wasSaved ? favourites.filter((item) => item !== id) : [...favourites, id];
  writeStorage('aurel-favourites-v1', favourites);
  updateCounts();
  $$(`[data-save="${id}"]`).forEach((button) => {
    button.setAttribute('aria-pressed', !wasSaved);
    button.setAttribute('aria-label', `${wasSaved ? 'Save' : 'Unsave'} ${product.name}`);
  });
  if (state.savedOnly) renderProducts();
  notify(wasSaved ? 'Removed from your saved pieces.' : 'Saved for a little later.');
}

/**
 * Open the product detail dialog and reset its selected size.
 * A one-size product can be selected automatically; other products need a choice.
 */
function showProduct(id) {
  const product = findProduct(id);
  if (!product) return;
  selectedProduct = product;
  selectedSize = product.sizes.length === 1 ? product.sizes[0] : null;
  $('#product-detail').innerHTML = /* HTML */ `<div class="product-detail-grid">
    <div class="product-detail-visual">${productImage(product)}</div>
    <div class="product-detail-copy">
      <p class="eyebrow">
        AURÉL / THE
        ${product.category === 'kids' ? 'LITTLE' : `${product.category.toUpperCase()}'S`} EDIT
      </p>
      <h2 id="product-title">${escapeHTML(product.name)}</h2>
      <p class="detail-price">${currency(product.price)}</p>
      <p class="detail-description">${escapeHTML(product.description)}</p>
      <p class="detail-color">
        <span class="product-color" style="background:${product.swatch}"></span> Colour:
        ${escapeHTML(product.color)}
      </p>
      <div class="size-heading">
        <span id="selected-size-label"
          >Choose your size${selectedSize ? `: ${escapeHTML(selectedSize)}` : ''}</span
        ><button data-info="sizes">Size guide</button>
      </div>
      <div class="size-options" role="group" aria-label="Available sizes">
        ${product.sizes
          .map(
            (size) =>
              /* HTML */ `<button
                data-size="${escapeHTML(size)}"
                aria-pressed="${selectedSize === size}"
              >
                ${escapeHTML(size)}
              </button>`,
          )
          .join('')}
      </div>
      <p class="size-error" id="size-error" role="alert"></p>
      <div class="detail-actions">
        <button class="button button-olive" id="add-to-bag">Add to bag ${icon('plus')}</button
        ><button
          class="icon-button"
          data-save="${product.id}"
          aria-label="${favourites.includes(product.id) ? 'Unsave' : 'Save'} ${escapeHTML(
            product.name,
          )}"
          aria-pressed="${favourites.includes(product.id)}"
        >
          ${icon('heart')}
        </button>
      </div>
      <div class="detail-specs">
        <div><span>Fabric concept</span><span>${escapeHTML(product.fabric)}</span></div>
        <div><span>Wear it for</span><span>${product.occasions.join(' · ')}</span></div>
        <div><span>Collection</span><span>${titleCase(product.category)}</span></div>
      </div>
      <p class="sample-disclosure">
        Sample collection. Images, prices, fabrics, and sizing are illustrative and will be
        confirmed before the store launches.
      </p>
    </div>
  </div>`;
  openDialog($('#product-dialog'));
}

/**
 * Validate the chosen size and add that product/size variant to the bag.
 * An existing variant gains one item, up to the preview limit of ten.
 */
function addSelectedProduct() {
  if (!selectedProduct) return;
  if (!selectedSize || !selectedProduct.sizes.includes(selectedSize)) {
    $('#size-error').textContent = 'Please choose a size before adding this piece.';
    $('.size-options button')?.focus();
    return;
  }
  const existing = cart.find(
    (item) => item.id === selectedProduct.id && item.size === selectedSize,
  );
  if (existing && existing.quantity >= 10) {
    $('#size-error').textContent = 'You can add up to 10 of each size in this preview.';
    return;
  }
  if (existing) existing.quantity += 1;
  else cart.push({ id: selectedProduct.id, size: selectedSize, quantity: 1 });
  persistCart();
  showBag();
}

// 4. Shopping bag: each entry contains only id, size, and quantity.

/**
 * Validate bag entries, save them locally, and update the header badge.
 */
function persistCart() {
  cart = cleanCart(cart);
  writeStorage('aurel-bag-v1', cart);
  updateCounts();
}

/**
 * Render bag variants and totals, or the empty-bag message.
 * Each quantity/remove button stores its current bag index in a data attribute.
 */
function renderBag() {
  updateCounts();
  if (!cart.length) {
    $('#bag-body').innerHTML = /* HTML */ `<div class="empty-state bag-empty">
      ${icon('bag')}
      <h3>A little room for you.</h3>
      <p>
        Your bag is waiting for a few considered favourites. Explore the collection and find your
        everyday.
      </p>
      <button class="button button-olive" data-all-pieces>
        Explore the collection ${icon('arrow-right')}
      </button>
    </div>`;
    $('#bag-summary').innerHTML = '';
    return;
  }
  $('#bag-body').innerHTML = cart
    .map((item, index) => {
      const product = findProduct(item.id);
      return /* HTML */ `<article class="bag-item">
        <button data-product="${product.id}" aria-label="View ${escapeHTML(product.name)}">
          ${productImage(product)}
        </button>
        <div>
          <h3>${escapeHTML(product.name)}</h3>
          <p class="bag-item-meta">${escapeHTML(product.color)} / Size ${escapeHTML(item.size)}</p>
          <p class="bag-item-price">${currency(product.price * item.quantity)}</p>
          <div class="bag-item-controls">
            <div class="quantity-control">
              <button
                data-quantity="${index}"
                data-delta="-1"
                aria-label="Decrease quantity of ${escapeHTML(product.name)}"
                ${item.quantity === 1 ? 'disabled' : ''}
              >
                −</button
              ><span aria-label="Quantity ${item.quantity}">${item.quantity}</span
              ><button
                data-quantity="${index}"
                data-delta="1"
                aria-label="Increase quantity of ${escapeHTML(product.name)}"
                ${item.quantity === 10 ? 'disabled' : ''}
              >
                +
              </button>
            </div>
            <button
              class="remove-item"
              data-remove="${index}"
              aria-label="Remove ${escapeHTML(product.name)}, size ${escapeHTML(item.size)}"
            >
              Remove
            </button>
          </div>
        </div>
      </article>`;
    })
    .join('');
  $('#bag-summary').innerHTML = /* HTML */ `<div class="summary-line subtotal">
      <span>Subtotal</span><strong>${currency(cartTotal(cart))}</strong>
    </div>
    <div class="summary-line muted">
      <span>Delivery & taxes</span><span>Confirmed before store launch</span>
    </div>
    <button class="button button-olive" id="checkout-open">
      Continue to checkout ${icon('arrow-right')}
    </button>
    <p class="bag-preview-note">Preview checkout · No payments or orders are processed</p>`;
}

/**
 * Refresh the bag contents and open its side drawer.
 */
function showBag() {
  renderBag();
  openDialog($('#bag-dialog'));
}

// 5. Checkout preview: UI only, with no payment provider or order backend.

/**
 * Return decorative payment-method labels; these are not gateway integrations.
 */
function paymentMarks() {
  return /* HTML */ `<div class="payment-marks">
    <span class="upi-mark">UPI ▸</span><span class="visa-mark">VISA</span
    ><span class="mastercard-mark" aria-label="Mastercard"><i></i><i></i></span
    ><span class="paypal-mark">PayPal</span>
  </div>`;
}

const paymentLabels = {
  upi: 'UPI',
  card: 'Credit / debit card',
  paypal: 'PayPal',
  netbanking: 'Net banking',
};
const paymentNotes = {
  upi: 'UPI is selected. In a live store, you would continue to your UPI app. This preview does not request a UPI ID or PIN.',
  card: 'Card is selected. A live checkout would use a payment provider’s secure form. Do not enter card details into this preview.',
  paypal:
    'PayPal is selected. This preview does not open PayPal, request a sign-in, or create a payment.',
  netbanking:
    'Net banking is selected. This preview does not open your bank or ask for banking credentials.',
};

/**
 * Render the bag subtotal beside the preview delivery form.
 * The displayed amount charged is always zero in this demo.
 */
function checkoutSummary() {
  return /* HTML */ `<aside class="checkout-summary">
    <h3>Your considered collection</h3>
    <div class="checkout-summary-list">
      ${cart
        .map((item) => {
          const product = findProduct(item.id);
          return /* HTML */ `<div class="checkout-summary-item">
            ${productImage(product)}
            <div>
              <h4>${escapeHTML(product.name)}</h4>
              <p>Size ${escapeHTML(item.size)} · Qty ${item.quantity}</p>
            </div>
            <span>${currency(product.price * item.quantity)}</span>
          </div>`;
        })
        .join('')}
    </div>
    <div class="checkout-totals">
      <div class="summary-line subtotal">
        <span>Item subtotal</span><strong>${currency(cartTotal(cart))}</strong>
      </div>
      <div class="summary-line muted">
        <span>Delivery & taxes</span><span>Not calculated in preview</span>
      </div>
      <div class="summary-line muted">
        <span>Amount charged</span><span>₹0 — preview only</span>
      </div>
    </div>
    ${paymentMarks()}
  </aside>`;
}

/**
 * Build the preview form and restore an in-memory draft when editing.
 * No delivery information is written to localStorage or sent over the network.
 */
function renderCheckoutForm() {
  $('#checkout-title').textContent = 'A few final details.';
  $('#checkout-body').innerHTML = /* HTML */ `<div class="checkout-layout">
    <form class="checkout-form" id="checkout-form">
      <p class="preview-notice">
        <strong>You are trying a checkout preview.</strong><br />Payments are not enabled. No order
        will be placed. Use example details to explore the experience.
      </p>
      <div class="checkout-section-title">
        <h3>01 / Delivery details</h3>
        <button type="button" id="example-details">Use example details</button>
      </div>
      <div class="form-grid">
        <label class="form-field full"
          >Full name<input
            name="name"
            autocomplete="name"
            placeholder="Your name"
            required
            maxlength="100"
        /></label>
        <label class="form-field full"
          >Email address<input
            name="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
            maxlength="150"
        /></label>
        <label class="form-field full"
          >Street address<input
            name="address"
            autocomplete="street-address"
            placeholder="House number, building, street"
            required
            maxlength="220"
        /></label>
        <label class="form-field"
          >City<input name="city" autocomplete="address-level2" required maxlength="80"
        /></label>
        <label class="form-field"
          >PIN code<input
            name="pincode"
            autocomplete="postal-code"
            inputmode="numeric"
            pattern="[1-9][0-9]{5}"
            maxlength="6"
            title="Enter a six-digit Indian PIN code"
            required
        /></label>
        <label class="form-field"
          >State / territory<select name="state" autocomplete="address-level1" required>
            <option value="">Select state</option>
            ${[
              'Andaman and Nicobar Islands',
              'Andhra Pradesh',
              'Arunachal Pradesh',
              'Assam',
              'Bihar',
              'Chandigarh',
              'Chhattisgarh',
              'Dadra and Nagar Haveli and Daman and Diu',
              'Delhi',
              'Goa',
              'Gujarat',
              'Haryana',
              'Himachal Pradesh',
              'Jammu and Kashmir',
              'Jharkhand',
              'Karnataka',
              'Kerala',
              'Ladakh',
              'Lakshadweep',
              'Madhya Pradesh',
              'Maharashtra',
              'Manipur',
              'Meghalaya',
              'Mizoram',
              'Nagaland',
              'Odisha',
              'Puducherry',
              'Punjab',
              'Rajasthan',
              'Sikkim',
              'Tamil Nadu',
              'Telangana',
              'Tripura',
              'Uttar Pradesh',
              'Uttarakhand',
              'West Bengal',
            ]
              .map((name) => /* HTML */ `<option>${name}</option>`)
              .join('')}
          </select></label
        >
        <label class="form-field"
          >Country<input name="country" value="India" readonly autocomplete="country-name"
        /></label>
      </div>
      <div class="checkout-section-title">
        <h3 id="payment-heading">02 / Choose a payment method</h3>
      </div>
      <fieldset class="payment-options" aria-labelledby="payment-heading">
        <label class="payment-option"
          ><input type="radio" name="payment" value="upi" checked /><span
            ><strong>UPI</strong><small>Google Pay · PhonePe · BHIM</small></span
          ></label
        >
        <label class="payment-option"
          ><input type="radio" name="payment" value="card" /><span
            ><strong>Credit / debit card</strong><small>Visa · Mastercard · RuPay</small></span
          ></label
        >
        <label class="payment-option"
          ><input type="radio" name="payment" value="paypal" /><span
            ><strong>PayPal</strong><small>PayPal checkout preview</small></span
          ></label
        >
        <label class="payment-option"
          ><input type="radio" name="payment" value="netbanking" /><span
            ><strong>Net banking</strong><small>Bank checkout preview</small></span
          ></label
        >
      </fieldset>
      <p class="payment-explanation" id="payment-explanation" aria-live="polite">
        ${paymentNotes.upi}
      </p>
      <button type="submit" class="button button-olive">
        Review checkout preview ${icon('arrow-right')}
      </button>
      <p class="privacy-note">
        Delivery details remain in this open preview only. They are not sent to a server or saved
        with your bag. No payment details are collected.
      </p>
    </form>
    ${checkoutSummary()}
  </div>`;
  if (checkoutDraft) {
    const form = $('#checkout-form');
    for (const [key, value] of Object.entries(checkoutDraft)) {
      if (key === 'payment') {
        const radio = form.querySelector(`[name="payment"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value;
    }
    $('#payment-explanation').textContent = paymentNotes[checkoutDraft.payment] || paymentNotes.upi;
  }
}

/**
 * Open a fresh checkout preview only when the bag contains something.
 */
function openCheckout() {
  if (!cart.length) return;
  checkoutDraft = null;
  renderCheckoutForm();
  openDialog($('#checkout-dialog'));
}

/**
 * Validate the preview form and show a review screen without placing an order.
 * @param {HTMLFormElement} form - The current delivery/payment-method form.
 */
function reviewCheckout(form) {
  if (!form.reportValidity() || !cart.length) return;
  const details = Object.fromEntries(new FormData(form).entries());
  if (!Object.hasOwn(paymentLabels, details.payment)) return;
  checkoutDraft = details;
  $('#checkout-title').textContent = 'Your checkout, considered.';
  $('#checkout-body').innerHTML = /* HTML */ `<div class="review-content">
    <p class="preview-notice">
      <strong>Preview complete — nothing has been ordered or charged.</strong><br />Your pieces are
      still in your bag. The store needs live payment and fulfilment setup before it can accept
      orders.
    </p>
    <h3>Everything in one place.</h3>
    <div class="review-details">
      <div class="summary-line">
        <span>${cart.reduce((sum, item) => sum + item.quantity, 0)} pieces / Item subtotal</span
        ><strong>${currency(cartTotal(cart))}</strong>
      </div>
      <div class="summary-line">
        <span>Selected payment method</span
        ><span>${escapeHTML(paymentLabels[details.payment])}</span>
      </div>
      <p>
        <strong>Example delivery</strong><br />${escapeHTML(details.name)}<br />${escapeHTML(
          details.address,
        )}<br />${escapeHTML(details.city)}, ${escapeHTML(details.state)}
        ${escapeHTML(details.pincode)}<br />India
      </p>
      <p>${escapeHTML(details.email)}</p>
    </div>
    <p class="privacy-note">
      No delivery information has been saved or transmitted. This is a review of the shopping flow,
      not an order confirmation.
    </p>
    <div class="review-actions">
      <button class="button button-outline" id="edit-checkout">Edit details</button
      ><button class="button button-olive" data-all-pieces>
        Continue exploring ${icon('arrow-right')}
      </button>
    </div>
  </div>`;
  $('#checkout-dialog').scrollTop = 0;
  $('#edit-checkout').focus();
}

/**
 * Load a trusted help entry from data/information.js into the information dialog.
 */
function openInfo(name) {
  const entry = information[name];
  if (!entry) return;
  $('#info-title').textContent = entry.title;
  $('#info-body').innerHTML = entry.body;
  openDialog($('#info-dialog'), $('#product-dialog').open && name === 'sizes');
}

// 6. Hero slideshow. Change SLIDE_INTERVAL_MS to adjust the delay.
// Hero playback loops through five slides; users can pause or navigate at any time.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hero = $('.hero');
const SLIDE_INTERVAL_MS = 6500;
const slideCount = $$('[data-slide-panel]').length;
let currentSlide = 0;
let slideshowPaused = reducedMotion.matches;
let heroHovered = false;
let heroFocused = false;
let slideTimer;

/**
 * Activate a slide and its matching bar; wrap at either end of the carousel.
 * Inactive slides are inert so their buttons cannot receive keyboard focus.
 */
function renderSlide(index) {
  currentSlide = (index + slideCount) % slideCount;
  $$('[data-slide-panel]').forEach((panel, panelIndex) => {
    const active = panelIndex === currentSlide;
    panel.classList.toggle('active', active);
    panel.setAttribute('aria-hidden', !active);
    panel.inert = !active;
  });
  $$('[data-slide]').forEach((button, buttonIndex) => {
    const active = buttonIndex === currentSlide;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  resetSlideshowTimer();
}

/**
 * Schedule the next slide only when playback is allowed.
 * Hover, keyboard focus, an open dialog, and background tabs pause the timer.
 */
function resetSlideshowTimer() {
  clearTimeout(slideTimer);
  if (!slideshowPaused && !heroHovered && !heroFocused && !document.hidden && !$('dialog[open]')) {
    slideTimer = setTimeout(() => renderSlide(currentSlide + 1), SLIDE_INTERVAL_MS);
  }
}

/**
 * Keep the play/pause icon and accessible label in sync with playback state.
 */
function updatePlaybackButton() {
  $('#slide-pause').innerHTML = icon(slideshowPaused ? 'play' : 'pause');
  $('#slide-pause').setAttribute(
    'aria-label',
    slideshowPaused ? 'Play slideshow' : 'Pause slideshow',
  );
  resetSlideshowTimer();
}

hero.addEventListener('mouseenter', () => {
  heroHovered = true;
  resetSlideshowTimer();
});
hero.addEventListener('mouseleave', () => {
  heroHovered = false;
  resetSlideshowTimer();
});
hero.addEventListener('focusin', () => {
  heroFocused = true;
  resetSlideshowTimer();
});
hero.addEventListener('focusout', (event) => {
  if (!hero.contains(event.relatedTarget)) {
    heroFocused = false;
    resetSlideshowTimer();
  }
});
document.addEventListener('visibilitychange', resetSlideshowTimer);
reducedMotion.addEventListener('change', () => {
  slideshowPaused = reducedMotion.matches;
  updatePlaybackButton();
});

// 7. Event handlers connect data-* HTML attributes and IDs to the functions above.
// Delegation keeps controls working after catalogue and bag content is re-rendered.
document.addEventListener('click', (event) => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.hasAttribute('data-close')) {
    target.closest('dialog')?.close();
    return;
  }
  if (target.hasAttribute('data-home')) {
    event.preventDefault();
    resetFilters();
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    return;
  }
  if (target.hasAttribute('data-all-pieces')) {
    goShopping();
    return;
  }
  if (target.dataset.category) {
    goShopping({ category: target.dataset.category });
    return;
  }
  if (target.dataset.occasion) {
    goShopping({ occasion: target.dataset.occasion });
    return;
  }
  if (target.dataset.tab) {
    state.category = target.dataset.tab;
    state.size = 'all';
    state.visibleCount = products.length;
    updateSizeFilter();
    renderProducts();
    return;
  }
  if (target.dataset.search) {
    goShopping({ query: target.dataset.search });
    return;
  }
  if (target.dataset.product) {
    showProduct(target.dataset.product);
    return;
  }
  if (target.dataset.save) {
    toggleFavourite(target.dataset.save);
    return;
  }
  if (target.dataset.info) {
    openInfo(target.dataset.info);
    return;
  }
  if (target.dataset.size && selectedProduct?.sizes.includes(target.dataset.size)) {
    selectedSize = target.dataset.size;
    $$('[data-size]').forEach((button) =>
      button.setAttribute('aria-pressed', button.dataset.size === selectedSize),
    );
    $('#selected-size-label').textContent = `Size: ${selectedSize}`;
    $('#size-error').textContent = '';
    return;
  }
  if (target.hasAttribute('data-slide')) {
    renderSlide(Number(target.dataset.slide));
    return;
  }
  if (target.hasAttribute('data-quantity')) {
    const item = cart[Number(target.dataset.quantity)];
    if (item)
      item.quantity = Math.min(10, Math.max(1, item.quantity + Number(target.dataset.delta)));
    persistCart();
    renderBag();
    return;
  }
  if (target.hasAttribute('data-remove')) {
    cart.splice(Number(target.dataset.remove), 1);
    persistCart();
    renderBag();
    return;
  }
  const actions = {
    'menu-toggle': () => openDialog($('#navigation-dialog')),
    'search-toggle': () => {
      $('#global-search').value = state.query;
      openDialog($('#search-dialog'));
      $('#global-search').focus();
    },
    'favourites-toggle': () => goShopping({ savedOnly: true }),
    'mobile-favourites': () => goShopping({ savedOnly: true }),
    'bag-toggle': showBag,
    'size-guide-link': () => openInfo('sizes'),
    'clear-filters': resetFilters,
    'reset-search': () => goShopping(),
    'show-more': () => {
      state.visibleCount = products.length;
      renderProducts();
    },
    'add-to-bag': addSelectedProduct,
    'checkout-open': openCheckout,
    'edit-checkout': renderCheckoutForm,
    'slide-prev': () => renderSlide(currentSlide - 1),
    'slide-next': () => renderSlide(currentSlide + 1),
    'slide-pause': () => {
      slideshowPaused = !slideshowPaused;
      updatePlaybackButton();
    },
    'example-details': () => {
      const form = $('#checkout-form');
      const example = {
        name: 'Alex Example',
        email: 'alex@example.com',
        address: '123 Example Street',
        city: 'Bengaluru',
        pincode: '560001',
        state: 'Karnataka',
      };
      Object.entries(example).forEach(([key, value]) => {
        form.elements.namedItem(key).value = value;
      });
      form.elements.namedItem('name').focus();
    },
  };
  actions[target.id]?.();
});

// Form handlers prevent page reloads and update the catalogue or preview in place.
$('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  goShopping({ query: $('#global-search').value.trim() });
});

let searchTimer;
$('#catalogue-search').addEventListener('input', (event) => {
  clearTimeout(searchTimer);
  state.query = event.target.value;
  state.visibleCount = products.length;
  searchTimer = setTimeout(renderProducts, 150);
});

$('#occasion-filter').addEventListener('change', (event) => {
  state.occasion = event.target.value;
  state.visibleCount = products.length;
  renderProducts();
});
$('#size-filter').addEventListener('change', (event) => {
  state.size = event.target.value;
  state.visibleCount = products.length;
  renderProducts();
});
$('#sort-filter').addEventListener('change', (event) => {
  state.sort = event.target.value;
  renderProducts();
});

document.addEventListener('change', (event) => {
  if (event.target.matches('input[name="payment"]') && paymentNotes[event.target.value])
    $('#payment-explanation').textContent = paymentNotes[event.target.value];
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'checkout-form') return;
  event.preventDefault();
  reviewCheckout(event.target);
});

// 8. Keep two tabs consistent without saving any delivery or payment information.
window.addEventListener('storage', (event) => {
  if (event.key === 'aurel-bag-v1') {
    cart = cleanCart(readStorage('aurel-bag-v1', []));
    updateCounts();
    if ($('#bag-dialog').open) renderBag();
    if ($('#checkout-dialog').open) {
      $('#checkout-dialog').close();
      showBag();
      notify('Your bag changed in another tab. Please review it before checkout.');
    }
  }
  if (event.key === 'aurel-favourites-v1') {
    const items = readStorage('aurel-favourites-v1', []);
    favourites = Array.isArray(items) ? [...new Set(items.filter((id) => findProduct(id)))] : [];
    updateCounts();
    renderProducts();
    if ($('#product-dialog').open && selectedProduct) {
      const button = $('#product-dialog').querySelector('[data-save]');
      button?.setAttribute('aria-pressed', favourites.includes(selectedProduct.id));
    }
  }
});

// 9. Initial page setup. Module scripts run after the HTML has been parsed.
injectIcons();
$('#year').textContent = new Date().getFullYear();
updateSizeFilter();
renderProducts();
updateCounts();
updatePlaybackButton();
