import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyBlogCard extends LitElement {
  static properties = {
    blogId: { type: String, attribute: 'blog-id' },
    imageSrc: { type: String, attribute: 'image-src' },
    title: { type: String },
    excerpt: { type: String },
    date: { type: String },
    author: { type: String },
    tags: { type: String }
  };

  render() {
    const tagArray = this.tags ? this.tags.split(',').map(t => t.trim()) : [];

    return html`
      ${tailwindStyles}
      <div class="bg-white border border-neutral-200 rounded-2xl w-full sm:w-80 md:w-88 overflow-hidden flex flex-col transition-all duration-300 hover:border-black hover:shadow-lg">
        <a href="./blog/${this.blogId}.html" class="block relative overflow-hidden group">
          <img 
            src="${this.imageSrc || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'}" 
            alt="${this.title}" 
            class="w-full h-48 object-cover border-b border-neutral-100 bg-neutral-50 transition-transform duration-500 group-hover:scale-105"
          >
        </a>
        
        <div class="p-6 flex flex-col flex-grow">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex flex-wrap gap-1.5">
              ${tagArray.map(tag => html`
                <span class="bg-neutral-100 text-neutral-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-neutral-200">
                  ${tag}
                </span>
              `)}
            </div>
            ${this.date ? html`<span class="text-neutral-400 text-[11px] font-semibold">${this.date}</span>` : ''}
          </div>

          <h2 class="text-lg font-black text-black mb-2 tracking-tight leading-snug line-clamp-2 hover:text-neutral-700 transition-colors">
            <a href="./blog/${this.blogId}.html">${this.title}</a>
          </h2>

          <p class="text-neutral-500 text-xs leading-relaxed mb-6 flex-grow line-clamp-3">
            ${this.excerpt}
          </p>
          
          <div class="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100">
            <span class="text-neutral-400 text-[11px] font-medium">By ${this.author || 'Rawgad Team'}</span>
            
            <!-- Button titled 'Read Me' linking to the blog's HTML page inside blog/ directory -->
            <a href="./blog/${this.blogId}.html" class="bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1">
              Read Me
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('my-blog-card', MyBlogCard);
