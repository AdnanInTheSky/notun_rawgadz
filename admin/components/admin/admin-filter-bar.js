import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

export class AdminFilterBar extends LitElement {
  static properties = {
    activeFilter: { type: String },
    searchQuery: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.activeFilter = 'all';
    this.searchQuery = '';
  }

  _setFilter(filter) {
    this.activeFilter = filter;
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: { filter },
      bubbles: true,
      composed: true
    }));
  }

  _handleSearch(e) {
    this.searchQuery = e.target.value;
    this.dispatchEvent(new CustomEvent('search-change', {
      detail: { query: this.searchQuery },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const filters = [
      { id: 'all', label: 'All' },
      { id: 'cod', label: 'Cash on Delivery' },
      { id: 'paystation', label: 'Paystation' },
      { id: 'success', label: 'Paid Online' },
      { id: 'pending', label: 'Pending Payment' },
      { id: 'dispatched', label: 'Dispatched' }
    ];

    return html`
      ${tailwindStyles}
      <div class="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex flex-wrap gap-2 w-full md:w-auto">
          ${filters.map(f => {
            const isActive = this.activeFilter === f.id;
            return html`
              <button 
                @click=${() => this._setFilter(f.id)}
                class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }"
              >
                ${f.label}
              </button>
            `;
          })}
        </div>

        <div class="relative w-full md:w-72">
          <input 
            type="text" 
            .value=${this.searchQuery}
            @input=${this._handleSearch}
            placeholder="Search invoice or customer..." 
            class="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-black font-medium"
          />
        </div>
      </div>
    `;
  }
}

customElements.define('admin-filter-bar', AdminFilterBar);
