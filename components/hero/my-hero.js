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
      <div class="max-w-7xl mx-auto px-4 sm:px-6 my-4">
        <div 
          class="relative w-full min-h-[420px] py-16 flex flex-col items-center justify-center bg-cover bg-center rounded-3xl border border-neutral-800 overflow-hidden"
          style="background-image: url('${this.bgImage}');"
        >
          <div class="absolute inset-0 bg-black/85 backdrop-blur-[2px]"></div>
          <div class="relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-center text-center gap-6">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('my-hero', MyHero);