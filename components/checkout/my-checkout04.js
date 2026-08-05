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
    this.storageKey = 'main_store_cart';
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

  updated(changedProperties) {
    if (changedProperties.has('storageKey')) {
      const oldKey = changedProperties.get('storageKey');
      if (oldKey) {
        window.removeEventListener(`cart-update-${oldKey}`, this._boundSyncCart);
      }
      window.addEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
      this._syncCart();
    }
  }

  firstUpdated() {
    this._evaluateConditions();
  }

  _evaluateConditions() {
    const conditions = this.querySelectorAll('[data-show-if]');
    conditions.forEach(el => {
      const condition = el.getAttribute('data-show-if');
      if (!condition) return;
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

  _syncCart() {
    try {
      const rawCart = localStorage.getItem(this.storageKey);
      this._cartItems = rawCart ? JSON.parse(rawCart) : {};
    } catch (err) {
      this._cartItems = {};
    }
    this.requestUpdate();
  }

  _updateQuantity(id, newQuantity) {
    if (newQuantity < 0) return;
    if (newQuantity === 0) {
      delete this._cartItems[id];
    } else if (this._cartItems[id]) {
      this._cartItems[id].quantity = newQuantity;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this._cartItems));
    this.requestUpdate();
    window.dispatchEvent(new Event(`cart-update-${this.storageKey}`));
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (this._isSubmitting) return;

    this._isSubmitting = true;
    const cartArray = Object.values(this._cartItems);
    const orderTotal = cartArray.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);

    const payload = {
      amount: orderTotal,
      cartItems: cartArray,
      cust_name: this.querySelector('[name="cust_name"]')?.value || '',
      cust_email: this.querySelector('[name="cust_email"]')?.value || '',
      cust_phone: this.querySelector('[name="cust_phone"]')?.value || '',
      cust_address: this.querySelector('[name="cust_address"]')?.value || 'N/A'
    };
    if (!this.apiEndpoint || this.apiEndpoint.includes('YOUR-VERCEL-PROJECT')) {
        setTimeout(() => {
           this._showMessage('Demo order placed successfully!', true);
           this._isSubmitting = false;
        }, 1000);
        return;
}

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (data.payment_url) {
          this._showMessage('Redirecting to secure gateway...', true);
          window.location.href = data.payment_url;
        } else {
          this._showMessage('Order placed successfully!', true);
        }
      } else {
        this._showMessage(data.error || 'Failed to place order.', false);
      }
    } catch (err) {
      this._showMessage('Order submitted.', true);
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
    const totalPrice = cartArray.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);

    return html`
      ${tailwindStyles}
      <div class="bg-white p-8 rounded-2xl border border-neutral-200">
        <h2 class="text-xl font-extrabold tracking-tight text-black mb-6 border-b border-neutral-100 pb-3">Order Summary</h2>
        <div class="space-y-4 mb-6">
          ${cartArray.length === 0 ? html`
            <div class="py-6 text-center">
              <p class="text-neutral-400 font-bold text-xs uppercase tracking-wider mb-3">Your cart is empty.</p>
              <a href="./index.html#shop" class="inline-block text-xs font-bold text-black border border-black px-4 py-2 rounded-xl hover:bg-black hover:text-white transition-colors uppercase tracking-wider">
                Explore Products
              </a>
            </div>
          ` : cartArray.map(item => html`
            <div class="flex justify-between items-center border-b border-neutral-100 pb-3 gap-3">
              ${item.imageSrc ? html`
                <img src="${item.imageSrc}" alt="${item.title}" class="w-12 h-12 object-cover rounded-xl bg-neutral-100 border border-neutral-200 flex-shrink-0">
              ` : ''}
              <div class="flex flex-col flex-grow">
                <span class="font-bold text-black text-sm">${item.title}</span>
                <span class="text-xs text-neutral-500 font-semibold">$${(Number(item.price) || 0).toFixed(2)}</span>
              </div>
              <div class="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-8 w-24 bg-white flex-shrink-0">
                <button type="button" @click="${() => this._updateQuantity(item.id, item.quantity - 1)}" class="px-2 bg-neutral-100 hover:bg-black hover:text-white font-bold w-1/3 h-full transition-colors text-xs flex items-center justify-center">-</button>
                <div class="bg-white font-black text-black border-x border-neutral-200 w-1/3 text-center flex items-center justify-center h-full text-xs">${item.quantity}</div>
                <button type="button" @click="${() => this._updateQuantity(item.id, item.quantity + 1)}" class="px-2 bg-neutral-100 hover:bg-black hover:text-white font-bold w-1/3 h-full transition-colors text-xs flex items-center justify-center">+</button>
              </div>
            </div>
          `)}
        </div>
        <div class="flex justify-between items-center border-t border-neutral-200 pt-4">
          <span class="font-semibold text-xs uppercase tracking-wider text-neutral-600">Total:</span>
          <span class="font-black text-2xl text-black">$${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div class="bg-white p-8 rounded-2xl border border-neutral-200">
        <h2 class="text-xl font-extrabold tracking-tight text-black mb-6 border-b border-neutral-100 pb-3">Checkout Details</h2>
        <form @submit="${this._handleSubmit}" class="flex flex-col gap-4">
          <slot></slot>
          <button type="submit" ?disabled="${this._isSubmitting || cartArray.length === 0}" class="bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all mt-4 cursor-pointer">
            ${this._isSubmitting ? 'Processing...' : 'Place Order'}
          </button>
          <div class="min-h-6 text-xs text-center font-bold uppercase tracking-wider transition-opacity duration-500 py-2 rounded-xl border ${this._message ? 'opacity-100 border-neutral-300 bg-neutral-100 text-black' : 'opacity-0 border-transparent'}">
            ${this._message}
          </div>
        </form>
      </div>
    `;
  }
}

if (!customElements.get('my-checkout')) {
  customElements.define('my-checkout', MyCheckout);
}

export { MyCheckout };
