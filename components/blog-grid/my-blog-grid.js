import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';
import '../blog-card/my-blog-card.js';

class MyBlogGrid extends LitElement {
  static properties = {
    dataSource: { type: String, attribute: 'data-source' },
    _allBlogs: { state: true },
    _filteredBlogs: { state: true },
    _loading: { state: true },
    _error: { state: true }
  };

  constructor() {
    super();
    this.dataSource = './blog.json';
    this._allBlogs = [];
    this._filteredBlogs = [];
    this._loading = true;
    this._error = '';
    this._boundHandleSearch = this._handleSearch.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('blog-search', this._boundHandleSearch);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('blog-search', this._boundHandleSearch);
  }

  async firstUpdated() {
    try {
      const response = await fetch(this.dataSource);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawData = await response.json();
      
      this._allBlogs = rawData;
      this._filteredBlogs = rawData;
    } catch (err) {
      this._error = 'Failed to load blog posts.';
    } finally {
      this._loading = false;
    }
  }

  _handleSearch(e) {
    const query = (e.detail.query || '').trim().toLowerCase();

    if (!query) {
      this._filteredBlogs = [...this._allBlogs];
      return;
    }

    this._filteredBlogs = this._allBlogs.filter(b => {
      const titleMatch = (b.title || '').toLowerCase().includes(query);
      const tagMatch = (b.tags || '').toLowerCase().includes(query);
      const excerptMatch = (b.excerpt || '').toLowerCase().includes(query);
      const authorMatch = (b.author || '').toLowerCase().includes(query);
      return titleMatch || tagMatch || excerptMatch || authorMatch;
    });
  }

  render() {
    return html`
      ${tailwindStyles}
      <div class="w-full">
        <div class="mb-8 w-full"><slot></slot></div>
        
        ${this._loading ? html`<div class="text-center text-neutral-500 font-bold text-xs uppercase tracking-wider py-16">Loading blog posts...</div>` : ''}
        ${this._error ? html`<div class="text-center text-black border border-neutral-300 bg-neutral-100 p-4 rounded-2xl font-bold text-xs uppercase tracking-wider py-8">${this._error}</div>` : ''}
        
        <div class="flex flex-wrap gap-8 justify-center">
          ${this._filteredBlogs.length === 0 && !this._loading && !this._error ? html`
            <div class="text-neutral-500 font-bold text-xs uppercase tracking-wider py-16">No blog posts found matching your criteria.</div>
          ` : ''}

          ${this._filteredBlogs.map(b => html`
            <my-blog-card 
              blog-id="${b.id}"
              image-src="${b.imageSrc}"
              title="${b.title}"
              excerpt="${b.excerpt}"
              date="${b.date}"
              author="${b.author}"
              tags="${b.tags}">
            </my-blog-card>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('my-blog-grid', MyBlogGrid);
