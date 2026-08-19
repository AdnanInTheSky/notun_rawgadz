import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyHero extends LitElement {
  static properties = {
    bgImage: { type: String, attribute: 'bg-image' },
    minHeight: { type: String, attribute: 'min-height' },
    compact: { type: Boolean }
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
    this.minHeight = '';
    this.compact = false;
  }

  render() {
    const minHeightClass = this.minHeight ? '' : (this.compact ? 'min-h-[120px]' : 'min-h-[420px]');
    const pyClass = this.compact ? 'py-6 sm:py-8' : 'py-16';
    const maxWidthClass = this.compact ? 'max-w-5xl' : 'max-w-3xl';
    const inlineStyle = `background-image: url('${this.bgImage}');${this.minHeight ? ` min-height: ${this.minHeight};` : ''}`;

    return html`
      ${tailwindStyles}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 my-3 sm:my-4">
        <div 
          class="relative w-full ${minHeightClass} ${pyClass} flex flex-col items-center justify-center bg-cover bg-center rounded-3xl border border-neutral-800 overflow-hidden"
          style="${inlineStyle}"
        >
          <div class="absolute inset-0 bg-black/85 backdrop-blur-[2px]"></div>
          <div class="relative z-10 w-full ${maxWidthClass} mx-auto px-4 sm:px-6 flex flex-col items-center text-center gap-4 sm:gap-6">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('my-hero', MyHero);