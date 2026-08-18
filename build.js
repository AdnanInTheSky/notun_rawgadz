const fs = require('fs');
const path = require('path');
const buildProductsModule = require('./build-products');

function buildProductPages() {
  // Execute the product generator to compile products.json and standalone product pages
  if (typeof buildProductsModule === 'function') {
    return buildProductsModule();
  }
  if (buildProductsModule.generateProductJson) {
    return buildProductsModule.generateProductJson();
  }
}

if (require.main === module) {
  buildProductPages();
}

module.exports = buildProductPages;