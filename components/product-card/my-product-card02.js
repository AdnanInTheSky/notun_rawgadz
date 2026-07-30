import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyProductCard extends LitElement {
  static properties = {
    productId: { type: String, attribute: 'product-id' },
    imageSrc: { type: String, attribute: 'image-src' },
    title: { type: String },
    description: { type: String },
    price: { type: Number },
    tags: { type: String }
  };

  render() {
    const tagArray = this.tags ? this.tags.split(',').map(t => t.trim()) : [];

    return html`
      ${tailwindStyles}
      <div class="bg-white border border-neutral-200 rounded-2xl w-72 overflow-hidden flex flex-col transition-all duration-300 hover:border-black">
        <a href="./${this.productId}.html" class="block relative overflow-hidden group">
          <img src="${this.imageSrc}" alt="${this.title}" class="w-full h-48 object-cover border-b border-neutral-100 bg-neutral-50 transition-transform duration-500 group-hover:scale-105">
        </a>
        <div class="p-5 flex flex-col flex-grow">
          <div class="flex flex-wrap gap-1.5 mb-2.5">
            ${tagArray.map(tag => html`<span class="bg-neutral-100 text-neutral-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-neutral-200">${tag}</span>`)}
          </div>
          <h2 class="text-base font-bold text-black mb-1.5 tracking-tight leading-tight">${this.title}</h2>
          <p class="text-neutral-500 text-xs leading-relaxed mb-4 flex-grow line-clamp-2">${this.description}</p>
          
          <div class="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100">
            <div class="text-lg font-extrabold text-black tracking-tight">$${this.price.toFixed(2)}</div>
            
            <!-- Direct link to the generated product page -->
            <a href="./${this.productId}.html" class="bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all">
              Select Type
            </a>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('my-product-card', MyProductCard);