import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyForm extends LitElement {
  static properties = {
    apiEndpoint: { type: String, attribute: 'api-endpoint' },
    buttonText: { type: String, attribute: 'button-text' },
    _isSubmitting: { state: true },
    _message: { state: true },
    _isSuccess: { state: true }
  };

  constructor() {
    super();
    this.apiEndpoint = '';
    this.buttonText = 'Submit';
    this._isSubmitting = false;
    this._message = '';
    this._isSuccess = false;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (this._isSubmitting) return;

    if (!this.apiEndpoint) {
      this._showMessage('Missing API Endpoint.', false);
      return;
    }

    this._isSubmitting = true;
    const form = e.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
    const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Bypasses CORS
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        this._showMessage('Success!', true);
        form.reset();
      } else {
        this._showMessage('Failed to submit.', false);
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
    return html`
      ${tailwindStyles}
      <div class="bg-white p-6 rounded-2xl border border-neutral-200 w-full max-w-sm">
        <form @submit="${this._handleSubmit}" class="flex flex-col gap-4">
          <slot></slot>
          <button type="submit" ?disabled="${this._isSubmitting}" class="bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all mt-2">
            ${this._isSubmitting ? 'Processing...' : this.buttonText}
          </button>
          <div class="min-h-6 text-xs text-center font-bold uppercase tracking-wider transition-opacity duration-500 py-1.5 rounded-lg border ${this._message ? 'opacity-100 border-neutral-300 bg-neutral-100 text-black' : 'opacity-0 border-transparent'}">
            ${this._message}
          </div>
        </form>
      </div>
    `;
  }
}
customElements.define('my-form', MyForm);