import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyNavbar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      position: sticky;
      top: 0;
      z-index: 40;
    }
  `;

  render() {
    return html`
      ${tailwindStyles}
      <nav class="bg-white border-b border-gray-200 shadow-sm w-full">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-8 w-full">
            <div class="font-black text-xl tracking-tighter text-blue-600">STORE</div>
            <slot></slot>
          </div>
        </div>
      </nav>
    `;
  }
}
customElements.define('my-navbar', MyNavbar);