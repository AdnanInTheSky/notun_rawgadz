import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

export class AdminHeader extends LitElement {
  static properties = {
    title: { type: String },
    subtitle: { type: String },
    loading: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.title = 'Order Management & Courier Dispatch';
    this.subtitle = 'Monitor incoming customer orders, payment status, and dispatch shipments to Pathao Courier with 1-click.';
    this.loading = false;
  }

  _handleRefresh() {
    this.dispatchEvent(new CustomEvent('refresh', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      ${tailwindStyles}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 class="text-3xl font-black text-black tracking-tight">${this.title}</h1>
          <p class="text-xs text-neutral-500 font-medium mt-1">
            ${this.subtitle}
          </p>
        </div>

        <button 
          id="refreshBtn" 
          @click=${this._handleRefresh}
          ?disabled=${this.loading}
          class="bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 self-start md:self-auto ${this.loading ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          ${this.loading
            ? html`
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              `
            : html`
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Refresh Data
              `
          }
        </button>
      </div>
    `;
  }
}

customElements.define('admin-header', AdminHeader);
