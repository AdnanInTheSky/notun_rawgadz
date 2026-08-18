const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// Input and Output Directory Paths
const CONTENT_DIR = path.join(__dirname, 'content', 'product');
const ROOT_OUTPUT_FILE = path.join(__dirname, 'products.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, 'public', 'products.json');
const HTML_OUTPUT_DIR = path.join(__dirname, 'product');

/**
 * Escapes HTML characters for safe injection into markup attributes/text
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalizes a variant/subproduct and recursively parses nested subproducts with price inheritance
 */
function normalizeSubProduct(sub, parentPrice = null) {
  if (!sub || typeof sub !== 'object') return null;

  const typePrice = (sub.price !== undefined && sub.price !== null && sub.price !== '')
    ? (Number(sub.price) || 0)
    : parentPrice;

  // Check for nested subproducts under subProducts, subproducts, or types
  const rawNested = Array.isArray(sub.subProducts)
    ? sub.subProducts
    : (Array.isArray(sub.subproducts)
      ? sub.subproducts
      : (Array.isArray(sub.types) ? sub.types : []));

  const subProducts = rawNested.map(item => {
    if (!item || typeof item !== 'object') return null;
    const itemPrice = (item.price !== undefined && item.price !== null && item.price !== '')
      ? (Number(item.price) || 0)
      : typePrice;

    const nestedItem = {
      subProductId: String(item.subProductId || item.id || '').trim(),
      subImage: item.subImage || item.imageSrc || item.image || '',
      subTitle: item.subTitle || item.title || ''
    };
    if (typeof itemPrice === 'number' && !isNaN(itemPrice)) {
      nestedItem.price = itemPrice;
    }
    return nestedItem;
  }).filter(Boolean);

  const normalized = {
    subProductId: String(sub.subProductId || sub.id || '').trim(),
    subImage: sub.subImage || sub.imageSrc || sub.image || '',
    subTitle: sub.subTitle || sub.title || ''
  };

  if (typeof typePrice === 'number' && !isNaN(typePrice)) {
    normalized.price = typePrice;
  }

  if (subProducts.length > 0) {
    normalized.subProducts = subProducts;
  }

  return normalized;
}

/**
 * Generates standalone static HTML pages for each product using Alpine.js CDN.
 * Zero dependency on my-product-page.js and zero fetch calls to products.json!
 */
function generateStandaloneProductHTML(product) {
  const types = Array.isArray(product.types) ? product.types : [];
  const firstType = types.length > 0 ? types[0] : null;
  const firstSub = (firstType && firstType.subProducts && firstType.subProducts.length > 0) ? firstType.subProducts[0] : null;

  const initialImage = firstSub?.subImage || firstType?.subImage || product.imageSrc;
  const initialPrice = firstSub?.price ?? firstType?.price ?? product.price;

  const tagsHtml = product.tags
    ? product.tags.split(',').map(tag => `<span class="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-neutral-200">${escapeHtml(tag.trim())}</span>`).join('\n              ')
    : '';

  // JSON safe for embedding into inline script tag
  const sanitizedProductJson = JSON.stringify(product).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(product.title)} - Rawgad</title>
  <meta name="description" content="${escapeHtml(product.description || product.title)}">
  
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Alpine.js CDN -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <!-- Web Components -->
  <script type="module" src="../components/utilities/tailwind.js"></script>
  <script type="module" src="../components/navbar/my-navbar.js"></script>
  <script type="module" src="../components/cart/my-cart.js"></script>
  <script type="module" src="../components/footer/my-footer.js"></script>
  <script type="module" src="../components/form/my-form.js"></script>
  
  <style>
    [x-cloak] { display: none !important; }
    .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }

    .product-content h1 { font-size: 1.875rem; font-weight: 900; margin-top: 1.5rem; margin-bottom: 1rem; color: #000; line-height: 1.25; letter-spacing: -0.025em; }
    .product-content h2 { font-size: 1.5rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #171717; letter-spacing: -0.02em; }
    .product-content h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #262626; }
    .product-content p { font-size: 0.95rem; line-height: 1.7; margin-bottom: 1.25rem; color: #404040; }
    .product-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #404040; }
    .product-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #404040; }
    .product-content li { margin-bottom: 0.5rem; font-size: 0.95rem; line-height: 1.6; }
    .product-content blockquote { border-left: 4px solid #171717; padding-left: 1rem; font-style: italic; margin-top: 1.25rem; margin-bottom: 1.25rem; color: #525252; }
    .product-content pre { background-color: #171717; color: #f5f5f5; padding: 1rem; overflow-x: auto; margin-top: 1.25rem; margin-bottom: 1.25rem; font-size: 0.875rem; border-radius: 0.75rem; }
    .product-content code { background-color: #f5f5f5; color: #171717; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace; }
    .product-content pre code { background-color: transparent; color: inherit; padding: 0; }
    .product-content a { color: #000; text-decoration: underline; font-weight: 600; }
    .product-content a:hover { color: #525252; }
  </style>
</head>
<body class="bg-neutral-50 min-h-screen flex flex-col font-sans text-neutral-900 selection:bg-black selection:text-white">

  <!-- Navbar -->
  <my-navbar>
    <div class="flex gap-6 items-center flex-grow">
      <a href="../index.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Home</a>
      <a href="../index.html#shop" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Shop</a>
      <a href="../car.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Cars</a>
      <a href="../blog.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Blog</a>
      <a href="../contact.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Contact</a>
    </div>
    
    <my-cart storage-key="main_store_cart"></my-cart>
  </my-navbar>

  <!-- Main Standalone Container with Alpine.js State -->
  <main class="p-4 md:p-8 flex flex-col items-center mt-6 w-full max-w-7xl mx-auto flex-grow gap-16" x-data="productPage()" x-cloak>
    <div class="w-full max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- Main Product Card -->
      <div class="bg-white rounded-3xl border border-neutral-200 overflow-hidden flex flex-col md:flex-row w-full shadow-sm">
        
        <!-- Left: Image Preview -->
        <div class="w-full md:w-1/2 bg-neutral-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-neutral-200">
          <img 
            :src="currentImage" 
            :alt="product.title" 
            src="${initialImage}" 
            alt="${escapeHtml(product.title)}"
            class="w-full max-w-md object-contain rounded-2xl mix-blend-multiply transition-all duration-300"
          >
        </div>

        <!-- Right: Details, Selectors, and Cart Controls -->
        <div class="w-full md:w-1/2 p-8 lg:p-10 flex flex-col">
          
          <!-- Tags -->
          <div class="flex flex-wrap gap-2 mb-4">
            ${tagsHtml}
          </div>

          <!-- Product Title & Description -->
          <h1 class="text-3xl lg:text-4xl font-black text-black mb-3 leading-tight tracking-tight" x-text="product.title">${escapeHtml(product.title)}</h1>
          <p class="text-neutral-500 text-sm mb-6 leading-relaxed" x-text="product.description">${escapeHtml(product.description)}</p>

          <!-- Dynamic Price Display -->
          <div class="flex items-baseline gap-3 mb-6">
            <span class="text-3xl font-black text-black tracking-tight" x-text="'$' + currentPrice.toFixed(2)">$${Number(initialPrice).toFixed(2)}</span>
            <template x-if="currentPrice !== product.price">
              <span class="text-xs font-bold text-neutral-400 line-through" x-text="'$' + Number(product.price).toFixed(2)"></span>
            </template>
          </div>

          <!-- Variant Dropdown (Level 1 Subproducts) -->
          <template x-if="product.types && product.types.length > 0">
            <div class="mb-4">
              <label for="variant-dropdown" class="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Select Variant
              </label>
              <div class="relative">
                <select 
                  id="variant-dropdown"
                  x-model.number="selectedTypeIndex" 
                  @change="selectType(selectedTypeIndex)"
                  class="w-full appearance-none bg-neutral-50 hover:bg-white border border-neutral-300 hover:border-black rounded-xl px-4 py-3.5 text-xs font-bold text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer pr-10"
                >
                  <template x-for="(type, idx) in product.types" :key="type.subProductId || idx">
                    <option 
                      :value="idx" 
                      x-text="type.subTitle + (type.price && type.price !== product.price ? ' — $' + Number(type.price).toFixed(2) : '')"
                    ></option>
                  </template>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </template>

          <!-- Subproduct Option Dropdown (Level 2 Subproducts) -->
          <template x-if="selectedType && selectedType.subProducts && selectedType.subProducts.length > 0">
            <div class="mb-6">
              <label for="option-dropdown" class="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Select Option
              </label>
              <div class="relative">
                <select 
                  id="option-dropdown"
                  x-model.number="selectedSubProductIndex"
                  @change="selectSubProduct(selectedSubProductIndex)"
                  class="w-full appearance-none bg-neutral-50 hover:bg-white border border-neutral-300 hover:border-black rounded-xl px-4 py-3.5 text-xs font-bold text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer pr-10"
                >
                  <template x-for="(sub, sIdx) in selectedType.subProducts" :key="sub.subProductId || sIdx">
                    <option 
                      :value="sIdx" 
                      x-text="sub.subTitle + (sub.price && sub.price !== (selectedType.price || product.price) ? ' — $' + Number(sub.price).toFixed(2) : '')"
                    ></option>
                  </template>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </template>

          <!-- Cart & Buy Now Action Controls -->
          <div class="mt-auto pt-6 border-t border-neutral-100 flex flex-col gap-3">
            
            <!-- Default Add to Cart / Buy Now buttons -->
            <div x-show="inCartQuantity === 0" class="flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                @click="updateCart(1)" 
                class="w-full sm:w-1/2 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center"
              >
                Add to Cart
              </button>
              <button 
                type="button"
                @click="buyNow()" 
                class="w-full sm:w-1/2 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center shadow-sm"
              >
                Buy Now
              </button>
            </div>

            <!-- In-Cart Quantity Controls -->
            <div x-show="inCartQuantity > 0" class="flex flex-col gap-2" style="display: none;">
              <div class="flex items-center justify-between border-2 border-black rounded-xl overflow-hidden h-14 bg-neutral-50">
                <button type="button" @click="updateCart(inCartQuantity - 1)" class="bg-neutral-100 hover:bg-black hover:text-white text-black font-black text-xl w-1/3 h-full transition-colors flex items-center justify-center">-</button>
                <div class="font-black text-xl text-center w-1/3 text-black bg-white flex items-center justify-center h-full" x-text="inCartQuantity">1</div>
                <button type="button" @click="updateCart(inCartQuantity + 1)" class="bg-neutral-100 hover:bg-black hover:text-white text-black font-black text-xl w-1/3 h-full transition-colors flex items-center justify-center">+</button>
              </div>
              <div class="text-xs text-center font-bold text-neutral-800 uppercase tracking-wider mt-1">Item added to cart</div>
              <button type="button" @click="buyNow()" class="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center shadow-sm">
                Buy Now
              </button>
            </div>

          </div>

        </div>
      </div>

      <!-- Markdown Overview Content Section -->
      ${product.content ? `
      <section class="bg-white rounded-3xl border border-neutral-200 p-8 lg:p-12 w-full shadow-sm">
        <h2 class="text-xl font-black text-black uppercase tracking-wider mb-6 border-b border-neutral-100 pb-4">Product Overview</h2>
        <div class="product-content text-neutral-800">
          ${product.content}
        </div>
      </section>
      ` : ''}

    </div>
  </main>

  <!-- Footer -->
  <my-footer>
    <div slot="description">
      <h3 class="text-xs font-bold text-white uppercase tracking-widest mb-2">Rawgad</h3>
      <p class="text-xs text-neutral-400 leading-relaxed">
        Engineered with Web Components and Tailwind CSS. No bloat, just speed.
      </p>
    </div>

    <div slot="social" class="flex flex-col gap-2 text-xs">
      <a href="https://twitter.com" target="_blank" class="text-neutral-400 hover:text-white transition-colors">X (Twitter)</a>
      <a href="https://instagram.com" target="_blank" class="text-neutral-400 hover:text-white transition-colors">Instagram</a>
      <a href="https://youtube.com" target="_blank" class="text-neutral-400 hover:text-white transition-colors">YouTube</a>
    </div>

    <div slot="extra">
      <h3 class="text-xs font-bold text-white uppercase tracking-widest mb-4">Newsletter</h3>
      <my-form api-endpoint="https://script.google.com/macros/s/AKfycbwnstevpnw3FdYnnuMF75_KaZk8Qi_8qqsWX0DsZ-Mr4fWahfmKMZyGHhubMj6ydxiy/exec" button-text="Subscribe">
        <input type="email" name="email" placeholder="Enter your email..." required class="border border-neutral-800 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-white w-full mb-2">
      </my-form>
    </div>
  </my-footer>

  <!-- Alpine.js Component Controller -->
  <script>
    document.addEventListener('alpine:init', () => {
      Alpine.data('productPage', () => ({
        product: ${sanitizedProductJson},
        storageKey: 'main_store_cart',
        selectedTypeIndex: 0,
        selectedSubProductIndex: 0,
        inCartQuantity: 0,

        init() {
          this.syncCart();
          window.addEventListener('storage', () => this.syncCart());
          window.addEventListener('cart-update-' + this.storageKey, () => this.syncCart());
        },

        get selectedType() {
          if (!this.product.types || this.product.types.length === 0) return null;
          return this.product.types[this.selectedTypeIndex] || this.product.types[0];
        },

        get selectedSubProduct() {
          const type = this.selectedType;
          if (!type || !type.subProducts || type.subProducts.length === 0) return null;
          return type.subProducts[this.selectedSubProductIndex] || type.subProducts[0];
        },

        get activeItem() {
          return this.selectedSubProduct || this.selectedType || this.product;
        },

        get currentImage() {
          return this.selectedSubProduct?.subImage || this.selectedType?.subImage || this.product.imageSrc;
        },

        get currentPrice() {
          if (this.selectedSubProduct && typeof this.selectedSubProduct.price === 'number') {
            return this.selectedSubProduct.price;
          }
          if (this.selectedType && typeof this.selectedType.price === 'number') {
            return this.selectedType.price;
          }
          return Number(this.product.price) || 0;
        },

        selectType(index) {
          this.selectedTypeIndex = Number(index) || 0;
          this.selectedSubProductIndex = 0;
          this.syncCart();
        },

        selectSubProduct(index) {
          this.selectedSubProductIndex = Number(index) || 0;
          this.syncCart();
        },

        getCart() {
          try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || {};
          } catch (e) {
            return {};
          }
        },

        setCart(cart) {
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(cart));
            window.dispatchEvent(new Event('cart-update-' + this.storageKey));
          } catch (e) {
            console.error('Failed to save cart:', e);
          }
        },

        syncCart() {
          const active = this.activeItem;
          const activeId = active.subProductId || active.id || this.product.id;
          const cart = this.getCart();
          this.inCartQuantity = (cart[activeId] && cart[activeId].quantity) ? cart[activeId].quantity : 0;
        },

        updateCart(newQty) {
          if (newQty < 0) return;
          const active = this.activeItem;
          const type = this.selectedType;
          const sub = this.selectedSubProduct;
          const activeId = active.subProductId || active.id || this.product.id;
          const cart = this.getCart();

          if (newQty === 0) {
            delete cart[activeId];
          } else {
            let titleSuffix = '';
            if (type && sub) {
              titleSuffix = ' (' + type.subTitle + ' - ' + sub.subTitle + ')';
            } else if (type) {
              titleSuffix = ' (' + type.subTitle + ')';
            }

            cart[activeId] = {
              id: activeId,
              title: this.product.title + titleSuffix,
              price: this.currentPrice,
              imageSrc: this.currentImage,
              quantity: newQty
            };
          }
          this.setCart(cart);
          this.syncCart();
        },

        buyNow() {
          if (this.inCartQuantity === 0) {
            this.updateCart(1);
          }
          window.location.href = '../checkout.html';
        }
      }));
    });
  </script>

</body>
</html>`;
}

/**
 * Parses markdown files and generates products.json and standalone product pages
 */
function generateProductJson() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`[build-products] Error: Directory ${CONTENT_DIR} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
  if (files.length === 0) {
    console.warn(`[build-products] Warning: No .md files found in ${CONTENT_DIR}`);
  }

  const products = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse YAML frontmatter and markdown body
    const { data, content } = matter(fileContent);

    if (!data.id || !data.title) {
      console.warn(`[build-products] Warning: Skipping ${file}. Missing required 'id' or 'title' in frontmatter.`);
      continue;
    }

    const htmlContent = marked.parse(content || '');

    const rawTypes = Array.isArray(data.types)
      ? data.types
      : (Array.isArray(data.subProducts)
        ? data.subProducts
        : (Array.isArray(data.subproducts) ? data.subproducts : []));

    const productPrice = Number(data.price) || 0;
    const types = rawTypes.map(item => normalizeSubProduct(item, productPrice)).filter(Boolean);

    const tags = Array.isArray(data.tags)
      ? data.tags.filter(Boolean).join(', ')
      : (typeof data.tags === 'string' ? data.tags : '');

    products.push({
      id: String(data.id),
      imageSrc: data.imageSrc || '',
      title: data.title,
      description: data.description || '',
      price: Number(data.price) || 0,
      tags: tags,
      types: types,
      content: htmlContent
    });
  }

  // Deterministic sort by product ID
  products.sort((a, b) => a.id.localeCompare(b.id));

  const jsonPayload = JSON.stringify(products, null, 2);

  // Write root products.json
  fs.writeFileSync(ROOT_OUTPUT_FILE, jsonPayload);
  console.log(`[build-products] Success: Compiled ${products.length} products into ${ROOT_OUTPUT_FILE}`);

  // Sync to public/products.json if public exists
  const publicDir = path.dirname(PUBLIC_OUTPUT_FILE);
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, jsonPayload);
    console.log(`[build-products] Success: Synced ${products.length} products into ${PUBLIC_OUTPUT_FILE}`);
  }

  // Build standalone HTML product pages with Alpine.js
  buildStandaloneProductPages(products);

  return products;
}

/**
 * Builds standalone HTML pages inside product/ directory
 */
function buildStandaloneProductPages(products) {
  if (!fs.existsSync(HTML_OUTPUT_DIR)) {
    fs.mkdirSync(HTML_OUTPUT_DIR, { recursive: true });
  }

  let count = 0;
  products.forEach(product => {
    const filePath = path.join(HTML_OUTPUT_DIR, `${product.id}.html`);
    fs.writeFileSync(filePath, generateStandaloneProductHTML(product));
    count++;
  });

  console.log(`[build-products] Success: Built ${count} standalone product pages (Alpine.js CDN) in ${HTML_OUTPUT_DIR}`);
}

if (require.main === module) {
  generateProductJson();
}

module.exports = {
  generateProductJson,
  buildStandaloneProductPages
};