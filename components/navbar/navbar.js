import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { tailwindStyles } from '../utilities/tailwind02.js'; 

class IronNavbar extends LitElement {
  static properties = {
    brand: { type: String },
    links: { type: Array } 
  };

  render() {
    const navLinks = this.links || [];
    return html`
      ${tailwindStyles}
      <nav class="w-full bg-iron-dark py-6 px-8 flex justify-between items-center border-b border-gray-900 font-sans">
        <div class="text-white font-bold text-2xl tracking-widest uppercase">${this.brand}</div>
        <ul class="hidden md:flex gap-6 text-sm text-gray-300 font-bold uppercase">
          ${navLinks.map(link => html`
            <li><a href="${link.url}" class="hover:text-iron-green transition-colors">${link.name}</a></li>
          `)}
        </ul>
        <button class="bg-iron-green text-iron-dark font-bold py-2 px-6 rounded-full hover:opacity-80 transition-opacity">
          JOIN NOW
        </button>
      </nav>
    `;
  }
}
customElements.define('iron-navbar', IronNavbar);