import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { tailwindStyles } from '../utilities/tailwind02.js';

class OfferedServices extends LitElement {
  static properties = {
    services: { type: Array }
  };

  render() {
    const serviceList = this.services || [];
    return html`
      ${tailwindStyles}
      <section class="w-full max-w-6xl mx-auto py-20 px-8 font-sans">
        <h2 class="text-white text-3xl font-bold mb-12 text-center">Offered Services</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          ${serviceList.map(service => html`
            <div class="bg-iron-gray h-64 rounded-xl border border-gray-800 flex items-end p-6 relative overflow-hidden group">
              <h3 class="text-white font-bold text-xl relative z-10">${service}</h3>
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>
          `)}
        </div>
      </section>
    `;
  }
}
customElements.define('offered-services', OfferedServices);