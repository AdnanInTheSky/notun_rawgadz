import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { tailwindStyles } from '../utilities/tailwind02.js';

class IronAbout extends LitElement {
  static properties = {
    title: { type: String },
    description: { type: String },
    pillars: { type: Array } 
  };

  render() {
    const pillarList = this.pillars || [];
    return html`
      ${tailwindStyles}
      <section class="w-full max-w-6xl mx-auto py-24 px-8 flex flex-col md:flex-row gap-16 items-center font-sans">
        <div class="w-full md:w-1/2 flex justify-center">
          <div class="w-full max-w-sm h-[600px] bg-iron-gray rounded-3xl border border-gray-800 overflow-hidden relative shadow-2xl">
            <div class="absolute inset-0 flex items-center justify-center text-gray-700">Image Container</div>
          </div>
        </div>
        <div class="w-full md:w-1/2">
          <h2 class="text-white text-4xl font-bold mb-6">${this.title}</h2>
          <p class="text-gray-400 mb-10 leading-relaxed text-lg">${this.description}</p>
          <div class="grid grid-cols-2 gap-4">
            ${pillarList.map(pillar => html`
              <div class="bg-iron-green text-iron-dark font-bold text-center py-3 px-4 rounded-full text-sm hover:opacity-90 cursor-default">
                ${pillar}
              </div>
            `)}
          </div>
        </div>
      </section>
    `;
  }
}
customElements.define('iron-about', IronAbout);