import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';
import './admin-header.js';
import './admin-metrics.js';
import './admin-filter-bar.js';
import './admin-orders-table.js';

export class AdminDashboard extends LitElement {
  static properties = {
    allOrders: { type: Array },
    activeFilter: { type: String },
    searchQuery: { type: String },
    loading: { type: Boolean },
    errorMessage: { type: String },
    dispatchingInvoices: { type: Object },
    title: { type: String },
    subtitle: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.allOrders = [];
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.loading = false;
    this.errorMessage = '';
    this.dispatchingInvoices = {};
    this.title = 'Order Management & Courier Dispatch';
    this.subtitle = 'Monitor incoming customer orders, payment status, and dispatch shipments to Pathao Courier with 1-click.';
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchOrders();
  }

  async fetchOrders() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const response = await fetch('/api/order');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      this.allOrders = data.orders || [];
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      this.errorMessage = err.message || 'Failed to load orders';
    } finally {
      this.loading = false;
    }
  }

  _handleFilterChange(e) {
    this.activeFilter = e.detail.filter;
  }

  _handleSearchChange(e) {
    this.searchQuery = e.detail.query || '';
  }

  async _handleDispatchOrder(e) {
    const { invoiceNumber } = e.detail;
    if (!invoiceNumber) return;

    if (!confirm(`Are you sure you want to dispatch order ${invoiceNumber} to Pathao Courier?`)) {
      return;
    }

    this.dispatchingInvoices = { ...this.dispatchingInvoices, [invoiceNumber]: true };

    try {
      const response = await fetch('/api/admin/pathao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoice_number: invoiceNumber })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Success! Order ${invoiceNumber} dispatched to Pathao.\nConsignment ID: ${data.consignment_id}`);
        await this.fetchOrders();
      } else {
        alert(`Pathao Dispatch Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Network error during dispatch: ${err.message}`);
    } finally {
      const updated = { ...this.dispatchingInvoices };
      delete updated[invoiceNumber];
      this.dispatchingInvoices = updated;
    }
  }

  get filteredOrders() {
    const query = this.searchQuery.trim().toLowerCase();

    return this.allOrders.filter(o => {
      // Status filter
      if (this.activeFilter === 'success' && !(o.status === 'success' || o.verified)) return false;
      if (this.activeFilter === 'pending' && (o.status === 'success' || o.verified)) return false;
      if (this.activeFilter === 'dispatched' && o.courier_status !== 'dispatched') return false;

      // Search query filter
      if (query) {
        const inv = (o.invoice_number || '').toLowerCase();
        const name = (o.customer?.name || '').toLowerCase();
        const phone = (o.customer?.phone || '').toLowerCase();
        const email = (o.customer?.email || '').toLowerCase();
        return inv.includes(query) || name.includes(query) || phone.includes(query) || email.includes(query);
      }

      return true;
    });
  }

  get metrics() {
    const totalOrders = this.allOrders.length;
    const totalRevNum = this.allOrders.reduce((sum, o) => sum + (Number(o.payment_amount) || 0), 0);
    const paidOrders = this.allOrders.filter(o => o.status === 'success' || o.verified).length;
    const dispatchedOrders = this.allOrders.filter(o => o.courier_status === 'dispatched').length;

    return {
      totalOrders,
      totalRevenue: `BDT ${totalRevNum.toFixed(2)}`,
      paidOrders,
      dispatchedOrders
    };
  }

  render() {
    const { totalOrders, totalRevenue, paidOrders, dispatchedOrders } = this.metrics;

    return html`
      ${tailwindStyles}
      <div class="flex flex-col gap-8 w-full">
        <admin-header
          .title=${this.title}
          .subtitle=${this.subtitle}
          .loading=${this.loading}
          @refresh=${this.fetchOrders}
        ></admin-header>

        <admin-metrics
          .totalOrders=${totalOrders}
          .totalRevenue=${totalRevenue}
          .paidOrders=${paidOrders}
          .dispatchedOrders=${dispatchedOrders}
        ></admin-metrics>

        <admin-filter-bar
          .activeFilter=${this.activeFilter}
          .searchQuery=${this.searchQuery}
          @filter-change=${this._handleFilterChange}
          @search-change=${this._handleSearchChange}
        ></admin-filter-bar>

        <admin-orders-table
          .orders=${this.filteredOrders}
          .loading=${this.loading}
          .errorMessage=${this.errorMessage}
          .dispatchingInvoices=${this.dispatchingInvoices}
          @dispatch-order=${this._handleDispatchOrder}
        ></admin-orders-table>
      </div>
    `;
  }
}

customElements.define('admin-dashboard', AdminDashboard);
