import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

export class FilterSidebar extends LitElement {
  static properties = {
    title: { type: String },
    contentTarget: { type: String, attribute: 'content-target' },
    _open: { state: true }
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
    }
    .drawer-closed {
      transform: translateX(-100%) !important;
    }
    .drawer-open {
      transform: translateX(0) !important;
    }
  `;

  constructor() {
    super();
    this.title = 'Product Filters';
    this.contentTarget = '#pageBodyContent'; // Default selector for main content area to shift
    this._open = false;
    this._boundHandleProductSearch = this._handleProductSearch.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('product-search', this._boundHandleProductSearch);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('product-search', this._boundHandleProductSearch);
    this._applyContentShift(false);
  }

  _handleProductSearch() {
    // Automatically close sidebar when a category option is selected
    if (this._open) {
      this._close();
    }
  }

  _applyContentShift(isOpen) {
    if (!this.contentTarget) return;
    const selector = this.contentTarget.startsWith('#') || this.contentTarget.startsWith('.')
      ? this.contentTarget
      : `#${this.contentTarget}`;
    
    const targetElement = document.querySelector(selector);
    if (targetElement) {
      if (isOpen) {
        targetElement.classList.add('md:pl-80');
      } else {
        targetElement.classList.remove('md:pl-80');
      }
    }
  }

  _notifyToggle(isOpen) {
    this._applyContentShift(isOpen);
    this.dispatchEvent(new CustomEvent('sidebar-toggle', {
      detail: { open: isOpen },
      bubbles: true,
      composed: true
    }));
    window.dispatchEvent(new CustomEvent('sidebar-toggle', {
      detail: { open: isOpen },
      bubbles: true,
      composed: true
    }));
  }

  _toggle(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this._open = !this._open;
    this._notifyToggle(this._open);
  }

  _close(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this._open = false;
    this._notifyToggle(false);
  }

  render() {
    return html`
      ${tailwindStyles}
      
      <!-- Trigger Buttons -->
      <div class="flex items-center">
        <!-- Mobile Trigger: Left side hamburger filter icon (< md) -->
        <button
          @click=${this._toggle}
          aria-label="Open Filter Sidebar"
          class="md:hidden p-2 rounded-xl text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors focus:outline-none flex items-center justify-center"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14" />
          </svg>
        </button>

        <!-- Desktop Trigger: Filters button (md+) -->
        <button
          @click=${this._toggle}
          aria-label="Open Filter Sidebar"
          class="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-black hover:text-black transition-colors shadow-xs ${this._open ? 'bg-black text-white border-black' : ''}"
        >
          <svg class="w-4 h-4 ${this._open ? 'text-white' : 'text-neutral-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Filters</span>
        </button>
      </div>

      <!-- Backdrop Overlay (Positioned below navbar at top-16) -->
      ${this._open
        ? html`
            <div 
              @click=${this._close}
              class="fixed top-16 left-0 right-0 bottom-0 bg-black/30 z-20 transition-opacity cursor-pointer"
            ></div>
          `
        : ''
      }

      <!-- Left Sliding Sidebar Drawer -->
      <div 
        class="fixed top-16 left-0 bottom-0 w-80 max-w-[85vw] bg-white border-r border-neutral-200 z-30 shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          this._open ? 'translate-x-0 drawer-open' : '-translate-x-full drawer-closed'
        }"
      >
        <!-- Sidebar Drawer Header -->
        <div class="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div class="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-black">
            <svg class="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            ${this.title}
          </div>

          <button 
            @click=${this._close} 
            class="p-1.5 rounded-xl text-neutral-500 hover:text-black hover:bg-neutral-200 transition-colors"
            aria-label="Close Sidebar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Sidebar Content Slot (holds product filters) -->
        <div class="p-6 overflow-y-auto flex-grow flex flex-col gap-4">
          <slot></slot>
        </div>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-neutral-100 bg-neutral-50 text-center text-[11px] text-neutral-400 font-medium">
          Rawgad Catalog Filters
        </div>
      </div>
    `;
  }
}

customElements.define('filter-sidebar', FilterSidebar);
