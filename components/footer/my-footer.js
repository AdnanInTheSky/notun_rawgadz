import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyFooter extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      margin-top: auto; 
    }
  `;

  render() {
    return html`
      ${tailwindStyles}
      <footer class="bg-black text-neutral-400 py-16 border-t border-neutral-800">
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div class="flex flex-col gap-4">
            <slot name="description">
              <h3 class="text-xs font-bold text-white uppercase tracking-widest">About Rawgad</h3>
              <p class="text-xs text-neutral-400 leading-relaxed">
                We are dedicated to providing the best tech gear for developers, designers, and creators.
              </p>
            </slot>
          </div>

          <div class="flex flex-col gap-4">
            <h3 class="text-xs font-bold text-white uppercase tracking-widest">Connect</h3>
            <div class="flex flex-col gap-2.5 text-xs">
              <slot name="social">
                <a href="#" class="hover:text-white transition-colors">X (Twitter)</a>
                <a href="#" class="hover:text-white transition-colors">GitHub</a>
                <a href="#" class="hover:text-white transition-colors">LinkedIn</a>
              </slot>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <slot name="extra"></slot>
          </div>

        </div>
        
        <div class="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-neutral-900 text-center text-xs text-neutral-500 font-medium">
          &copy; ${new Date().getFullYear()} Rawgad. All rights reserved.
        </div>
      </footer>
    `;
  }
}
customElements.define('my-footer', MyFooter);