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
      <footer class="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div class="flex flex-col gap-4">
            <slot name="description">
              <h3 class="text-xl font-bold text-white tracking-wide">About Us</h3>
              <p class="text-sm text-gray-400 leading-relaxed">
                We are dedicated to providing the best tech gear for developers, designers, and creators.
              </p>
            </slot>
          </div>

          <div class="flex flex-col gap-4">
            <h3 class="text-xl font-bold text-white tracking-wide">Connect</h3>
            <div class="flex flex-col gap-2">
              <slot name="social">
                <a href="#" class="hover:text-blue-400 transition-colors">Twitter</a>
                <a href="#" class="hover:text-blue-400 transition-colors">GitHub</a>
                <a href="#" class="hover:text-blue-400 transition-colors">LinkedIn</a>
              </slot>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <slot name="extra"></slot>
          </div>

        </div>
        
        <div class="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          &copy; ${new Date().getFullYear()} Lit Web Store. All rights reserved.
        </div>
      </footer>
    `;
  }
}
customElements.define('my-footer', MyFooter);