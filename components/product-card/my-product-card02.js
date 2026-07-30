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
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm w-72 overflow-hidden flex flex-col transition-shadow hover:shadow-md">
        <a href="./${this.productId}.html" class="block relative overflow-hidden group">
          <img src="${this.imageSrc}" alt="${this.title}" class="w-full h-48 object-cover border-b border-gray-200 transition-transform duration-500 group-hover:scale-105">
        </a>
        <div class="p-4 flex flex-col flex-grow">
          <div class="flex flex-wrap gap-1 mb-2">
            ${tagArray.map(tag => html`<span class="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-gray-200">${tag}</span>`)}
          </div>
          <h2 class="text-lg font-black text-gray-900 mb-1 leading-tight">${this.title}</h2>
          <p class="text-gray-500 text-sm mb-4 flex-grow line-clamp-2">${this.description}</p>
          
          <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
            <div class="text-xl font-black text-gray-900">$${this.price.toFixed(2)}</div>
            
            <!-- Direct link to the generated product page -->
            <a href="./${this.productId}.html" class="bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm px-4 py-2 rounded transition-colors">
              Select Type
            </a>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('my-product-card', MyProductCard);