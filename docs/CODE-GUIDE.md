# How the AURÉL code works

## Read these files in order

1. **`index.html`** provides the page structure. It loads the styles and `app.js`.
2. **`styles.css`** determines how those elements look. Colour and font variables are at the top; responsive rules are at the bottom.
3. **`data/products.js`** contains the merchandise. Each object is one product with clearly named properties.
4. **`catalogue.js`** provides data functions such as filtering products and calculating a subtotal.
5. **`app.js`** responds to clicks and form changes, calls those functions, and updates the page.
6. **`data/information.js`** supplies the long help text used in dialogs.

`fonts.css` loads the bundled fonts. Everything the storefront needs is local; it does not fetch a catalogue or payment service.

## How a shopping interaction works

When a visitor clicks the Women's collection card, its `data-category="women"` attribute tells the click handler in `app.js` what was selected. The handler calls `goShopping({ category: 'women' })`. This updates `state`, rebuilds the available size choices, and calls `renderProducts()`.

`renderProducts()` asks `filterProducts()` in `catalogue.js` for matching products, turns each result into HTML using `productCard()`, and places the cards inside `#product-grid`. It also updates result counts and active tabs.

The same process handles search, occasion filters, sizes, and sorting. The original product data stays unchanged.

## Main functions

| File / function                                        | What it does                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| `catalogue.js` — `findProduct(id)`                     | Finds one product by its permanent ID                                    |
| `catalogue.js` — `currency(value)`                     | Formats a whole-rupee price                                              |
| `catalogue.js` — `filterProducts(options, favourites)` | Combines category, occasion, size, search, saved-only, and sorting rules |
| `catalogue.js` — `cleanCart(items)`                    | Validates saved bag entries, merges duplicates, and limits quantities    |
| `catalogue.js` — `cartTotal(cart)`                     | Gets the subtotal from current catalogue prices                          |
| `app.js` — `productImage(product)`                     | Crops the appropriate garment from its contact sheet                     |
| `app.js` — `productCard(product)`                      | Builds one card's HTML                                                   |
| `app.js` — `renderProducts()`                          | Refreshes cards, counts, and filter labels                               |
| `app.js` — `goShopping(options, scroll)`               | Resets the catalogue to a selected collection or search                  |
| `app.js` — `showProduct(id)`                           | Opens product details and size selection                                 |
| `app.js` — `toggleFavourite(id)`                       | Saves or removes a product from favourites                               |
| `app.js` — `addSelectedProduct()`                      | Validates the size and adds a product variant to the bag                 |
| `app.js` — `persistCart()` / `renderBag()`             | Save valid bag entries / refresh the bag view                            |
| `app.js` — `renderCheckoutForm()`                      | Creates the demo delivery and payment-method form                        |
| `app.js` — `reviewCheckout(form)`                      | Validates the form and displays a preview review                         |
| `app.js` — `openInfo(name)`                            | Shows the corresponding help text                                        |
| `app.js` — `renderSlide(index)`                        | Switches the visible slide and its active bar                            |
| `app.js` — `resetSlideshowTimer()`                     | Advances playback when focus, hover, and dialogs allow it                |
| `app.js` — `openDialog()` / `closeDialogs()`           | Manage native dialog overlays and page scrolling                         |
| `app.js` — `notify(message)`                           | Displays a temporary status message                                      |

Every main function has a nearby comment explaining its role. Numbered section comments in `app.js` help you navigate the file.

## HTML attributes that connect to JavaScript

| Attribute                      | Example           | Effect                                   |
| ------------------------------ | ----------------- | ---------------------------------------- |
| `data-category`                | `women`           | Opens the selected collection            |
| `data-occasion`                | `Festive`         | Filters by an occasion                   |
| `data-product`                 | `women-1`         | Opens a product                          |
| `data-save`                    | `women-1`         | Toggles its favourite status             |
| `data-size`                    | `M`               | Selects a product size                   |
| `data-info`                    | `sizes`           | Opens a help entry                       |
| `data-slide`                   | `0`               | Selects a hero slide, counting from zero |
| `data-quantity` / `data-delta` | `0` / `1`         | Adjusts the current bag entry's quantity |
| `data-close`                   | No value required | Closes the surrounding dialog            |
| `data-icon`                    | `search`          | Inserts an SVG from the icon collection  |

The main click listener uses **event delegation**: it listens on `document`, checks the clicked button's attributes, and calls the right function. This also works for cards and bag rows created after the page first loads.

## State and storage

- `state` holds the current catalogue filters, sort order, and visible-card count.
- `cart` holds `{ id, size, quantity }` entries. The same product in two sizes is two variants.
- `favourites` holds product IDs.
- `selectedProduct` and `selectedSize` belong to the open product dialog.
- `checkoutDraft` temporarily holds the open checkout form's values.

Only the bag and favourites are saved in `localStorage`, under `aurel-bag-v1` and `aurel-favourites-v1`. That storage belongs to one browser and website origin; it is not an account or database. Delivery details are never saved there. A storage event keeps two open tabs in sync.

## A few useful terms

- **DOM:** the browser's live representation of the HTML page.
- **Module:** a JavaScript file that imports or exports values. Modules need an HTTP server during local preview.
- **`$` / `$$`:** short helper names for finding one element or an array of matching elements.
- **Template literal:** text between backticks that can contain values such as `${product.name}`. Comments marked `HTML` let the formatter indent the embedded markup.
- **`escapeHTML()`:** escapes special characters before dynamic text is inserted into HTML. Keep it around customer-entered or editable text.
- **`aria-*` / `inert`:** accessibility attributes for screen readers and keyboard navigation. Keep them aligned with the visible UI.

The checkout is intentionally a preview. Its payment labels and icons display choices; they do not connect to UPI, card networks, or PayPal.
