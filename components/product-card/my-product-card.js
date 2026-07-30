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
      <div class="bg-white border border-neutral-200 rounded-2xl w-72 overflow-hidden flex flex-col transition-all duration-300 hover:border-black">
        <img src="${this.imageSrc}" alt="${this.title}" class="w-full h-48 object-cover border-b border-neutral-100 bg-neutral-50">
        <div class="p-5 flex flex-col flex-grow">
          <div class="flex flex-wrap gap-1.5 mb-2.5">
            ${tagArray.map(tag => html`<span class="bg-neutral-100 text-neutral-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-neutral-200">${tag}</span>`)}
          </div>
          <h2 class="text-base font-bold text-black mb-1.5 tracking-tight">${this.title}</h2>
          <p class="text-neutral-500 text-xs leading-relaxed mb-4 flex-grow line-clamp-2">${this.description}</p>
          <div class="text-lg font-extrabold text-black mb-4 tracking-tight">$${this.price.toFixed(2)}</div>
          
          ${this._inCartQuantity > 0 ? html`
            <div class="flex items-center justify-between mb-2 border border-black rounded-xl overflow-hidden h-10 bg-neutral-50">
              <button @click="${() => this._updateCart(this._inCartQuantity - 1)}" class="bg-neutral-100 hover:bg-black hover:text-white text-black font-bold w-1/3 h-full transition-colors flex items-center justify-center">-</button>
              <div class="font-extrabold text-sm text-center w-1/3 text-black">${this._inCartQuantity}</div>
              <button @click="${() => this._updateCart(this._inCartQuantity + 1)}" class="bg-neutral-100 hover:bg-black hover:text-white text-black font-bold w-1/3 h-full transition-colors flex items-center justify-center">+</button>
            </div>
            <div class="text-[10px] uppercase font-bold tracking-wider text-center text-neutral-500 mb-1">In Cart</div>
          ` : html`
            <button @click="${() => this._updateCart(1)}" class="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all mb-2 h-10 flex items-center justify-center">
              Add to Cart
            </button>
          `}
        </div>
      </div>
    `;
  }
}
customElements.define('my-product-card', MyProductCard);