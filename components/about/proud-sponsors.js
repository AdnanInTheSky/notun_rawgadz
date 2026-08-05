import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { tailwindStyles } from '../utilities/tailwind02.js';

class ProudSponsors extends LitElement {
  static properties = {
    dataSrc: { type: String, attribute: 'data-src' },
    sponsors: { type: Array, state: true }
  };

  constructor() {
    super();
    this.sponsors = [];
  }

  firstUpdated() {
    this.fetchData();
  }

  async fetchData() {
    if (!this.dataSrc) return;
    try {
      const res = await fetch(this.dataSrc);
      this.sponsors = await res.json();
    } catch (err) {
      console.error("Failed to load sponsors", err);
    }
  }

  render() {
    return html`
      ${tailwindStyles}
      <section class="w-full max-w-4xl mx-auto py-20 px-8 font-sans text-center">
        <h2 class="text-white text-3xl font-bold mb-10">Proud Sponsors</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          ${this.sponsors.map(sponsor => html`
            <div class="bg-iron-card p-6 flex items-center justify-center rounded-lg border border-gray-800 h-24">
               <span class="text-gray-400 font-bold tracking-wider">${sponsor.name}</span>
            </div>
          `)}
        </div>
      </section>
    `;
  }
}
customElements.define('proud-sponsors', ProudSponsors);