import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit@3/directives/unsafe-html.js/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class MyBlogPage extends LitElement {
  static properties = {
    blogId: { type: String, attribute: 'blog-id' },
    dataSource: { type: String, attribute: 'data-source' },
    _blog: { state: true },
    _loading: { state: true },
    _error: { state: true }
  };

  constructor() {
    super();
    this.blogId = '';
    this.dataSource = './blog.json';
    this._blog = null;
    this._loading = true;
    this._error = '';
  }

  async firstUpdated() {
    try {
      const response = await fetch(this.dataSource);
      if (!response.ok) throw new Error('Network response failed');
      const data = await response.json();
      
      const found = data.find(b => String(b.id) === String(this.blogId));
      if (!found) throw new Error('Blog post not found');
      
      this._blog = found;
    } catch (err) {
      this._error = 'Could not load blog post details.';
    } finally {
      this._loading = false;
    }
  }

  render() {
    if (this._loading) return html`${tailwindStyles}<div class="text-center font-bold text-xs uppercase tracking-wider text-neutral-500 py-20">Loading article...</div>`;
    if (this._error) return html`${tailwindStyles}<div class="text-center font-bold text-xs uppercase tracking-wider text-black border border-neutral-300 bg-neutral-100 p-4 rounded-2xl py-10">${this._error}</div>`;

    const tagArray = this._blog.tags ? this._blog.tags.split(',').map(t => t.trim()) : [];

    return html`
      ${tailwindStyles}
      <style>
        .blog-body h1 { font-size: 2.25rem; font-weight: 900; margin-top: 1.5rem; margin-bottom: 1rem; color: #000; line-height: 1.2; letter-spacing: -0.025em; }
        .blog-body h2 { font-size: 1.5rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #171717; letter-spacing: -0.02em; }
        .blog-body h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #262626; }
        .blog-body p { font-size: 1rem; line-height: 1.75; margin-bottom: 1.25rem; color: #404040; }
        .blog-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #404040; }
        .blog-body ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #404040; }
        .blog-body li { margin-bottom: 0.5rem; font-size: 1rem; line-height: 1.6; }
        .blog-body blockquote { border-left: 4px solid #171717; padding-left: 1rem; font-style: italic; margin-top: 1.5rem; margin-bottom: 1.5rem; color: #525252; }
        .blog-body pre { background-color: #171717; color: #f5f5f5; padding: 1.25rem; rounded: 1rem; overflow-x: auto; margin-top: 1.5rem; margin-bottom: 1.5rem; font-size: 0.875rem; border-radius: 0.75rem; }
        .blog-body code { background-color: #f5f5f5; color: #171717; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace; }
        .blog-body pre code { background-color: transparent; color: inherit; padding: 0; }
        .blog-body a { color: #000; text-decoration: underline; font-weight: 600; }
        .blog-body a:hover { color: #525252; }
      </style>

      <article class="bg-white rounded-3xl border border-neutral-200 overflow-hidden w-full max-w-4xl mx-auto shadow-sm p-6 sm:p-10 md:p-14">
        
        <!-- Top Navigation / Back Button -->
        <div class="mb-8">
          <a href="./blog.html" class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to All Articles
          </a>
        </div>

        <!-- Meta Header -->
        <header class="mb-8 border-b border-neutral-100 pb-8">
          <div class="flex flex-wrap gap-2 mb-4">
            ${tagArray.map(tag => html`
              <span class="bg-neutral-100 text-neutral-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-neutral-200">
                ${tag}
              </span>
            `)}
          </div>

          <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tight leading-tight mb-4">
            ${this._blog.title}
          </h1>

          <div class="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-400">
            <span class="text-black font-bold">By ${this._blog.author || 'Rawgad Team'}</span>
            <span>•</span>
            <span>${this._blog.date}</span>
          </div>
        </header>

        <!-- Cover Image -->
        ${this._blog.imageSrc ? html`
          <div class="mb-10 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
            <img src="${this._blog.imageSrc}" alt="${this._blog.title}" class="w-full max-h-[450px] object-cover">
          </div>
        ` : ''}

        <!-- Article Content -->
        <div class="blog-body text-neutral-800">
          ${unsafeHTML(this._blog.content)}
        </div>

        <!-- Article Footer / Navigation -->
        <footer class="mt-14 pt-8 border-t border-neutral-200 flex justify-between items-center flex-wrap gap-4">
          <a href="./blog.html" class="bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Explore More Articles
          </a>
        </footer>

      </article>
    `;
  }
}

customElements.define('my-blog-page', MyBlogPage);
