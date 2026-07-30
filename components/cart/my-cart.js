import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyCart extends LitElement {
  static properties = {
    storageKey: { type: String, attribute: 'storage-key' },
    _cartItems: { state: true },
    _isOpen: { state: true }
  };

  constructor() {
    super();
    this.storageKey = 'app_cart';
    this._cartItems = {};
    this._isOpen = false;
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
      this._cartItems = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      this.requestUpdate();
    } catch (err) {
      this._cartItems = {};
    }
  }

  _updateQuantity(id, newQuantity) {
    if (newQuantity < 0) return;
    if (newQuantity === 0) {
      delete this._cartItems[id];
    } else {
      this._cartItems[id].quantity = newQuantity;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this._cartItems));
    this.requestUpdate(); 
    window.dispatchEvent(new Event(`cart-update-${this.storageKey}`));
  }

  _toggleSidebar() {
    this._isOpen = !this._isOpen;
  }

  _handleCheckout() {
    const totalItems = Object.values(this._cartItems).reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems === 0) return;
    window.location.href = './checkout.html';
  }

  render() {
    const cartArray = Object.values(this._cartItems);
    const totalItems = cartArray.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartArray.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return html`
      ${tailwindStyles}
      <div class="relative">
        <button @click="${this._toggleSidebar}" class="relative p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors border border-neutral-300 focus:outline-none flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          ${totalItems > 0 ? html`<span class="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-black rounded-full border-2 border-white">${totalItems}</span>` : ''}
        </button>
      </div>

      <div class="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${this._isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}" @click="${this._toggleSidebar}"></div>
      
      <div class="fixed inset-y-0 right-0 max-w-sm w-full bg-white border-l border-neutral-200 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${this._isOpen ? 'translate-x-0' : 'translate-x-full'}">
        <div class="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 class="text-base font-black text-black uppercase tracking-wider">Your Cart</h2>
          <button @click="${this._toggleSidebar}" class="p-1 text-neutral-400 hover:text-black focus:outline-none transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="flex-grow overflow-y-auto p-6 space-y-4">
          ${cartArray.length === 0 ? html`<p class="text-neutral-400 text-center mt-12 font-bold text-xs uppercase tracking-wider">Your cart is empty.</p>` : cartArray.map(item => html`
            <div class="flex gap-4 items-center bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
              <img src="${item.imageSrc}" alt="${item.title}" class="w-14 h-14 object-cover rounded-xl bg-white border border-neutral-200">
              <div class="flex flex-col flex-grow">
                <span class="font-bold text-black text-xs leading-tight mb-1">${item.title}</span>
                <span class="text-xs text-neutral-500 font-semibold">$${item.price.toFixed(2)}</span>
              </div>
              <div class="flex flex-col items-center border border-neutral-300 rounded-xl overflow-hidden bg-white">
                <button @click="${() => this._updateQuantity(item.id, item.quantity + 1)}" class="px-2.5 py-0.5 bg-neutral-100 hover:bg-black hover:text-white font-bold text-xs transition-colors">+</button>
                <div class="bg-white font-black text-black w-full text-center text-xs py-0.5">${item.quantity}</div>
                <button @click="${() => this._updateQuantity(item.id, item.quantity - 1)}" class="px-2.5 py-0.5 bg-neutral-100 hover:bg-black hover:text-white font-bold text-xs transition-colors">-</button>
              </div>
            </div>
          `)}
        </div>

        <div class="p-6 border-t border-neutral-200 bg-neutral-50">
          <div class="flex justify-between items-center mb-6">
            <span class="font-semibold text-neutral-600 text-xs uppercase tracking-wider">Total</span>
            <span class="font-extrabold text-2xl text-black">$${totalPrice.toFixed(2)}</span>
          </div>
          <button @click="${this._handleCheckout}" ?disabled="${cartArray.length === 0}" class="w-full bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all">
            Proceed to Checkout
          </button>
        </div>
      </div>
    `;
  }
}
customElements.define('my-cart', MyCart);