import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MySearchBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  _handleInput(e) {
    const query = e.target.value.toLowerCase().trim();
    window.dispatchEvent(new CustomEvent('product-search', { detail: { query } }));
  }

  render() {
    return html`
      ${tailwindStyles}
      <div class="flex items-center w-full bg-white border border-gray-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400">
        <div class="pl-3 text-gray-500">
          <slot></slot>
        </div>
        <input 
          type="text" 
          @input="${this._handleInput}" 
          placeholder="Search by title, price, ID, or tags..." 
          class="w-full p-2 outline-none text-gray-700"
        >
      </div>
    `;
  }
}
customElements.define('my-search-bar', MySearchBar);