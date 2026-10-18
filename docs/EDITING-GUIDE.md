# Editing the store

Start the local preview with `npm start`. Make one change at a time, save the file, refresh your browser, and run `npm run check` after JavaScript edits.

## Change a product

Open `data/products.js` and search for its `name` or `id`. For example, the first product includes:

```js
id: 'women-1',
category: 'women',
index: 0,
name: 'The Linen Shirt',
price: 2490,
sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
```

Change `name`, `price`, `description`, `fabric`, `color`, `swatch`, `occasions`, or `sizes` as needed. Prices are whole Indian rupees. Keep the `id` stable because favourites and bag entries refer to it. Keep existing size spelling, including the dash used in children's age ranges, consistent.

To change the homepage's featured order, edit `featuredIds` near the top of `catalogue.js`.

## Add a product

Copy an object in `data/products.js`, give it an unused ID, and edit its fields. Categories are `women`, `men`, and `kids`. The catalogue and size controls use these values. The number of products shown after navigation adapts automatically.

Product pictures currently come from contact sheets, so a copied object initially shares a picture. Update the image mapping described below. Also update the static counts in `index.html` category tabs, any counts in `data/information.js`, and the sample-count assertions in `checks/catalogue.test.mjs`. New occasion names must also be added to the `#occasion-filter` dropdown in `index.html`.

## Product image mapping

`assets/women-products.webp`, `men-products.webp`, and `kids-products.webp` each have **six columns and three rows**. `index` identifies a tile, counting from zero, left to right:

| Row    | Tile indexes           |
| ------ | ---------------------- |
| Top    | 0, 1, 2, 3, 4, 5       |
| Middle | 6, 7, 8, 9, 10, 11     |
| Bottom | 12, 13, 14, 15, 16, 17 |

`productImage()` in `app.js` and `.product-image` in `styles.css` work together to crop that tile. Replacing a contact sheet with the same arrangement is the simplest change. Another 18-tile sheet can be used by setting a product's `image` to that sheet and choosing its tile index.

For separate product photographs, change `productImage()` to render an `<img>` and update the image styles; changing only the filename would still apply the contact-sheet crop.

## Change colours, fonts, and spacing

At the top of `styles.css`, edit the variables inside `:root`:

```css
--ivory: #faf8f3; /* Page background */
--ink: #30372e; /* Main text */
--olive: #394638; /* Brand colour and buttons */
--gold: #ab9270; /* Accent colour */
```

`--gutter` controls horizontal page spacing. `--serif` and `--sans` choose the heading and body fonts. If replacing font files, update `fonts.css` and retain the appropriate licenses.

The responsive sections at the end of `styles.css` cover compact desktop, tablet, phone, short desktop windows, touch screens, and reduced motion.

## Edit the hero and collection images

Hero text and campaign filenames are in `index.html`, inside `.hero-slides`. There are five slides and five matching bars. Keep `data-slide-panel` and `data-slide` indexes aligned when adding or removing slides; update their accessible labels as well.

In `app.js`, change `SLIDE_INTERVAL_MS = 6500` to adjust the delay in milliseconds. The fading transition is on `.hero-slide` in `styles.css`. Playback pauses on hover, keyboard focus, background tabs, and dialogs; reduced-motion preferences are respected.

For the women's collection image, `.women-collection > img` uses `object-position: right center`. This keeps the model visible inside the narrow card. If you replace that photo, adjust its position to suit the new composition.

## Change the brand, logo, and page information

Search `index.html` for `AURÉL` to update the wordmark, page title, and other page copy. The monogram is inline SVG; the tab icon is `assets/favicon.svg`. Check `data/information.js` and `app.js` for brand text in help and product dialogs as well.

Once the site has its own address, add `og:url` and an absolute `og:image` URL in the `<head>` for social sharing. The portable export does not point those tags at the original hosted site.

Edit help pages in `data/information.js`. Keep the keys `story`, `sizes`, `care`, `delivery`, and `payments`, because `data-info` buttons use them.

## Keep edits readable

Use two spaces per indentation level. Comments should explain a function's purpose or a non-obvious decision. When you change behaviour, update the nearby comment too.

After installing the optional formatter with `npm install`, run:

```sh
npm run format
npm run check
```

## Payments

Changing payment labels does not enable real payments. `renderCheckoutForm()` and `reviewCheckout()` build a demonstration only. A live checkout needs a trusted backend and an actual merchant integration. Do not place payment secrets in public JavaScript files.
