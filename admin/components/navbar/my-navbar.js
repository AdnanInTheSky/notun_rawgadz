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
      <nav class="bg-white border-b border-neutral-200 w-full shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-8 w-full">
            <a href="./index.html" class="font-black text-xl tracking-wider text-black uppercase hover:opacity-80 transition-opacity flex-shrink-0">RAWGAD</a>
            <slot></slot>
          </div>
        </div>
      </nav>
    `;
  }
}
customElements.define('my-navbar', MyNavbar);