import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

export class ResponsiveNavbar extends LitElement {
  static properties = {
    brandText: { type: String, attribute: 'brand-text' },
    brandHref: { type: String, attribute: 'brand-href' },
    _mobileOpen: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      position: sticky;
      top: 0;
      z-index: 40;
    }
  `;

  constructor() {
    super();
    this.brandText = 'RAWGAD';
    this.brandHref = './index.html';
    this._mobileOpen = false;
  }

  _toggleMobileMenu() {
    this._mobileOpen = !this._mobileOpen;
  }

  render() {
    return html`
      ${tailwindStyles}
      <nav class="bg-white/95 backdrop-blur-md border-b border-neutral-200 w-full relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <!-- Left Slot (Before Logo) -->
          <slot name="left"></slot>

          <!-- Brand Logo -->
          <a href="${this.brandHref}" class="font-black text-xl tracking-wider text-black uppercase hover:opacity-80 transition-opacity flex-shrink-0">
            ${this.brandText}
          </a>

          <!-- Main Links Slot Container (Single Slot in Shadow DOM to avoid distribution duplication bugs) -->
          <div class="
            ${this._mobileOpen ? 'flex flex-col absolute top-16 left-0 right-0 bg-white border-b border-neutral-200 p-6 shadow-xl z-50' : 'hidden'} 
            md:static md:flex md:flex-row md:items-center md:gap-6 md:p-0 md:bg-transparent md:border-none md:shadow-none md:z-auto flex-grow
          ">
            <slot></slot>
          </div>

          <!-- Right Side: Persistent Field (Items that stay in navbar header on mobile, e.g. Cart) + Mobile Hamburger Toggle -->
          <div class="flex items-center gap-3 ml-auto flex-shrink-0">
            <slot name="persistent"></slot>

            <!-- Hamburger Toggle Button (Visible on mobile only: < md) -->
            <button
              @click=${this._toggleMobileMenu}
              aria-label="Toggle Navigation Menu"
              class="md:hidden p-2 rounded-xl text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors focus:outline-none"
            >
              ${this._mobileOpen
                ? html`
                    <!-- Close Icon (X) -->
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  `
                : html`
                    <!-- Hamburger Icon -->
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  `
              }
            </button>
          </div>

        </div>
      </nav>
    `;
  }
}

customElements.define('responsive-navbar', ResponsiveNavbar);
