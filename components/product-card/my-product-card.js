import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyProductCard extends LitElement {
  static properties = {
    storageKey: { type: String, attribute: 'storage-key' },
    productId: { type: String, attribute: 'product-id' },
    imageSrc: { type: String, attribute: 'image-src' },
    title: { type: String },
    description: { type: String },
    price: { type: Number },
    tags: { type: String },
    _inCartQuantity: { state: true }
  };

  constructor() {
    super();
    this.storageKey = 'app_cart';
    this.productId = 'unknown';
    this.imageSrc = '';
    this.title = 'Missing Title';
    this.description = 'No description provided.';
    this.price = 0.00;
    this.tags = '';
    this._inCartQuantity = 0;
    this._boundSyncCart = this._syncCart.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._syncCart();
    window.addEventListener('storage', this._boundSyncCart);
    window.addEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this._boundSyncCart);
    window.removeEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
  }

  _syncCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      this._inCartQuantity = cart[this.productId] ? cart[this.productId].quantity : 0;
    } catch (err) {
      this._inCartQuantity = 0;
    }
  }

  _updateCart(newTotal) {
    if (newTotal < 0) return;
    try {
      const cart = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      if (newTotal === 0) {
        delete cart[this.productId];
      } else {
        cart[this.productId] = {
          id: this.productId,
          title: this.title,
          price: this.price,
          imageSrc: this.imageSrc,
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
    const tagArray = this.tags ? this.tags.split(',').map(t => t.trim()) : [];

    return html`
      ${tailwindStyles}
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm w-72 overflow-hidden flex flex-col">
        <img src="${this.imageSrc}" alt="${this.title}" class="w-full h-48 object-cover border-b border-gray-200">
        <div class="p-4 flex flex-col flex-grow">
          <div class="flex flex-wrap gap-1 mb-2">
            ${tagArray.map(tag => html`<span class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded border border-gray-200">${tag}</span>`)}
          </div>
          <h2 class="text-lg font-bold text-gray-900 mb-1">${this.title}</h2>
          <p class="text-gray-600 text-sm mb-4 flex-grow">${this.description}</p>
          <div class="text-xl font-black text-gray-900 mb-4">$${this.price.toFixed(2)}</div>
          
          ${this._inCartQuantity > 0 ? html`
            <div class="flex items-center justify-between mb-2 border border-blue-500 rounded overflow-hidden h-10">
              <button @click="${() => this._updateCart(this._inCartQuantity - 1)}" class="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold w-1/3 h-full transition-colors">-</button>
              <div class="font-black text-lg text-center w-1/3 text-blue-900">${this._inCartQuantity}</div>
              <button @click="${() => this._updateCart(this._inCartQuantity + 1)}" class="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold w-1/3 h-full transition-colors">+</button>
            </div>
            <div class="text-xs text-center text-gray-500 mb-1">Added to cart</div>
          ` : html`
            <button @click="${() => this._updateCart(1)}" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors mb-2 h-10">
              Add to Cart
            </button>
          `}
        </div>
      </div>
    `;
  }
}
customElements.define('my-product-card', MyProductCard);