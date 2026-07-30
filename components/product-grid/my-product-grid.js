import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyProductGrid extends LitElement {
  static properties = {
    dataSource: { type: String, attribute: 'data-source' },
    storageKey: { type: String, attribute: 'storage-key' },
    idKey: { type: String, attribute: 'id-key' },
    imageKey: { type: String, attribute: 'image-key' },
    titleKey: { type: String, attribute: 'title-key' },
    descKey: { type: String, attribute: 'desc-key' },
    priceKey: { type: String, attribute: 'price-key' },
    tagsKey: { type: String, attribute: 'tags-key' },
    _allProducts: { state: true },
    _filteredProducts: { state: true },
    _loading: { state: true },
    _error: { state: true }
  };

  constructor() {
    super();
    this.dataSource = './products.json';
    this.storageKey = 'app_cart';
    this.idKey = 'id';
    this.imageKey = 'imageSrc';
    this.titleKey = 'title';
    this.descKey = 'description';
    this.priceKey = 'price';
    this.tagsKey = 'tags';
    this._allProducts = [];
    this._filteredProducts = [];
    this._loading = true;
    this._error = '';
    this._boundHandleSearch = this._handleSearch.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('product-search', this._boundHandleSearch);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('product-search', this._boundHandleSearch);
  }

  async firstUpdated() {
    try {
      const response = await fetch(this.dataSource);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawData = await response.json();
      
      const normalizedData = rawData.map(item => ({
        id: item[this.idKey],
        imageSrc: item[this.imageKey],
        title: item[this.titleKey],
        description: item[this.descKey],
        price: parseFloat(item[this.priceKey] || 0),
        tags: item[this.tagsKey] || ''
      }));

      this._allProducts = normalizedData;
      this._filteredProducts = normalizedData;
    } catch (err) {
      this._error = 'Failed to load products.';
    } finally {
      this._loading = false;
    }
  }

_handleSearch(e) {
    const query = (e.detail.query || '').trim().toLowerCase();
    const target = e.detail.target || 'all'; // Reads the new target payload

    if (!query) {
      this._filteredProducts = [...this._allProducts];
      return;
    }

    this._filteredProducts = this._allProducts.filter(p => {
      // If a specific target is requested, ONLY check that field
      if (target === 'tags') return (p.tags || '').toLowerCase().includes(query);
      if (target === 'title') return (p.title || '').toLowerCase().includes(query);
      if (target === 'id') return (p.id || '').toLowerCase().includes(query);
      
      // Default: The "All" fallback (used by the main search bar)
      const titleMatch = (p.title || '').toLowerCase().includes(query);
      const tagMatch = (p.tags || '').toLowerCase().includes(query);
      const priceMatch = p.price.toString().includes(query);
      const idMatch = (p.id || '').toLowerCase().includes(query);
      return titleMatch || tagMatch || priceMatch || idMatch;
    });
  }

  render() {
    return html`
      ${tailwindStyles}
      <div class="w-full">
        <div class="mb-8 w-full"><slot></slot></div>
        
        ${this._loading ? html`<div class="text-center text-neutral-500 font-bold text-xs uppercase tracking-wider py-16">Loading catalog...</div>` : ''}
        ${this._error ? html`<div class="text-center text-black border border-neutral-300 bg-neutral-100 p-4 rounded-2xl font-bold text-xs uppercase tracking-wider py-8">${this._error}</div>` : ''}
        
        <div class="flex flex-wrap gap-8 justify-center">
          ${this._filteredProducts.length === 0 && !this._loading && !this._error ? html`
            <div class="text-neutral-500 font-bold text-xs uppercase tracking-wider py-16">No products found matching your criteria.</div>
          ` : ''}

          ${this._filteredProducts.map(p => html`
            <my-product-card 
              storage-key="${this.storageKey}"
              product-id="${p.id}"
              image-src="${p.imageSrc}"
              title="${p.title}"
              description="${p.description}"
              price="${p.price}"
              tags="${p.tags}">
            </my-product-card>
          `)}
        </div>
      </div>
    `;
  }
}
customElements.define('my-product-grid', MyProductGrid);