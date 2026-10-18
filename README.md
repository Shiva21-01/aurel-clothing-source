# AURÉL — Premium Apparel Storefront

A modern, responsive e-commerce storefront built with clean semantic HTML5, modern CSS3, and vanilla ES6+ JavaScript. Designed with performance and zero-dependency architecture in mind, AURÉL features catalog filtering, cart calculations, client-side state persistence, and an interactive checkout flow.

---

## 🚀 Live Demo & Preview

- **Live Site:** [Add your deployed Vercel / GitHub Pages link here]
- **Repository:** [Add your GitHub repository URL here]

---

## ✨ Features

- **Dynamic Product Catalog:** Supports 50+ curated products across categories (Men, Women, Kids) with sorting, filtering, and live search.
- **Hero Slider & Media:** Custom accessible carousel with keyboard playback controls and visual slide indicators.
- **Shopping Bag & Wishlist:** Fully interactive bag management with real-time subtotal calculations, quantity updates, and browser local storage persistence.
- **Product Details & Sizing:** Modal/flyout views detailing fabric specs, size charts, care notes, and inventory status.
- **Interactive Checkout Interface:** Step-by-step order preview supporting multiple payment methods (UPI, Cards, Net Banking).
- **Zero-Dependency Core:** Pure vanilla web architecture without heavy frontend frameworks or build steps.

---

## 🛠️ Tech Stack

- **Frontend:** Semantic HTML5, Modern CSS3 (Flexbox, CSS Grid, Custom Properties / CSS Variables)
- **Scripting:** Modern JavaScript (ES6+ Modules, DOM API, LocalStorage)
- **Development & Tooling:** Node.js (lightweight local server), Prettier for consistent code formatting

---

## 📂 Project Structure

```text
├── assets/             # Brand logos, product imagery, and local font definitions
├── checks/             # Automated test scripts for catalog & shopping calculations
├── data/
│   ├── products.js     # Structured product database (attributes, pricing, images)
│   └── information.js  # Store policies, sizing charts, and brand content
├── docs/               # Architecture notes and modification guides
├── scripts/
│   └── serve.mjs       # Development server utility
├── app.js              # Application logic, UI interactions, and cart state
├── catalogue.js        # Search, filtering, sorting, and pricing utilities
├── fonts.css           # Local typography declarations
├── index.html          # Main storefront entry page
├── styles.css          # Design system, layout components, and responsive queries
└── package.json        # Developer scripts and formatting tooling