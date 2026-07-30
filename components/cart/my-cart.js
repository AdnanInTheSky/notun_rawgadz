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
        <button @click="${this._toggleSidebar}" class="relative p-2 text-gray-600 hover:text-blue-600 transition-colors focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          ${totalItems > 0 ? html`<span class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">${totalItems}</span>` : ''}
        </button>
      </div>

      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${this._isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}" @click="${this._toggleSidebar}"></div>
      
      <div class="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${this._isOpen ? 'translate-x-0' : 'translate-x-full'}">
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 class="text-xl font-black text-gray-900">Your Cart</h2>
          <button @click="${this._toggleSidebar}" class="text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="flex-grow overflow-y-auto p-4 space-y-4">
          ${cartArray.length === 0 ? html`<p class="text-gray-500 text-center mt-10 font-bold">Your cart is empty.</p>` : cartArray.map(item => html`
            <div class="flex gap-4 items-center bg-gray-50 p-2 rounded border border-gray-100">
              <img src="${item.imageSrc}" alt="${item.title}" class="w-16 h-16 object-cover rounded bg-white border border-gray-200">
              <div class="flex flex-col flex-grow">
                <span class="font-bold text-gray-800 text-sm leading-tight mb-1">${item.title}</span>
                <span class="text-xs text-gray-500 font-medium">$${item.price.toFixed(2)}</span>
              </div>
              <div class="flex flex-col items-center border border-gray-300 rounded overflow-hidden">
                <button @click="${() => this._updateQuantity(item.id, item.quantity + 1)}" class="px-2 bg-gray-100 hover:bg-gray-200 font-bold text-xs">+</button>
                <div class="bg-white font-black text-gray-900 w-full text-center text-xs py-1">${item.quantity}</div>
                <button @click="${() => this._updateQuantity(item.id, item.quantity - 1)}" class="px-2 bg-gray-100 hover:bg-gray-200 font-bold text-xs">-</button>
              </div>
            </div>
          `)}
        </div>

        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <div class="flex justify-between items-center mb-4">
            <span class="font-bold text-gray-600 text-lg">Total</span>
            <span class="font-black text-2xl text-gray-900">$${totalPrice.toFixed(2)}</span>
          </div>
          <button @click="${this._handleCheckout}" ?disabled="${cartArray.length === 0}" class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors shadow-md">
            Proceed to Checkout
          </button>
        </div>
      </div>
    `;
  }
}
customElements.define('my-cart', MyCart);