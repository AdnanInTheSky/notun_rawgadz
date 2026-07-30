import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyFilterButton extends LitElement {
  static properties = {
    filterValue: { type: String, attribute: 'filter-value' },
    filterTarget: { type: String, attribute: 'filter-target' }, // e.g., 'tags', 'title'
    _isActive: { state: true }
  };

  static styles = css`
    :host {
      display: inline-block;
    }
  `;

  constructor() {
    super();
    this.filterValue = '';
    this.filterTarget = 'all'; // Defaults to searching everything
    this._isActive = false;
    this._boundHandleSearchState = this._handleSearchState.bind(this);
  }

  firstUpdated() {
    if ((this.filterValue || '').trim() === '') {
      this._isActive = true;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('product-search', this._boundHandleSearchState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('product-search', this._boundHandleSearchState);
  }

  _handleSearchState(e) {
    const currentQuery = (e.detail.query || '').trim();
    const currentTarget = e.detail.target || 'all';
    
    const myValue = (this.filterValue || '').toLowerCase().trim();
    const myTarget = this.filterTarget || 'all';
    
    // Only highlight if both the string and the specific target match
    this._isActive = (currentQuery === myValue && currentTarget === myTarget);
  }

  _handleClick() {
    const myValue = (this.filterValue || '').toLowerCase().trim();
    const myTarget = this.filterTarget || 'all';
    
    const query = (this._isActive && myValue !== '') ? '' : myValue;
    const target = query === '' ? 'all' : myTarget; // Reset target to 'all' if clearing
    
    window.dispatchEvent(new CustomEvent('product-search', { detail: { query, target } }));
  }

  render() {
    const baseClasses = "px-4 py-2 rounded-full font-semibold text-xs tracking-wider uppercase transition-all border whitespace-nowrap cursor-pointer focus:outline-none";
    const activeClasses = "bg-black text-white border-black";
    const inactiveClasses = "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100 hover:text-black hover:border-black";

    return html`
      ${tailwindStyles}
      <button 
        type="button"
        @click="${this._handleClick}"
        class="${baseClasses} ${this._isActive ? activeClasses : inactiveClasses}"
      >
        <slot></slot>
      </button>
    `;
  }
}
customElements.define('my-filter-button', MyFilterButton);