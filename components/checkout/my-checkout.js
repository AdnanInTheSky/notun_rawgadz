import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyCheckout extends LitElement {
  static properties = {
    apiEndpoint: { type: String, attribute: 'api-endpoint' },
    storageKey: { type: String, attribute: 'storage-key' },
    _cartItems: { state: true },
    _paymentMethod: { state: true },
    _couponInput: { state: true },
    _appliedCoupon: { state: true },
    _couponLoading: { state: true },
    _couponMessage: { state: true },
    _couponError: { state: true },
    _isSubmitting: { state: true },
    _orderMessage: { state: true },
    _isSuccess: { state: true },
    _placedOrder: { state: true },
    _hasSlottedContent: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.apiEndpoint = '/api/checkout';
    this.storageKey = 'main_store_cart';
    this._cartItems = {};
    this._paymentMethod = 'cod';
    this._couponInput = '';
    this._appliedCoupon = null;
    this._couponLoading = false;
    this._couponMessage = '';
    this._couponError = '';
    this._isSubmitting = false;
    this._orderMessage = '';
    this._isSuccess = false;
    this._placedOrder = null;
    this._hasSlottedContent = false;

    this._boundSyncCart = this._syncCart.bind(this);
    this._boundEvaluateConditions = this._evaluateConditions.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._syncCart();
    window.addEventListener('storage', this._boundSyncCart);
    window.addEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);

    // Event listeners to dynamically evaluate light-DOM data-show-if rules
    this.addEventListener('input', this._boundEvaluateConditions);
    this.addEventListener('change', this._boundEvaluateConditions);
    this.addEventListener('click', this._boundEvaluateConditions);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this._boundSyncCart);
    window.removeEventListener(`cart-update-${this.storageKey}`, this._boundSyncCart);
    this.removeEventListener('input', this._boundEvaluateConditions);
    this.removeEventListener('change', this._boundEvaluateConditions);
    this.removeEventListener('click', this._boundEvaluateConditions);
  }

  firstUpdated() {
    this._hasSlottedContent = this.children.length > 0;
    setTimeout(() => {
      this._evaluateConditions();
    }, 50);
  }

  _evaluateConditions() {
    // 1. Sync current checked payment method input if present in Light DOM
    const checkedPaymentInput = this.querySelector('input[name="payment_method"]:checked, input[name="payment_option"]:checked');
    if (checkedPaymentInput && checkedPaymentInput.value !== this._paymentMethod) {
      this._paymentMethod = checkedPaymentInput.value;
      this.requestUpdate();
    }

    // 2. Evaluate all [data-show-if] elements inside <my-checkout>
    const conditions = this.querySelectorAll('[data-show-if]');
    conditions.forEach(el => {
      const condition = el.getAttribute('data-show-if');
      if (!condition) return;

      const [targetName, targetValue] = condition.split(':');
      let targetInput = this.querySelector(`input[name="${targetName}"]:checked, select[name="${targetName}"], input[name="${targetName}"][type="text"], input[name="${targetName}"][type="hidden"]`);
      
      let currentValue = targetInput ? targetInput.value : (targetName === 'payment_method' || targetName === 'payment_option' ? this._paymentMethod : null);

      if (currentValue === targetValue) {
        el.classList.remove('hidden');
        el.style.display = '';
        el.querySelectorAll('input, select, textarea').forEach(input => {
          input.disabled = false;
        });
      } else {
        el.classList.add('hidden');
        el.style.display = 'none';
        el.querySelectorAll('input, select, textarea').forEach(input => {
          input.disabled = true;
        });
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

  async _handleApplyCoupon(e) {
    if (e) e.preventDefault();
    const code = this._couponInput.trim();
    if (!code) {
      this._couponError = 'Please enter a coupon code';
      return;
    }

    this._couponLoading = true;
    this._couponError = '';
    this._couponMessage = '';

    try {
      const response = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: code })
      });
      const data = await response.json();

      if (response.ok && data.valid) {
        this._appliedCoupon = {
          code: data.coupon_code,
          percent: data.discount_percent
        };
        this._couponMessage = data.message || `Coupon '${data.coupon_code}' applied! (${data.discount_percent}% OFF)`;
        this._couponError = '';
      } else {
        this._couponError = data.error || 'Invalid coupon code';
        this._appliedCoupon = null;
      }
    } catch (err) {
      this._couponError = 'Failed to validate coupon. Please try again.';
    } finally {
      this._couponLoading = false;
    }
  }

  _handleRemoveCoupon() {
    this._appliedCoupon = null;
    this._couponInput = '';
    this._couponMessage = '';
    this._couponError = '';
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (this._isSubmitting) return;

    const cartArray = Object.values(this._cartItems);
    if (cartArray.length === 0) {
      this._showMessage('Your cart is empty', false);
      return;
    }

    // Evaluate conditions to ensure disabled states are up to date
    this._evaluateConditions();

    // Query active (enabled) inputs
    const form = e.target;
    const nameInput = this.querySelector('input[name="cust_name"]:not([disabled])') || this.shadowRoot.querySelector('[name="cust_name"]');
    const emailInput = this.querySelector('input[name="cust_email"]:not([disabled])') || this.shadowRoot.querySelector('[name="cust_email"]');
    const phoneInput = this.querySelector('input[name="cust_phone"]:not([disabled])') || this.shadowRoot.querySelector('[name="cust_phone"]');
    const addressInput = this.querySelector('textarea[name="cust_address"]:not([disabled]), input[name="cust_address"]:not([disabled])') || this.shadowRoot.querySelector('[name="cust_address"]');
    const checkedPaymentInput = this.querySelector('input[name="payment_method"]:checked, input[name="payment_option"]:checked');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const paymentMethod = checkedPaymentInput ? checkedPaymentInput.value : this._paymentMethod;

    if (!name || !phone || !email) {
      this._showMessage('Please complete all required customer details.', false);
      return;
    }

    this._isSubmitting = true;
    this._orderMessage = '';

    const subtotal = cartArray.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);
    const discount = this._appliedCoupon ? (subtotal * (this._appliedCoupon.percent / 100)) : 0;
    const totalAmount = Math.max(0, subtotal - discount);

    const payload = {
      amount: totalAmount,
      cartItems: cartArray,
      cust_name: name,
      cust_email: email,
      cust_phone: phone,
      cust_address: address || 'N/A',
      payment_method: paymentMethod,
      coupon_code: this._appliedCoupon ? this._appliedCoupon.code : null
    };

    const targetEndpoint = this.apiEndpoint || '/api/checkout';

    try {
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (data.payment_url && paymentMethod === 'paystation') {
          this._showMessage('Redirecting to Paystation Payment Gateway...', true);
          window.location.href = data.payment_url;
        } else if (paymentMethod === 'cod' || data.success) {
          // Clear Cart on successful COD placement
          localStorage.removeItem(this.storageKey);
          this._syncCart();
          window.dispatchEvent(new Event(`cart-update-${this.storageKey}`));

          this._placedOrder = {
            invoice: data.invoice_number || 'INV-SUCCESS',
            amount: totalAmount,
            method: paymentMethod,
            customerName: name,
            customerPhone: phone
          };
          this._showMessage(data.message || 'Order placed successfully with Cash on Delivery!', true);
        } else {
          this._showMessage(data.message || 'Order submitted successfully!', true);
        }
      } else {
        this._showMessage(data.error || 'Failed to process order.', false);
      }
    } catch (err) {
      this._showMessage('Network error submitting order. Please check connection.', false);
    } finally {
      this._isSubmitting = false;
    }
  }

  _showMessage(msg, isSuccess) {
    this._orderMessage = msg;
    this._isSuccess = isSuccess;
  }

  render() {
    const cartArray = Object.values(this._cartItems);
    const subtotal = cartArray.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);
    const discount = this._appliedCoupon ? (subtotal * (this._appliedCoupon.percent / 100)) : 0;
    const finalTotal = Math.max(0, subtotal - discount);

    if (this._placedOrder) {
      return html`
        ${tailwindStyles}
        <div class="bg-white p-8 md:p-12 rounded-3xl border border-neutral-200 shadow-sm max-w-2xl mx-auto text-center">
          <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-2xl font-black text-black tracking-tight mb-2">Order Confirmed!</h2>
          <p class="text-neutral-500 text-sm mb-6 leading-relaxed">
            Thank you, <span class="font-bold text-black">${this._placedOrder.customerName}</span>. Your order has been placed successfully.
          </p>
          
          <div class="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 mb-8 text-left space-y-3">
            <div class="flex justify-between items-center text-xs">
              <span class="font-semibold text-neutral-500 uppercase tracking-wider">Invoice Number:</span>
              <span class="font-mono font-bold text-black">${this._placedOrder.invoice}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="font-semibold text-neutral-500 uppercase tracking-wider">Payment Method:</span>
              <span class="font-bold text-blue-600 uppercase tracking-wider">${this._placedOrder.method.toUpperCase()}</span>
            </div>
            <div class="flex justify-between items-center text-xs border-t border-neutral-200 pt-3">
              <span class="font-bold text-neutral-700 uppercase tracking-wider">Total Payable:</span>
              <span class="font-black text-lg text-black">BDT ${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <a href="./index.html#shop" class="inline-block bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-xl transition-all">
            Continue Shopping
          </a>
        </div>
      `;
    }

    return html`
      ${tailwindStyles}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        <!-- Left Column: Checkout Inputs (7 Cols) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          <div class="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm">
            <h2 class="text-lg font-black text-black uppercase tracking-wider border-b border-neutral-100 pb-3 mb-6">
              Checkout Options & Details
            </h2>

            <form id="checkout-main-form" @submit="${this._handleSubmit}" class="flex flex-col gap-6">
              <!-- Slotted HTML Content from checkout.html -->
              <slot></slot>

              <!-- Fallback Default Content if no slot provided -->
              ${!this._hasSlottedContent ? html`
                <div class="space-y-6">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Select Payment Method</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label @click="${() => { this._paymentMethod = 'cod'; }}" class="cursor-pointer border-2 rounded-2xl p-4 flex items-center gap-3 ${this._paymentMethod === 'cod' ? 'border-black bg-neutral-50' : 'border-neutral-200'}">
                        <input type="radio" name="payment_method" value="cod" .checked="${this._paymentMethod === 'cod'}" class="w-4 h-4 text-black focus:ring-black">
                        <div>
                          <span class="font-bold text-xs uppercase tracking-wider block text-black">Cash on Delivery</span>
                          <span class="text-[11px] text-neutral-500">Pay when delivered</span>
                        </div>
                      </label>
                      <label @click="${() => { this._paymentMethod = 'paystation'; }}" class="cursor-pointer border-2 rounded-2xl p-4 flex items-center gap-3 ${this._paymentMethod === 'paystation' ? 'border-black bg-neutral-50' : 'border-neutral-200'}">
                        <input type="radio" name="payment_method" value="paystation" .checked="${this._paymentMethod === 'paystation'}" class="w-4 h-4 text-black focus:ring-black">
                        <div>
                          <span class="font-bold text-xs uppercase tracking-wider block text-black">Online Payment</span>
                          <span class="text-[11px] text-neutral-500">bKash, Nagad, Cards</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <label class="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Full Name *</label>
                      <input type="text" name="customer_name" required placeholder="Your full name" class="w-full border border-neutral-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Email Address</label>
                        <input type="email" name="customer_email" placeholder="you@example.com" class="w-full border border-neutral-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black">
                      </div>
                      <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Mobile Phone (BD) *</label>
                        <input type="tel" name="customer_phone" required placeholder="017xxxxxxxx" class="w-full border border-neutral-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black">
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Delivery Address *</label>
                      <textarea name="delivery_address" required rows="3" placeholder="Full street address, flat/house number, city" class="w-full border border-neutral-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black"></textarea>
                    </div>
                  </div>
                </div>
              ` : ''}

            </form>
          </div>
        </div>

        <!-- Right Column: Order Summary & Review (5 Cols) -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          <div class="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm sticky top-6">
            <h2 class="text-lg font-black text-black uppercase tracking-wider border-b border-neutral-100 pb-3 mb-6">
              Order Summary (${cartArray.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>

            <!-- Cart Items List -->
            <div class="space-y-4 mb-6 max-h-72 overflow-y-auto pr-1">
              ${cartArray.length === 0 ? html`
                <div class="py-8 text-center">
                  <p class="text-neutral-400 font-bold text-xs uppercase tracking-wider mb-3">Your cart is empty.</p>
                  <a href="./index.html#shop" class="inline-block text-xs font-bold text-black border border-black px-4 py-2 rounded-xl hover:bg-black hover:text-white transition-colors uppercase tracking-wider">
                    Browse Shop
                  </a>
                </div>
              ` : cartArray.map(item => html`
                <div class="flex items-center gap-3 border-b border-neutral-100 pb-3">
                  ${item.imageSrc ? html`
                    <img src="${item.imageSrc}" alt="${item.title}" class="w-12 h-12 object-cover rounded-xl bg-neutral-100 border border-neutral-200 flex-shrink-0">
                  ` : ''}
                  <div class="flex flex-col flex-grow">
                    <span class="font-bold text-black text-xs leading-tight">${item.title}</span>
                    <span class="text-[11px] text-neutral-500 font-medium">BDT ${(Number(item.price) || 0).toFixed(2)} each</span>
                  </div>
                  <div class="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-8 w-20 bg-white flex-shrink-0">
                    <button type="button" @click="${() => this._updateQuantity(item.id, item.quantity - 1)}" class="px-2 bg-neutral-100 hover:bg-black hover:text-white font-bold w-1/3 h-full transition-colors text-xs flex items-center justify-center">-</button>
                    <div class="bg-white font-black text-black text-center w-1/3 flex items-center justify-center h-full text-xs">${item.quantity}</div>
                    <button type="button" @click="${() => this._updateQuantity(item.id, item.quantity + 1)}" class="px-2 bg-neutral-100 hover:bg-black hover:text-white font-bold w-1/3 h-full transition-colors text-xs flex items-center justify-center">+</button>
                  </div>
                </div>
              `)}
            </div>

            <!-- Coupon Code Input System -->
            <div class="mb-6 pt-4 border-t border-neutral-100">
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Discount Coupon</label>
              
              ${this._appliedCoupon ? html`
                <div class="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-lg">${this._appliedCoupon.code}</span>
                    <span class="text-xs font-bold">${this._appliedCoupon.percent}% OFF Applied</span>
                  </div>
                  <button type="button" @click="${this._handleRemoveCoupon}" class="text-xs font-bold text-rose-600 hover:underline">
                    Remove
                  </button>
                </div>
              ` : html`
                <form @submit="${this._handleApplyCoupon}" class="flex gap-2">
                  <input 
                    type="text" 
                    .value="${this._couponInput}"
                    @input="${e => this._couponInput = e.target.value}"
                    placeholder="Enter coupon (e.g. RAWGAD10)" 
                    class="flex-grow border border-neutral-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-black font-semibold uppercase"
                  >
                  <button 
                    type="submit" 
                    ?disabled="${this._couponLoading || !this._couponInput.trim()}"
                    class="bg-neutral-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex-shrink-0"
                  >
                    ${this._couponLoading ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              `}

              ${this._couponError ? html`
                <div class="text-[11px] font-bold text-rose-600 mt-2">${this._couponError}</div>
              ` : ''}
              ${this._couponMessage && !this._appliedCoupon ? html`
                <div class="text-[11px] font-bold text-emerald-600 mt-2">${this._couponMessage}</div>
              ` : ''}
            </div>

            <!-- Price Calculation Summary -->
            <div class="space-y-2 border-t border-neutral-200 pt-4 mb-6">
              <div class="flex justify-between items-center text-xs">
                <span class="font-semibold text-neutral-500 uppercase tracking-wider">Subtotal:</span>
                <span class="font-bold text-black">BDT ${subtotal.toFixed(2)}</span>
              </div>

              ${discount > 0 ? html`
                <div class="flex justify-between items-center text-xs text-emerald-600">
                  <span class="font-bold uppercase tracking-wider">Coupon Discount (${this._appliedCoupon?.percent}%):</span>
                  <span class="font-bold">-BDT ${discount.toFixed(2)}</span>
                </div>
              ` : ''}

              <div class="flex justify-between items-center text-xs">
                <span class="font-semibold text-neutral-500 uppercase tracking-wider">Shipping Fee:</span>
                <span class="font-bold text-emerald-600 uppercase">Free</span>
              </div>

              <div class="flex justify-between items-center border-t border-neutral-200 pt-3 text-base">
                <span class="font-black text-xs uppercase tracking-wider text-neutral-800">Total Payable:</span>
                <span class="font-black text-2xl text-black">BDT ${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <!-- Main Submit Button -->
            <button 
              type="submit" 
              form="checkout-main-form"
              ?disabled="${this._isSubmitting || cartArray.length === 0}" 
              class="w-full bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              ${this._isSubmitting ? html`
                <svg class="animate-spin h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Order...
              ` : (this._paymentMethod === 'cod' ? 'Place Order (Cash on Delivery)' : 'Proceed to Paystation Gateway')}
            </button>

            <!-- Order Status Message Banner -->
            ${this._orderMessage ? html`
              <div class="mt-4 p-3 rounded-xl text-xs text-center font-bold uppercase tracking-wider border ${
                this._isSuccess 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }">
                ${this._orderMessage}
              </div>
            ` : ''}

          </div>

        </div>

      </div>
    `;
  }
}

if (!customElements.get('my-checkout')) {
  customElements.define('my-checkout', MyCheckout);
}

export { MyCheckout };