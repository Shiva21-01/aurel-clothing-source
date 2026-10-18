/**
 * CATALOGUE AND BAG LOGIC
 * These functions use data only: they do not read or change HTML.
 * app.js uses them to render the shop; checks/catalogue.test.mjs tests them.
 * Edit merchandise in data/products.js, not in this file.
 */
import { products } from './data/products.js';

// Re-export products so app.js can import all catalogue helpers together.
export { products };

// These IDs appear first when the visitor chooses "Featured".
export const featuredIds = [
  'women-1',
  'men-2',
  'women-3',
  'kids-3',
  'men-1',
  'women-6',
  'kids-2',
  'men-4',
];

/** Find a product by its permanent ID; return undefined if it does not exist. */
export function findProduct(id) {
  return products.find((product) => product.id === id);
}

/** Format a whole-rupee amount with Indian digit grouping, for example ₹2,490. */
export function currency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Return products matching every active filter without changing the source array.
 * "all" means the category, occasion, or size filter is not applied.
 * Search matches all typed words across name, category, fabric, colour, and occasions.
 * @param {object} options - Current filter values from app.js state.
 * @param {string[]} favourites - Saved product IDs from this browser.
 * @returns {object[]} A new, sorted array of matching products.
 */
export function filterProducts(
  {
    category = 'all',
    occasion = 'all',
    size = 'all',
    query = '',
    sort = 'featured',
    savedOnly = false,
  },
  favourites = [],
) {
  const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const result = products.filter((product) => {
    const searchableText = [
      product.name,
      product.category,
      product.fabric,
      product.color,
      product.occasions.join(' '),
    ]
      .join(' ')
      .toLowerCase();

    return (
      (category === 'all' || product.category === category) &&
      (occasion === 'all' || product.occasions.includes(occasion)) &&
      (size === 'all' || product.sizes.includes(size)) &&
      (!savedOnly || favourites.includes(product.id)) &&
      searchTerms.every((term) => searchableText.includes(term))
    );
  });

  if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'featured') {
    result.sort((a, b) => {
      const firstPosition = featuredIds.indexOf(a.id);
      const secondPosition = featuredIds.indexOf(b.id);
      // An ID absent from featuredIds comes after all featured products.
      const firstRank = firstPosition < 0 ? 999 : firstPosition;
      const secondRank = secondPosition < 0 ? 999 : secondPosition;
      return firstRank - secondRank;
    });
  }
  return result;
}

/**
 * Validate bag data restored from localStorage, which may be malformed.
 * Reject unknown products/sizes and invalid quantities. Merge duplicate variants.
 * Keep only id, size, and quantity: stored prices are deliberately ignored.
 * @param {unknown} items - Saved bag data.
 * @returns {{id: string, size: string, quantity: number}[]} Clean bag entries.
 */
export function cleanCart(items) {
  if (!Array.isArray(items)) return [];
  const result = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const product = findProduct(item.id);
    if (
      !product ||
      !product.sizes.includes(item.size) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      continue;
    }
    const existing = result.find((entry) => entry.id === item.id && entry.size === item.size);
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + item.quantity);
    } else {
      result.push({
        id: item.id,
        size: item.size,
        quantity: Math.min(item.quantity, 10),
      });
    }
  }
  return result;
}

/**
 * Calculate a preview subtotal using the current catalogue prices.
 * A live store must validate prices and inventory on a trusted server as well.
 */
export function cartTotal(cart) {
  return cleanCart(cart).reduce((total, item) => {
    const product = findProduct(item.id);
    return total + product.price * item.quantity;
  }, 0);
}
