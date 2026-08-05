import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { tailwindStyles } from '../utilities/tailwind02.js';

class IronFooter extends LitElement {
  render() {
    return html`
      ${tailwindStyles}
      <footer class="w-full bg-iron-card py-16 px-8 border-t border-gray-900 font-sans mt-12">
        <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h3 class="text-white font-bold text-xl uppercase tracking-widest mb-4">Iron Hook</h3>
            <p class="text-gray-500">Brotherhood & Discipline.</p>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4 uppercase">About Us</h4>
            <ul class="text-gray-500 space-y-2">
              <li><a href="#" class="hover:text-iron-green">Company</a></li>
              <li><a href="#" class="hover:text-iron-green">Team</a></li>
              <li><a href="#" class="hover:text-iron-green">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4 uppercase">Social</h4>
            <ul class="text-gray-500 space-y-2">
              <li><a href="#" class="hover:text-iron-green">Instagram</a></li>
              <li><a href="#" class="hover:text-iron-green">Facebook</a></li>
              <li><a href="#" class="hover:text-iron-green">TikTok</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4 uppercase">Visitors</h4>
            <p class="text-gray-500">123 Iron Hook Blvd.<br>Chicago, IL 60601</p>
          </div>
        </div>
        <div class="max-w-6xl mx-auto mt-16 pt-8 border-t border-gray-800 text-center text-gray-600 text-xs">
          <p>&copy; 2026 Iron Hook Fitness. All Rights Reserved.</p>
        </div>
      </footer>
    `;
  }
}
customElements.define('iron-footer', IronFooter);