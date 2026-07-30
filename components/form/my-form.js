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
        headers: { 'Content-Type': 'application/json' },
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
      <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200 w-full max-w-sm">
        <form @submit="${this._handleSubmit}" class="flex flex-col gap-4">
          <slot></slot>
          <button type="submit" ?disabled="${this._isSubmitting}" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded transition-colors mt-2">
            ${this._isSubmitting ? 'Processing...' : this.buttonText}
          </button>
          <div class="h-6 text-sm text-center font-medium transition-opacity duration-500 ${this._message ? 'opacity-100' : 'opacity-0'} ${this._isSuccess ? 'text-green-600' : 'text-red-600'}">
            ${this._message}
          </div>
        </form>
      </div>
    `;
  }
}
customElements.define('my-form', MyForm);