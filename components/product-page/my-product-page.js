import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit@3/directives/unsafe-html.js/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyProductPage extends LitElement {
  static properties = {
    productId: { type: String, attribute: 'product-id' },
    dataSource: { type: String, attribute: 'data-source' },
    storageKey: { type: String, attribute: 'storage-key' },
    productData: { type: Object, attribute: 'product-data' },
    _product: { state: true },
    _selectedType: { state: true },
    _selectedSubProduct: { state: true },
    _inCartQuantity: { state: true },
    _loading: { state: true },
    _error: { state: true }
  };

  constructor() {
    super();
    this.productId = '';
    this.dataSource = '../products.json';
    this.storageKey = 'app_cart';
    this.productData = null;
    this._product = null;
    this._selectedType = null;
    this._selectedSubProduct = null;
    this._inCartQuantity = 0;
    this._loading = true;
    this._error = '';
    
    this._boundSyncCart = this._syncCart.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadInitialData();
    window.addEventListener('storage', this._boundSyncCart);
    window.addEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this._boundSyncCart);
    window.removeEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
  }

  /**
   * Reads inlined standalone data immediately (Zero network fetch)
   */
  _loadInitialData() {
    // 1. Direct property assignment
    if (this.productData && typeof this.productData === 'object') {
      this._initializeProduct(this.productData);
      return;
    }

    // 2. Embedded JSON script tag inside the component
    const inlineScript = this.querySelector('script[type="application/json"]') || 
                         document.getElementById('standalone-product-data') ||
                         document.getElementById(`product-data-${this.productId}`);
    if (inlineScript && inlineScript.textContent) {
      try {
        const parsed = JSON.parse(inlineScript.textContent.trim());
        if (parsed && (parsed.id === this.productId || !this.productId || parsed.title)) {
          this._initializeProduct(parsed);
          return;
        }
      } catch (err) {
        console.warn('Failed to parse inline product JSON script:', err);
      }
    }

    // 3. Stringified product-data attribute
    if (this.hasAttribute('product-data')) {
      try {
        const parsed = JSON.parse(this.getAttribute('product-data'));
        if (parsed) {
          this._initializeProduct(parsed);
          return;
        }
      } catch (err) {
        console.warn('Failed to parse product-data attribute:', err);
      }
    }
  }

  async firstUpdated() {
    // If standalone data was loaded synchronously, sync cart and skip network request
    if (this._product) {
      this._syncCart();
      return;
    }

    // Fallback: Fetch over network only if no standalone data was found
    try {
      const response = await fetch(this.dataSource);
      if (!response.ok) throw new Error('Network response failed');
      const data = await response.json();
      
      const found = Array.isArray(data) ? data.find(p => p.id === this.productId) : data;
      if (!found) throw new Error('Product not found');
      
      this._initializeProduct(found);
    } catch (err) {
      this._error = 'Could not load product details.';
    } finally {
      this._loading = false;
    }
  }

  _initializeProduct(product) {
    this._product = product;
    this._loading = false;
    this._error = '';

    // Initialize first variant and nested subproduct
    if (product.types && product.types.length > 0) {
      this._selectedType = product.types[0];
      if (this._selectedType.subProducts && this._selectedType.subProducts.length > 0) {
        this._selectedSubProduct = this._selectedType.subProducts[0];
      } else {
        this._selectedSubProduct = null;
      }
    } else {
      this._selectedType = null;
      this._selectedSubProduct = null;
    }

    this._syncCart();
  }

  _getCurrentPrice() {
    if (this._selectedSubProduct && typeof this._selectedSubProduct.price === 'number') {
      return this._selectedSubProduct.price;
    }
    if (this._selectedType && typeof this._selectedType.price === 'number') {
      return this._selectedType.price;
    }
    return Number(this._product?.price) || 0;
  }

  _syncCart() {
    if (!this._product || !this._selectedType) return;
    try {
      const cart = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      const activeId = this._selectedSubProduct ? this._selectedSubProduct.subProductId : this._selectedType.subProductId;
      this._inCartQuantity = cart[activeId] ? cart[activeId].quantity : 0;
    } catch (err) {
      this._inCartQuantity = 0;
    }
  }

  _selectType(type) {
    this._selectedType = type;
    if (type && type.subProducts && type.subProducts.length > 0) {
      this._selectedSubProduct = type.subProducts[0];
    } else {
      this._selectedSubProduct = null;
    }
    this._syncCart();
  }

  _selectSubProduct(sub) {
    this._selectedSubProduct = sub;
    this._syncCart();
  }

  _updateCart(newTotal) {
    if (newTotal < 0 || !this._selectedType) return;
    try {
      const cart = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      const activeItem = this._selectedSubProduct || this._selectedType;
      const targetId = activeItem.subProductId;
      
      if (newTotal === 0) {
        delete cart[targetId];
      } else {
        const titleSuffix = this._selectedSubProduct
          ? `${this._selectedType.subTitle} - ${this._selectedSubProduct.subTitle}`
          : this._selectedType.subTitle;

        const effectivePrice = this._getCurrentPrice();

        cart[targetId] = {
          id: targetId,
          title: `${this._product.title} (${titleSuffix})`,
          price: effectivePrice,
          imageSrc: activeItem.subImage || this._selectedType.subImage || this._product.imageSrc,
          quantity: newTotal
        };
      }
      localStorage.setItem(this.storageKey, JSON.stringify(cart));
      this._syncCart();
      window.dispatchEvent(new Event(`cart-update-${this.storageKey}`));
    } catch (err) {
      console.error('Failed to save to cart:', err);
    }
  }

  _handleBuyNow() {
    if (!this._selectedType) return;
    if (this._inCartQuantity === 0) {
      this._updateCart(1);
    }
    window.location.href = '/checkout.html';
  }

  render() {
    if (this._loading) return html`${tailwindStyles}<div class="text-center font-bold text-xs uppercase tracking-wider text-neutral-500 py-20">Loading product details...</div>`;
    if (this._error) return html`${tailwindStyles}<div class="text-center font-bold text-xs uppercase tracking-wider text-black border border-neutral-300 bg-neutral-100 p-4 rounded-2xl py-10">${this._error}</div>`;

    const currentImage = (this._selectedSubProduct && this._selectedSubProduct.subImage)
      || (this._selectedType && this._selectedType.subImage)
      || this._product.imageSrc;

    const currentPrice = this._getCurrentPrice();
    const typeCount = this._product.types?.length || 0;
    const subProductCount = this._selectedType?.subProducts?.length || 0;

    return html`
      ${tailwindStyles}
      <style>
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

      <div class="w-full max-w-5xl mx-auto flex flex-col gap-8">
        <!-- Main Product Card -->
        <div class="bg-white rounded-3xl border border-neutral-200 overflow-hidden flex flex-col md:flex-row w-full shadow-sm">
          
          <!-- Left: Image Gallery -->
          <div class="w-full md:w-1/2 bg-neutral-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-neutral-200">
            <img src="${currentImage}" alt="${this._product.title}" class="w-full max-w-md object-contain rounded-2xl mix-blend-multiply transition-all duration-300">
          </div>

          <!-- Right: Product Details & Variant Selector -->
          <div class="w-full md:w-1/2 p-8 lg:p-10 flex flex-col">
            <div class="flex flex-wrap gap-2 mb-4">
               ${this._product.tags ? this._product.tags.split(',').map(tag => html`<span class="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-neutral-200">${tag.trim()}</span>`) : ''}
            </div>
            
            <h1 class="text-3xl lg:text-4xl font-black text-black mb-3 leading-tight tracking-tight">${this._product.title}</h1>
            <p class="text-neutral-500 text-sm mb-6 leading-relaxed">${this._product.description}</p>
            
            <!-- Dynamic Price with Currency -->
            <div class="flex items-baseline gap-3 mb-6">
              <span class="text-3xl font-black text-black tracking-tight">$${currentPrice.toFixed(2)}</span>
              ${this._selectedSubProduct?.price && this._selectedSubProduct.price !== this._product.price ? html`
                <span class="text-xs font-bold text-neutral-400 line-through">$${this._product.price.toFixed(2)}</span>
              ` : ''}
            </div>

            <!-- Variant Selector (Level 1 Subproducts - Supports 10+ types) -->
            ${typeCount > 0 ? html`
              <div class="mb-5">
                <div class="flex justify-between items-center mb-2.5">
                  <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    Select Variant: <span class="text-black font-black ml-1">${this._selectedType ? this._selectedType.subTitle : ''}</span>
                  </h3>
                  ${typeCount > 4 ? html`
                    <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">${typeCount} Variants</span>
                  ` : ''}
                </div>
                
                <div class="flex flex-wrap gap-2 ${typeCount > 8 ? 'max-h-36 overflow-y-auto custom-scroll pr-1' : ''}">
                  ${this._product.types.map(type => {
                    const isActive = this._selectedType && this._selectedType.subProductId === type.subProductId;
                    return html`
                      <button 
                        @click="${() => this._selectType(type)}"
                        class="px-3.5 py-2 border-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${isActive ? 'border-black bg-black text-white shadow-sm' : 'border-neutral-200 text-neutral-700 bg-white hover:border-neutral-400 hover:bg-neutral-50'}"
                      >
                        <span>${type.subTitle}</span>
                        ${type.price && type.price !== this._product.price ? html`
                          <span class="text-[10px] opacity-75">($${type.price})</span>
                        ` : ''}
                      </button>
                    `;
                  })}
                </div>
              </div>
            ` : ''}

            <!-- Sub-Variant Selector (Level 2 Subproducts - Supports 10+ subproducts) -->
            ${subProductCount > 0 ? html`
              <div class="mb-6">
                <div class="flex justify-between items-center mb-2.5">
                  <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    Select Option: <span class="text-black font-black ml-1">${this._selectedSubProduct ? this._selectedSubProduct.subTitle : ''}</span>
                  </h3>
                  ${subProductCount > 4 ? html`
                    <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">${subProductCount} Options</span>
                  ` : ''}
                </div>

                <div class="flex flex-wrap gap-2 ${subProductCount > 8 ? 'max-h-36 overflow-y-auto custom-scroll pr-1' : ''}">
                  ${this._selectedType.subProducts.map(sub => {
                    const isSubActive = this._selectedSubProduct && this._selectedSubProduct.subProductId === sub.subProductId;
                    return html`
                      <button 
                        @click="${() => this._selectSubProduct(sub)}"
                        class="px-3 py-2 border-2 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center gap-1.5 ${isSubActive ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'}"
                      >
                        <span>${sub.subTitle}</span>
                        ${sub.price && sub.price !== (this._selectedType?.price || this._product.price) ? html`
                          <span class="text-[10px] ${isSubActive ? 'text-neutral-300' : 'text-neutral-500'}">($${sub.price})</span>
                        ` : ''}
                      </button>
                    `;
                  })}
                </div>
              </div>
            ` : ''}

            <!-- Cart & Buy Now Controls -->
            <div class="mt-auto pt-6 border-t border-neutral-100 flex flex-col gap-3">
              ${this._inCartQuantity > 0 ? html`
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between border-2 border-black rounded-xl overflow-hidden h-14 bg-neutral-50">
                    <button @click="${() => this._updateCart(this._inCartQuantity - 1)}" class="bg-neutral-100 hover:bg-black hover:text-white text-black font-black text-xl w-1/3 h-full transition-colors flex items-center justify-center">-</button>
                    <div class="font-black text-xl text-center w-1/3 text-black bg-white flex items-center justify-center h-full">${this._inCartQuantity}</div>
                    <button @click="${() => this._updateCart(this._inCartQuantity + 1)}" class="bg-neutral-100 hover:bg-black hover:text-white text-black font-black text-xl w-1/3 h-full transition-colors flex items-center justify-center">+</button>
                  </div>
                  <div class="text-xs text-center font-bold text-neutral-800 uppercase tracking-wider mt-1">Item added to cart</div>
                </div>
                <button @click="${this._handleBuyNow}" class="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center shadow-sm">
                  Buy Now
                </button>
              ` : html`
                <div class="flex flex-col sm:flex-row gap-3">
                  <button @click="${() => this._updateCart(1)}" class="w-full sm:w-1/2 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center">
                    Add to Cart
                  </button>
                  <button @click="${this._handleBuyNow}" class="w-full sm:w-1/2 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center shadow-sm">
                    Buy Now
                  </button>
                </div>
              `}
            </div>

          </div>
        </div>

        <!-- Rich Markdown Overview Section -->
        ${this._product.content ? html`
          <section class="bg-white rounded-3xl border border-neutral-200 p-8 lg:p-12 w-full shadow-sm">
            <h2 class="text-xl font-black text-black uppercase tracking-wider mb-6 border-b border-neutral-100 pb-4">Product Overview</h2>
            <div class="product-content text-neutral-800">
              ${unsafeHTML(this._product.content)}
            </div>
          </section>
        ` : ''}
      </div>
    `;
  }
}
customElements.define('my-product-page', MyProductPage);