import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

export class AdminMetrics extends LitElement {
  static properties = {
    totalOrders: { type: Number },
    totalRevenue: { type: String },
    paidOrders: { type: Number },
    dispatchedOrders: { type: Number }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.totalOrders = 0;
    this.totalRevenue = 'BDT 0.00';
    this.paidOrders = 0;
    this.dispatchedOrders = 0;
  }

  render() {
    return html`
      ${tailwindStyles}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Orders</span>
          <div class="text-3xl font-black text-black mt-2">${this.totalOrders}</div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Revenue</span>
          <div class="text-3xl font-black text-black mt-2">${this.totalRevenue}</div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Paid Online (Success)</span>
          <div class="text-3xl font-black text-emerald-600 mt-2">${this.paidOrders}</div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Pathao Dispatched</span>
          <div class="text-3xl font-black text-black mt-2">${this.dispatchedOrders}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('admin-metrics', AdminMetrics);
