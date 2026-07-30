import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyHero extends LitElement {
  static properties = {
    bgImage: { type: String, attribute: 'bg-image' }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.bgImage = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80';
  }

  render() {
    return html`
      ${tailwindStyles}
      <div 
        class="relative w-full h-[500px] flex flex-col items-center justify-center bg-cover bg-center"
        style="background-image: url('${this.bgImage}');"
      >
        <div class="absolute inset-0 bg-black bg-opacity-60"></div>
        <div class="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center gap-6">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
customElements.define('my-hero', MyHero);