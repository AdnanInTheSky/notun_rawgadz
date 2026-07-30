import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyDropdown extends LitElement {
  static properties = {
    label: { type: String },
    align: { type: String },
    _isOpen: { state: true }
  };

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }
  `;

  constructor() {
    super();
    this.label = 'Select Option';
    this.align = 'left';
    this._isOpen = false;
    this._boundHandleClickOutside = this._handleClickOutside.bind(this);
    this._boundHandleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('click', this._boundHandleClickOutside);
    window.addEventListener('keydown', this._boundHandleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('click', this._boundHandleClickOutside);
    window.removeEventListener('keydown', this._boundHandleKeyDown);
  }

  _handleClickOutside(e) {
    if (this._isOpen && !e.composedPath().includes(this)) {
      this._isOpen = false;
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this._isOpen) {
      this._isOpen = false;
    }
  }

  _toggleDropdown(e) {
    e.stopPropagation();
    this._isOpen = !this._isOpen;
  }

  render() {
    const alignmentClass = this.align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left';

    return html`
      ${tailwindStyles}
      <div class="relative inline-block text-left">
        <button 
          @click="${this._toggleDropdown}" 
          type="button" 
          class="inline-flex justify-between items-center w-full rounded-full border border-neutral-300 px-4 py-2 bg-white text-xs font-semibold uppercase tracking-wider text-black hover:bg-neutral-100 transition-colors focus:outline-none focus:border-black"
        >
          <span>${this.label}</span>
          <svg class="ml-2 -mr-1 h-4 w-4 text-neutral-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>

        <div class="absolute ${alignmentClass} mt-2 w-56 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm z-50 transition-all duration-150 ${this._isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}">
          <div class="py-1 flex flex-col gap-1" role="menu">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('my-dropdown', MyDropdown);