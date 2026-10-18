/**
 * Run with npm test. These Node tests check shopping data without a browser.
 * Keep the expected sample counts in sync if you deliberately expand the catalogue.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { products, findProduct, filterProducts, cleanCart, cartTotal } from '../catalogue.js';

test('each collection has 18 distinct, purchasable-size product concepts', () => {
  assert.equal(products.length, 54);
  assert.equal(new Set(products.map((item) => item.id)).size, 54);
  for (const category of ['women', 'men', 'kids']) {
    const collection = products.filter((item) => item.category === category);
    assert.equal(collection.length, 18);
    assert.deepEqual(
      collection.map((item) => item.index),
      Array.from({ length: 18 }, (_, index) => index),
    );
    for (const item of collection) {
      assert.ok(item.sizes.length > 0);
      assert.equal(new Set(item.sizes).size, item.sizes.length);
      assert.ok(item.occasions.length > 0);
      assert.ok(Number.isInteger(item.price) && item.price > 0);
      assert.ok(item.name && item.description && item.image);
    }
  }
});

test('category, occasion, size, and search combine without leaking other collections', () => {
  const results = filterProducts({ category: 'men', occasion: 'Work', size: 'M', query: 'polo' });
  assert.deepEqual(
    results.map((item) => item.id),
    ['men-2'],
  );
  assert.equal(filterProducts({ category: 'kids', size: 'XXL' }).length, 0);
  assert.equal(filterProducts({ category: 'women', occasion: 'Play' }).length, 0);
});

test('search is case-insensitive, handles multiple words, and finds materials and occasions', () => {
  assert.ok(filterProducts({ query: '  OLIVE   POLO  ' }).some((item) => item.id === 'men-2'));
  assert.ok(
    filterProducts({ query: 'festive kids' }).every(
      (item) => item.category === 'kids' && item.occasions.includes('Festive'),
    ),
  );
  assert.equal(filterProducts({ query: '<script>alert(1)</script>' }).length, 0);
});

test('sorting and saved-only filters respect the selected catalogue', () => {
  const low = filterProducts({ category: 'women', sort: 'price-low' });
  assert.ok(low.every((item, index) => index === 0 || item.price >= low[index - 1].price));
  const high = filterProducts({ sort: 'price-high' });
  assert.ok(high.every((item, index) => index === 0 || item.price <= high[index - 1].price));
  assert.deepEqual(
    filterProducts({ savedOnly: true, category: 'kids' }, ['kids-2', 'women-1', 'missing']).map(
      (item) => item.id,
    ),
    ['kids-2'],
  );
});

test('cart rejects invalid products, invalid sizes, invalid quantities, and malformed storage', () => {
  assert.deepEqual(cleanCart(null), []);
  assert.deepEqual(cleanCart('invalid'), []);
  assert.deepEqual(
    cleanCart([
      null,
      {},
      { id: 'missing', size: 'M', quantity: 1 },
      { id: 'men-1', size: '100', quantity: 2 },
      { id: 'men-1', size: 'M', quantity: -1 },
      { id: 'men-1', size: 'M', quantity: 1.5 },
    ]),
    [],
  );
});

test('cart merges identical variants, retains different sizes, and caps quantity at ten', () => {
  assert.deepEqual(
    cleanCart([
      { id: 'men-1', size: 'M', quantity: 8 },
      { id: 'men-1', size: 'M', quantity: 5 },
      { id: 'men-1', size: 'L', quantity: 2 },
    ]),
    [
      { id: 'men-1', size: 'M', quantity: 10 },
      { id: 'men-1', size: 'L', quantity: 2 },
    ],
  );
});

test('totals derive from catalogue prices rather than browser-stored price values', () => {
  const bag = [
    { id: 'women-1', size: 'S', quantity: 2, price: 1 },
    { id: 'kids-3', size: '5–6Y', quantity: 1, price: 0 },
  ];
  assert.equal(cartTotal(bag), findProduct('women-1').price * 2 + findProduct('kids-3').price);
  assert.equal(cartTotal([]), 0);
});
