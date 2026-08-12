import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit@3/directives/unsafe-html.js/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyProductPage extends LitElement {
  static properties = {
    productId: { type: String, attribute: 'product-id' },
    dataSource: { type: String, attribute: 'data-source' },
    storageKey: { type: String, attribute: 'storage-key' },
    _product: { state: true },
    _selectedType: { state: true },
    _inCartQuantity: { state: true },
    _loading: { state: true },
    _error: { state: true }
  };

  constructor() {
    super();
    this.productId = '';
    this.dataSource = './products.json';
    this.storageKey = 'app_cart';
    this._product = null;
    this._selectedType = null;
    this._inCartQuantity = 0;
    this._loading = true;
    this._error = '';
    
    this._boundSyncCart = this._syncCart.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('storage', this._boundSyncCart);
    window.addEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this._boundSyncCart);
    window.removeEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
  }

  async firstUpdated() {
    try {
      const response = await fetch(this.dataSource);
      if (!response.ok) throw new Error('Network response failed');
      const data = await response.json();
      
      const found = data.find(p => p.id === this.productId);
      if (!found) throw new Error('Product not found');
      
      this._product = found;
      // Default to the first type if variants exist
      if (found.types && found.types.length > 0) {
        this._selectedType = found.types[0];
      }
      
      this._syncCart();
    } catch (err) {
      this._error = 'Could not load product details.';
    } finally {
      this._loading = false;
    }
  }

  _syncCart() {
    if (!this._product || !this._selectedType) return;
    try {
      const cart = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      // Track quantity based on the subProductId, not the main ID
      this._inCartQuantity = cart[this._selectedType.subProductId] ? cart[this._selectedType.subProductId].quantity : 0;
    } catch (err) {
      this._inCartQuantity = 0;
    }
  }

  _selectType(type) {
    this._selectedType = type;
    this._syncCart(); // Re-check the cart for this specific variant
  }

  _updateCart(newTotal) {
    if (newTotal < 0 || !this._selectedType) return;
    try {
      const cart = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      const targetId = this._selectedType.subProductId;
      
      if (newTotal === 0) {
        delete cart[targetId];
      } else {
        cart[targetId] = {
          id: targetId,
          // Append the variant name to the title so it displays clearly in the cart
          title: `${this._product.title} - ${this._selectedType.subTitle}`,
          price: this._product.price,
          imageSrc: this._selectedType.subImage,
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
    const isProductSubfolder = window.location.pathname.includes('/product/') || window.location.pathname.endsWith('/product');
    window.location.href = isProductSubfolder ? '../checkout.html' : 'checkout.html';
  }

  render() {
    if (this._loading) return html`${tailwindStyles}<div class="text-center font-bold text-xs uppercase tracking-wider text-neutral-500 py-20">Loading product details...</div>`;
    if (this._error) return html`${tailwindStyles}<div class="text-center font-bold text-xs uppercase tracking-wider text-black border border-neutral-300 bg-neutral-100 p-4 rounded-2xl py-10">${this._error}</div>`;

    const currentImage = this._selectedType ? this._selectedType.subImage : this._product.imageSrc;

    return html`
      ${tailwindStyles}
      <style>
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
        <div class="bg-white rounded-3xl border border-neutral-200 overflow-hidden flex flex-col md:flex-row w-full">
          
          <!-- Left: Image Gallery -->
          <div class="w-full md:w-1/2 bg-neutral-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-neutral-200">
            <img src="${currentImage}" alt="${this._product.title}" class="w-full max-w-md object-contain rounded-2xl mix-blend-multiply transition-all duration-300">
          </div>

          <!-- Right: Product Details & Variant Selector -->
          <div class="w-full md:w-1/2 p-8 lg:p-12 flex flex-col">
            <div class="flex flex-wrap gap-2 mb-4">
               ${this._product.tags ? this._product.tags.split(',').map(tag => html`<span class="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-neutral-200">${tag.trim()}</span>`) : ''}
            </div>
            
            <h1 class="text-3xl lg:text-4xl font-black text-black mb-3 leading-tight tracking-tight">${this._product.title}</h1>
            <p class="text-neutral-500 text-sm mb-6 leading-relaxed">${this._product.description}</p>
            <div class="text-3xl font-black text-black mb-8 tracking-tight">$${this._product.price.toFixed(2)}</div>

            <!-- Variant Selector -->
            <div class="mb-8">
              <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Select Variant: <span class="text-black font-extrabold ml-1">${this._selectedType.subTitle}</span></h3>
              <div class="flex flex-wrap gap-3">
                ${this._product.types.map(type => {
                  const isActive = this._selectedType.subProductId === type.subProductId;
                  return html`
                    <button 
                      @click="${() => this._selectType(type)}"
                      class="px-4 py-2.5 border-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${isActive ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-700 hover:border-black hover:bg-neutral-50'}"
                    >
                      ${type.subTitle}
                    </button>
                  `;
                })}
              </div>
            </div>

            <!-- Cart & Buy Now Controls -->
            <div class="mt-auto pt-6 border-t border-neutral-100 flex flex-col gap-3">
              ${this._inCartQuantity > 0 ? html`
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between border-2 border-black rounded-xl overflow-hidden h-14 bg-neutral-50">
                    <button @click="${() => this._updateCart(this._inCartQuantity - 1)}" class="bg-neutral-100 hover:bg-black hover:text-white text-black font-black text-xl w-1/3 h-full transition-colors flex items-center justify-center">-</button>
                    <div class="font-black text-xl text-center w-1/3 text-black bg-white flex items-center justify-center h-full">${this._inCartQuantity}</div>
                    <button @click="${() => this._updateCart(this._inCartQuantity + 1)}" class="bg-neutral-100 hover:bg-black hover:text-white text-black font-black text-xl w-1/3 h-full transition-colors flex items-center justify-center">+</button>
                  </div>
                  <div class="text-xs text-center font-bold text-neutral-800 uppercase tracking-wider mt-1">✓ Item added to cart</div>
                </div>
                <button @click="${this._handleBuyNow}" class="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center">
                  Buy Now
                </button>
              ` : html`
                <div class="flex flex-col sm:flex-row gap-3">
                  <button @click="${() => this._updateCart(1)}" class="w-full sm:w-1/2 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center">
                    Add to Cart
                  </button>
                  <button @click="${this._handleBuyNow}" class="w-full sm:w-1/2 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-14 flex items-center justify-center">
                    Buy Now
                  </button>
                </div>
              `}
            </div>

          </div>
        </div>

        <!-- Section Below Product Section Holding Product Rich Text Content -->
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