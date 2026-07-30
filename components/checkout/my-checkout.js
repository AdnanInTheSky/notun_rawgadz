import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyCheckout extends LitElement {
  static properties = {
    apiEndpoint: { type: String, attribute: 'api-endpoint' },
    storageKey: { type: String, attribute: 'storage-key' },
    _cartItems: { state: true },
    _isSubmitting: { state: true },
    _message: { state: true },
    _isSuccess: { state: true }
  };

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: 1fr;
      align-items: start;
      gap: 2rem;
      width: 100%;
    }
    @media (min-width: 768px) {
      :host {
        grid-template-columns: 1fr 1fr;
      }
    }
  `;

  constructor() {
    super();
    this.apiEndpoint = '';
    this.storageKey = 'app_cart';
    this._cartItems = {};
    this._isSubmitting = false;
    this._message = '';
    this._isSuccess = false;
    
    this._boundSyncCart = this._syncCart.bind(this);
    this._boundEvaluateConditions = this._evaluateConditions.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._syncCart();
    window.addEventListener('storage', this._boundSyncCart);
    window.addEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
    
    this.addEventListener('input', this._boundEvaluateConditions);
    this.addEventListener('change', this._boundEvaluateConditions);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this._boundSyncCart);
    window.removeEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
    this.removeEventListener('input', this._boundEvaluateConditions);
    this.removeEventListener('change', this._boundEvaluateConditions);
  }

  firstUpdated() {
    this._evaluateConditions();
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

  _evaluateConditions() {
    const conditions = this.querySelectorAll('[data-show-if]');
    
    conditions.forEach(el => {
      const condition = el.getAttribute('data-show-if');
      const [targetName, targetValue] = condition.split(':');

      const targetInput = this.querySelector(`input[name="${targetName}"]:checked, select[name="${targetName}"], input[name="${targetName}"][type="text"], input[name="${targetName}"][type="hidden"]`);
      const currentValue = targetInput ? targetInput.value : null;

      if (currentValue === targetValue) {
        el.classList.remove('hidden');
        el.querySelectorAll('input, select, textarea').forEach(input => input.disabled = false);
      } else {
        el.classList.add('hidden');
        el.querySelectorAll('input, select, textarea').forEach(input => input.disabled = true);
      }
    });
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (this._isSubmitting) return;

    if (!this.apiEndpoint) {
      this._showMessage('Missing API Endpoint.', false);
      return;
    }

    this._isSubmitting = true;
    const payload = {};
    const lightInputs = this.querySelectorAll('input, select, textarea');
    
    lightInputs.forEach(input => {
      if (input.disabled || !input.name) return;
      if (input.type === 'radio' || input.type === 'checkbox') {
        if (input.checked) payload[input.name] = input.value;
      } else {
        payload[input.name] = input.value;
      }
    });
    
    const cartArray = Object.values(this._cartItems);
    payload.cartItems = cartArray;
    payload.orderTotal = cartArray.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        this._showMessage('Order placed successfully!', true);
        lightInputs.forEach(input => {
           if (input.type === 'radio' || input.type === 'checkbox') input.checked = false;
           else input.value = '';
        });
        this._evaluateConditions(); 
      } else {
        this._showMessage('Failed to place order.', false);
      }
    } catch (err) {
      this._showMessage('Network error occurred.', false);
    } finally {
      this._isSubmitting = false;
    }
  }

  _showMessage(msg, isSuccess) {
    this._message = msg;
    this._isSuccess = isSuccess;
    setTimeout(() => { this._message = ''; }, 5000);
  }

  render() {
    const cartArray = Object.values(this._cartItems);
    const totalPrice = cartArray.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return html`
      ${tailwindStyles}
      <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 class="text-2xl font-black text-gray-900 mb-4">Order Summary</h2>
        <div class="space-y-4 mb-4">
          ${cartArray.length === 0 ? html`<p class="text-gray-500 font-bold">Your cart is empty.</p>` : cartArray.map(item => html`
            <div class="flex justify-between items-center border-b border-gray-100 pb-3">
              <div class="flex flex-col">
                <span class="font-bold text-gray-800">${item.title}</span>
                <span class="text-sm text-gray-500">$${item.price.toFixed(2)}</span>
              </div>
              <div class="flex items-center border border-gray-300 rounded overflow-hidden h-8 w-24">
                <button type="button" @click="${() => this._updateQuantity(item.id, item.quantity - 1)}" class="px-2 bg-gray-100 hover:bg-gray-200 font-bold w-1/3 h-full">-</button>
                <div class="bg-white font-black text-gray-900 border-x border-gray-300 w-1/3 text-center flex items-center justify-center h-full text-sm">${item.quantity}</div>
                <button type="button" @click="${() => this._updateQuantity(item.id, item.quantity + 1)}" class="px-2 bg-gray-100 hover:bg-gray-200 font-bold w-1/3 h-full">+</button>
              </div>
            </div>
          `)}
        </div>
        <div class="flex justify-between items-center border-t border-gray-200 pt-4">
          <span class="font-bold text-lg text-gray-700">Total:</span>
          <span class="font-black text-2xl text-gray-900">$${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 class="text-2xl font-black text-gray-900 mb-4">Checkout Details</h2>
        <form @submit="${this._handleSubmit}" class="flex flex-col gap-4">
          <slot></slot>
          <button type="submit" ?disabled="${this._isSubmitting || cartArray.length === 0}" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors mt-4">
            ${this._isSubmitting ? 'Processing...' : 'Place Order'}
          </button>
          <div class="h-6 text-sm text-center font-medium transition-opacity duration-500 ${this._message ? 'opacity-100' : 'opacity-0'} ${this._isSuccess ? 'text-green-600' : 'text-red-600'}">
            ${this._message}
          </div>
        </form>
      </div>
    `;
  }
}
customElements.define('my-checkout', MyCheckout);