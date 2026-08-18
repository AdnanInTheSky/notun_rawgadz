import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

export class ResponsiveCarGrid extends LitElement {
  static properties = {
    dataSource: { type: String, attribute: 'data-source' },
    _allCars: { state: true },
    _filteredCars: { state: true },
    _loading: { state: true },
    _error: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.dataSource = './cars.json';
    this._allCars = [];
    this._filteredCars = [];
    this._loading = true;
    this._error = '';
    this._boundHandleSearch = this._handleSearch.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('product-search', this._boundHandleSearch);
    window.addEventListener('car-search', this._boundHandleSearch);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('product-search', this._boundHandleSearch);
    window.removeEventListener('car-search', this._boundHandleSearch);
  }

  async firstUpdated() {
    try {
      const response = await fetch(this.dataSource);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawData = await response.json();
      
      this._allCars = Array.isArray(rawData) ? rawData : [];
      this._filteredCars = [...this._allCars];
      this._loading = false;
    } catch (err) {
      console.error('Failed to load cars catalog:', err);
      this._error = 'Failed to load vehicle inventory. Please try again later.';
      this._loading = false;
    }
  }

  _handleSearch(e) {
    const query = (e.detail?.query || '').toLowerCase().trim();
    const target = e.detail?.target || 'all';

    if (!query) {
      this._filteredCars = [...this._allCars];
      return;
    }

    this._filteredCars = this._allCars.filter(car => {
      const title = String(car.title || '').toLowerCase();
      const desc = String(car.description || '').toLowerCase();
      const tags = String(car.tags || '').toLowerCase();
      const id = String(car.id || '').toLowerCase();

      if (target === 'tags') return tags.includes(query);
      if (target === 'title') return title.includes(query);
      
      return title.includes(query) || desc.includes(query) || tags.includes(query) || id.includes(query);
    });
  }

  render() {
    return html`
      ${tailwindStyles}
      <div class="w-full">
        <slot></slot>

        ${this._loading ? html`
          <div class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
          </div>
        ` : ''}

        ${this._error ? html`
          <div class="text-center py-12">
            <p class="text-red-500 font-bold text-sm mb-2">${this._error}</p>
          </div>
        ` : ''}

        ${!this._loading && !this._error && this._filteredCars.length === 0 ? html`
          <div class="text-center py-16 bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
            <p class="text-neutral-500 font-bold text-sm">No vehicles match your search criteria.</p>
          </div>
        ` : ''}

        ${!this._loading && !this._error && this._filteredCars.length > 0 ? html`
          <!-- 1 Car Per Row Alternating Zig-Zag Layout -->
          <div class="flex flex-col gap-10 md:gap-14 w-full">
            ${this._filteredCars.map((car, idx) => {
              const isEven = idx % 2 === 0; // 0, 2, 4 -> Image Left, Text Right; 1, 3, 5 -> Image Right, Text Left
              const tagsList = car.tags ? car.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
              const primaryTag = tagsList.length > 0 ? tagsList[0] : '';

              return html`
                <div class="bg-white rounded-3xl border border-neutral-200 overflow-hidden flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center shadow-sm hover:shadow-md transition-all duration-300 group w-full">
                  
                  <!-- Vehicle Image Container (50% on desktop) -->
                  <div class="w-full md:w-1/2 bg-neutral-100 p-8 md:p-12 flex items-center justify-center relative self-stretch border-b md:border-b-0 ${isEven ? 'md:border-r' : 'md:border-l'} border-neutral-200 min-h-[260px] md:min-h-[340px]">
                    <a href="./cr/${car.id}.html" class="w-full h-full flex items-center justify-center">
                      <img 
                        src="${car.imageSrc || 'https://placehold.co/1200x800/171717/ffffff?text=' + encodeURIComponent(car.title)}" 
                        alt="${car.title}" 
                        class="w-full max-w-md object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </a>
                  </div>

                  <!-- Vehicle Content Container (50% on desktop) -->
                  <div class="w-full md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-center">
                    
                    <!-- Tag & MSRP -->
                    <div class="flex items-center gap-2 mb-3">
                      ${primaryTag ? html`
                        <span class="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-neutral-200">
                          ${primaryTag}
                        </span>
                      ` : ''}
                      <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        From BDT ${Number(car.price || 0).toLocaleString('en-US')}
                      </span>
                    </div>

                    <!-- Title -->
                    <h3 class="text-2xl md:text-3xl lg:text-4xl font-black text-black tracking-tight mb-3 leading-tight group-hover:text-neutral-700 transition-colors">
                      <a href="./cr/${car.id}.html">${car.title}</a>
                    </h3>

                    <!-- Short clean description -->
                    <p class="text-neutral-500 text-xs md:text-sm leading-relaxed mb-8 line-clamp-2">
                      ${car.description}
                    </p>

                    <!-- Clean Action Buttons -->
                    <div class="flex flex-wrap items-center gap-3">
                      <a 
                        href="./cr/${car.id}.html" 
                        class="px-6 py-3.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center shadow-sm"
                      >
                        Explore Vehicle
                      </a>
                      <a 
                        href="./contact.html?car_id=${car.id}&vehicle=${encodeURIComponent(car.title)}&est_price=${car.price}" 
                        class="px-6 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center"
                      >
                        Contact Now
                      </a>
                    </div>

                  </div>

                </div>
              `;
            })}
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('responsive-car-grid', ResponsiveCarGrid);
