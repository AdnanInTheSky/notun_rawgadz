import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
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

  render() {
    if (this._loading) return html`${tailwindStyles}<div class="text-center font-bold text-gray-500 py-20">Loading product data...</div>`;
    if (this._error) return html`${tailwindStyles}<div class="text-center font-bold text-red-500 py-20">${this._error}</div>`;

    const currentImage = this._selectedType ? this._selectedType.subImage : this._product.imageSrc;

    return html`
      ${tailwindStyles}
      <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row w-full max-w-5xl mx-auto">
        
        <!-- Left: Image Gallery -->
        <div class="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-gray-200">
          <img src="${currentImage}" alt="${this._product.title}" class="w-full max-w-md object-contain rounded-lg shadow-sm mix-blend-multiply transition-all duration-300">
        </div>

        <!-- Right: Product Details & Variant Selector -->
        <div class="w-full md:w-1/2 p-8 lg:p-12 flex flex-col">
          <div class="flex flex-wrap gap-2 mb-4">
             ${this._product.tags.split(',').map(tag => html`<span class="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">${tag.trim()}</span>`)}
          </div>
          
          <h1 class="text-3xl lg:text-4xl font-black text-gray-900 mb-2 leading-tight">${this._product.title}</h1>
          <p class="text-gray-600 text-lg mb-6 leading-relaxed">${this._product.description}</p>
          <div class="text-4xl font-black text-gray-900 mb-8">$${this._product.price.toFixed(2)}</div>

          <!-- Variant Selector -->
          <div class="mb-8">
            <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Select Variant: <span class="text-blue-600 ml-1">${this._selectedType.subTitle}</span></h3>
            <div class="flex flex-wrap gap-3">
              ${this._product.types.map(type => {
                const isActive = this._selectedType.subProductId === type.subProductId;
                return html`
                  <button 
                    @click="${() => this._selectType(type)}"
                    class="px-4 py-2 border-2 rounded-md font-bold text-sm transition-all ${isActive ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}"
                  >
                    ${type.subTitle}
                  </button>
                `;
              })}
            </div>
          </div>

          <!-- Cart Controls -->
          <div class="mt-auto pt-6 border-t border-gray-100">
            ${this._inCartQuantity > 0 ? html`
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between border-2 border-blue-600 rounded-lg overflow-hidden h-14">
                  <button @click="${() => this._updateCart(this._inCartQuantity - 1)}" class="bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xl w-1/3 h-full transition-colors">-</button>
                  <div class="font-black text-xl text-center w-1/3 text-blue-900 bg-white flex items-center justify-center h-full">${this._inCartQuantity}</div>
                  <button @click="${() => this._updateCart(this._inCartQuantity + 1)}" class="bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xl w-1/3 h-full transition-colors">+</button>
                </div>
                <div class="text-sm text-center font-bold text-green-600">✓ In your cart</div>
              </div>
            ` : html`
              <button @click="${() => this._updateCart(1)}" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-4 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Add to Cart
              </button>
            `}
          </div>

        </div>
      </div>
    `;
  }
}
customElements.define('my-product-page', MyProductPage);