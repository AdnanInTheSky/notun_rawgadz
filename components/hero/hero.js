import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { tailwindStyles } from '../utilities/tailwind02.js';

class IronHero extends LitElement {
  static properties = {
    headline: { type: String },
    subheadline: { type: String },
    primaryBtn: { type: String },
    secondaryBtn: { type: String }
  };

  render() {
    return html`
      ${tailwindStyles}
      <section class="w-full bg-iron-dark text-center py-40 px-4 flex flex-col items-center justify-center font-sans border-b border-gray-900 relative">
        <div class="relative z-10">
          <h1 class="text-white text-5xl md:text-7xl font-bold mb-2 tracking-tight">${this.headline}</h1>
          <h2 class="text-white text-4xl md:text-5xl font-bold mb-10 tracking-tight">${this.subheadline}</h2>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="bg-iron-green text-iron-dark font-bold py-3 px-8 rounded-full hover:opacity-80 transition-opacity">
              ${this.primaryBtn}
            </button>
            <button class="border border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-iron-dark transition-colors">
              ${this.secondaryBtn}
            </button>
          </div>
        </div>
      </section>
    `;
  }
}
customElements.define('iron-hero', IronHero);