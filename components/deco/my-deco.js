import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';
import { tailwindStyles } from '../utilities/tailwind.js';

class DecoComponent extends LitElement {
  static properties = {
    items: { type: Array },
    dataSource: { type: String, attribute: 'data-source' },
    _cards: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    @media (min-width: 640px) {
      .sm\\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    @media (min-width: 1024px) {
      .lg\\:grid-cols-7 {
        grid-template-columns: repeat(7, minmax(0, 1fr));
      }
    }
  `;

  constructor() {
    super();
    this.items = [];
    this.dataSource = '';
    this._cards = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this._initCards();
  }

  firstUpdated() {
    this._parseSlottedChildren();
  }

  async _initCards() {
    // 1. If items property is passed
    if (Array.isArray(this.items) && this.items.length > 0) {
      this._cards = this.items;
      return;
    }

    // 2. If data-source attribute is provided
    if (this.dataSource) {
      try {
        const res = await fetch(this.dataSource);
        if (res.ok) {
          const data = await res.json();
          this._cards = Array.isArray(data) ? data : (data.items || []);
          return;
        }
      } catch (err) {
        console.error('Failed to load deco cards from data-source:', err);
      }
    }

    // 3. Fallback default cards
    if (this._cards.length === 0) {
      this._cards = [
        { title: 'Smart Watches', image: './content/images/card1.jpg', tag: 'Gear' },
        { title: 'ANC Audio', image: './content/images/card2.jpg', tag: 'Sound' },
        { title: 'Keyboards', image: './content/images/card3.jpg', tag: 'Desk' },
        { title: 'Retro Optics', image: './content/images/card4.jpg', tag: 'Photo' },
        { title: 'Pro Audio', image: './content/images/card5.jpg', tag: 'Studio' },
        { title: 'Illumination', image: './content/images/card6.jpg', tag: 'Light' },
        { title: 'Hubs & Docks', image: './content/images/card7.jpg', tag: 'Tech' }
      ];
    }
  }

  _parseSlottedChildren() {
    // Inspect light-DOM child elements placed inside <deco-component> in index.html
    const children = Array.from(this.children);
    if (children.length === 0) return;

    const parsedCards = children.map(el => {
      return {
        title: el.getAttribute('data-title') || el.innerText || 'Card',
        image: el.getAttribute('data-image') || el.getAttribute('src') || './content/images/card1.jpg',
        tag: el.getAttribute('data-tag') || 'Featured',
        link: el.getAttribute('data-link') || '#shop'
      };
    });

    if (parsedCards.length > 0) {
      this._cards = parsedCards;
    }
  }

  _handleSlotChange(e) {
    this._parseSlottedChildren();
  }

  render() {
    const activeCards = this._cards && this._cards.length > 0 ? this._cards : [];
    const gridColsClass = activeCards.length === 7 
      ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7' 
      : `grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(activeCards.length, 6)}`;

    return html`
      ${tailwindStyles}
      <section class="w-full py-6 px-4 md:px-8 max-w-7xl mx-auto">
        <!-- Hidden slot for child parsing -->
        <div class="hidden">
          <slot @slotchange="${this._handleSlotChange}"></slot>
        </div>

        <div class="grid ${gridColsClass} gap-3 sm:gap-4">
          ${activeCards.map(card => html`
            <a 
              href="${card.link || '#shop'}"
              class="group relative bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md block flex flex-col"
            >
              <div class="aspect-square w-full overflow-hidden bg-neutral-100 relative">
                <img 
                  src="${card.image}" 
                  alt="${card.title}" 
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                >
                ${card.tag ? html`
                  <span class="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider bg-black/80 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                    ${card.tag}
                  </span>
                ` : ''}
              </div>
              <div class="p-2.5 text-center flex-grow flex items-center justify-center">
                <h3 class="text-xs font-bold text-neutral-900 group-hover:text-black transition-colors truncate">
                  ${card.title}
                </h3>
              </div>
            </a>
          `)}
        </div>
      </section>
    `;
  }
}

if (!customElements.get('deco-component')) {
  customElements.define('deco-component', DecoComponent);
}

export { DecoComponent };
