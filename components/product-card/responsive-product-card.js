import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

export class ResponsiveProductCard extends LitElement {
  static properties = {
    productId: { type: String, attribute: 'product-id' },
    imageSrc: { type: String, attribute: 'image-src' },
    title: { type: String },
    description: { type: String },
    price: { type: Number },
    tags: { type: String },
    storageKey: { type: String, attribute: 'storage-key' }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .aspect-square {
      aspect-ratio: 1 / 1;
    }
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;

  constructor() {
    super();
    this.productId = '';
    this.imageSrc = '';
    this.title = '';
    this.description = '';
    this.price = 0;
    this.tags = '';
    this.storageKey = 'main_store_cart';
  }

  render() {
    const tagArray = this.tags ? this.tags.split(',').map(t => t.trim()) : [];
    const formattedPrice = typeof this.price === 'number' ? this.price.toFixed(2) : parseFloat(this.price || 0).toFixed(2);

    return html`
      ${tailwindStyles}
      <div class="bg-white border border-neutral-200 rounded-2xl w-full overflow-hidden flex flex-col h-full transition-all duration-300 hover:border-black shadow-xs hover:shadow-md">
        <a href="./product/${this.productId}.html" class="block relative overflow-hidden group aspect-4/3 sm:aspect-square bg-neutral-50 border-b border-neutral-100">
          <img 
            src="${this.imageSrc}" 
            alt="${this.title}" 
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          >
        </a>
        <div class="p-3 sm:p-5 flex flex-col flex-grow">
          <div class="flex flex-wrap gap-1 mb-2">
            ${tagArray.map(tag => html`
              <span class="bg-neutral-100 text-neutral-800 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-neutral-200">
                ${tag}
              </span>
            `)}
          </div>

          <h2 class="text-xs sm:text-base font-bold text-black mb-1 tracking-tight leading-snug line-clamp-1 sm:line-clamp-2">
            ${this.title}
          </h2>

          <p class="text-neutral-500 text-[11px] sm:text-xs leading-relaxed mb-3 sm:mb-4 flex-grow line-clamp-2 hidden sm:block">
            ${this.description}
          </p>
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-auto pt-2 sm:pt-4 border-t border-neutral-100">
            <div class="text-sm sm:text-lg font-black text-black tracking-tight">
              BDT ${formattedPrice}
            </div>
            
            <a 
              href="./product/${this.productId}.html" 
              class="bg-black hover:bg-neutral-800 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all text-center"
            >
              Select Type
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('responsive-product-card', ResponsiveProductCard);
