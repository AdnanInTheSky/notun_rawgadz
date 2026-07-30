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
      <div class="flex items-center w-full bg-white border border-neutral-300 rounded-full px-4 py-1.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
        <div class="pl-1 text-neutral-400">
          <slot></slot>
        </div>
        <input 
          type="text" 
          @input="${this._handleInput}" 
          placeholder="Search by title, price, ID, or tags..." 
          class="w-full px-3 py-2 bg-transparent text-neutral-900 placeholder-neutral-400 text-sm font-medium focus:outline-none"
        >
      </div>
    `;
  }
}
customElements.define('my-search-bar', MySearchBar);