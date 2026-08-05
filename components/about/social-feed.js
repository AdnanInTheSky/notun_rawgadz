import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { tailwindStyles } from '../utilities/tailwind02.js';

class SocialFeed extends LitElement {
  static properties = {
    dataSrc: { type: String, attribute: 'data-src' },
    posts: { type: Array, state: true }
  };

  constructor() {
    super();
    this.posts = [];
  }

  firstUpdated() {
    this.fetchData();
  }

  async fetchData() {
    if (!this.dataSrc) return;
    try {
      const res = await fetch(this.dataSrc);
      this.posts = await res.json();
    } catch (err) {
      console.error("Failed to load social posts", err);
    }
  }

  render() {
    return html`
      ${tailwindStyles}
      <section class="w-full max-w-6xl mx-auto py-20 px-8 font-sans text-center">
        <h2 class="text-white text-3xl font-bold mb-2">Follow us on Social</h2>
        <p class="text-gray-400 mb-10 text-sm">@ironhookboxing</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          ${this.posts.map(post => html`
            <div class="bg-white rounded-lg p-2 flex flex-col h-72">
               <div class="flex items-center gap-2 mb-2 p-1">
                 <div class="w-8 h-8 rounded-full bg-gray-300"></div>
                 <div class="text-left">
                   <p class="text-black text-xs font-bold leading-none">${post.handle}</p>
                 </div>
               </div>
               <div class="flex-grow bg-gray-200 rounded-md overflow-hidden relative">
                  <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">Image</div>
               </div>
            </div>
          `)}
        </div>
      </section>
    `;
  }
}
customElements.define('social-feed', SocialFeed);