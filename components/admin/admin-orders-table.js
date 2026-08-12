import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

export class AdminOrdersTable extends LitElement {
  static properties = {
    orders: { type: Array },
    loading: { type: Boolean },
    errorMessage: { type: String },
    dispatchingInvoices: { type: Object } // Map of invoice_number => boolean
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.orders = [];
    this.loading = false;
    this.errorMessage = '';
    this.dispatchingInvoices = {};
  }

  _onDispatchClick(invoiceNumber) {
    this.dispatchEvent(new CustomEvent('dispatch-order', {
      detail: { invoiceNumber },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (this.loading) {
      return html`
        ${tailwindStyles}
        <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
          <div class="py-12 text-center text-neutral-400 font-bold uppercase tracking-wider text-xs">
            Loading orders...
          </div>
        </div>
      `;
    }

    if (this.errorMessage) {
      return html`
        ${tailwindStyles}
        <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
          <div class="py-8 text-center text-red-600 font-bold uppercase tracking-wider text-xs">
            Error loading orders: ${this.errorMessage}
          </div>
        </div>
      `;
    }

    if (!this.orders || this.orders.length === 0) {
      return html`
        ${tailwindStyles}
        <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
          <div class="py-12 text-center text-neutral-400 font-bold uppercase tracking-wider text-xs">
            No orders found matching criteria.
          </div>
        </div>
      `;
    }

    return html`
      ${tailwindStyles}
      <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-neutral-50 border-b border-neutral-200 text-[11px] uppercase tracking-wider text-neutral-500 font-bold">
              <th class="py-4 px-6">Invoice & Date</th>
              <th class="py-4 px-6">Customer Details</th>
              <th class="py-4 px-6">Order Items & Total</th>
              <th class="py-4 px-6">Payment Status</th>
              <th class="py-4 px-6">Courier Status</th>
              <th class="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 text-xs font-medium">
            ${this.orders.map(o => this.renderOrderRow(o))}
          </tbody>
        </table>
      </div>
    `;
  }

  renderOrderRow(o) {
    const dateStr = o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A';
    const customer = o.customer || {};
    const isPaid = o.status === 'success' || o.verified;
    const courierStatus = o.courier_status || 'pending';
    const consignmentId = o.consignment_id || '';
    const isDispatching = this.dispatchingInvoices[o.invoice_number] || courierStatus === 'dispatching';

    return html`
      <tr class="hover:bg-neutral-50/80 transition-colors">
        <td class="py-4 px-6">
          <div class="font-bold text-black font-mono">${o.invoice_number || 'N/A'}</div>
          <div class="text-[11px] text-neutral-400 mt-0.5">${dateStr}</div>
        </td>
        <td class="py-4 px-6">
          <div class="font-bold text-black">${customer.name || 'N/A'}</div>
          <div class="text-neutral-500 text-[11px]">${customer.phone || ''}</div>
          <div class="text-neutral-400 text-[10px] truncate max-w-xs" title="${customer.full_address || ''}">
            ${customer.full_address || customer.address_detail || 'N/A'}
          </div>
        </td>
        <td class="py-4 px-6">
          <div class="text-neutral-700 font-medium max-w-xs truncate" title="${o.checkout_items || ''}">
            ${o.checkout_items || 'Standard Order'}
          </div>
          <div class="font-black text-black text-xs mt-0.5">BDT ${(Number(o.payment_amount) || 0).toFixed(2)}</div>
        </td>
        <td class="py-4 px-6">
          ${this.renderPaymentBadge(isPaid, o.status)}
        </td>
        <td class="py-4 px-6">
          ${this.renderCourierBadge(courierStatus, isDispatching)}
        </td>
        <td class="py-4 px-6 text-right">
          ${this.renderActionButton(o.invoice_number, courierStatus, consignmentId, isDispatching)}
        </td>
      </tr>
    `;
  }

  renderPaymentBadge(isPaid, status) {
    if (isPaid) {
      return html`<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-200">Paid Online</span>`;
    }
    if (status === 'failed') {
      return html`<span class="bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-rose-200">Failed</span>`;
    }
    return html`<span class="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-200">Pending</span>`;
  }

  renderCourierBadge(courierStatus, isDispatching) {
    if (courierStatus === 'dispatched') {
      return html`<span class="bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Dispatched</span>`;
    }
    if (isDispatching) {
      return html`<span class="bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse">Dispatching...</span>`;
    }
    if (courierStatus === 'failed') {
      return html`<span class="bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-rose-200">Failed</span>`;
    }
    return html`<span class="bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-neutral-200">Pending</span>`;
  }

  renderActionButton(invoiceNumber, courierStatus, consignmentId, isDispatching) {
    if (courierStatus === 'dispatched' && consignmentId) {
      return html`
        <div class="flex flex-col items-end gap-1">
          <span class="bg-neutral-900 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg border border-neutral-700 inline-flex items-center gap-1.5 shadow-xs">
            <svg class="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            ${consignmentId}
          </span>
        </div>
      `;
    }

    if (isDispatching) {
      return html`
        <button disabled class="bg-neutral-300 text-neutral-600 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl cursor-not-allowed inline-flex items-center gap-2">
          <svg class="animate-spin h-3.5 w-3.5 text-neutral-600 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Dispatching...
        </button>
      `;
    }

    return html`
      <button 
        @click=${() => this._onDispatchClick(invoiceNumber)} 
        class="bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
      >
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
        Send to Pathao
      </button>
    `;
  }
}

customElements.define('admin-orders-table', AdminOrdersTable);
