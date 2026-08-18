const fs = require('fs');
const path = require('path');
const generateCarsJson = require('./build-car');

const CARS_JSON_FILE = path.join(__dirname, 'cars.json');
const HTML_OUTPUT_DIR = path.join(__dirname, 'cr');

/**
 * Escapes HTML characters for safe injection into markup attributes/text
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates standalone static HTML pages for each vehicle in cr/ folder using Alpine.js CDN.
 * Uses a clean dropdown select system instead of button options for concise, uncluttered vehicle configuration.
 */
function generateStandaloneCarHTML(car) {
  const types = Array.isArray(car.types) ? car.types : [];
  const firstType = types.length > 0 ? types[0] : null;
  const firstSub = (firstType && firstType.subProducts && firstType.subProducts.length > 0) ? firstType.subProducts[0] : null;

  const initialImage = firstSub?.subImage || firstType?.subImage || car.imageSrc;
  const initialPrice = firstSub?.price ?? firstType?.price ?? car.price;

  const tagsHtml = car.tags
    ? car.tags.split(',').slice(0, 4).map(tag => `<span class="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-neutral-200">${escapeHtml(tag.trim())}</span>`).join('\n              ')
    : '';

  const sanitizedCarJson = JSON.stringify(car).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(car.title)} - Rawgad Automotive</title>
  <meta name="description" content="${escapeHtml(car.description || car.title)}">
  
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Alpine.js CDN -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <!-- Web Components -->
  <script type="module" src="../components/utilities/tailwind.js"></script>
  <script type="module" src="../components/navbar/my-navbar.js"></script>
  <script type="module" src="../components/cart/my-cart.js"></script>
  <script type="module" src="../components/footer/my-footer.js"></script>
  <script type="module" src="../components/form/my-form.js"></script>
  
  <style>
    [x-cloak] { display: none !important; }

    .car-content h1 { font-size: 1.75rem; font-weight: 900; margin-top: 1.5rem; margin-bottom: 1rem; color: #000; line-height: 1.25; letter-spacing: -0.025em; }
    .car-content h2 { font-size: 1.4rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #171717; letter-spacing: -0.02em; }
    .car-content h3 { font-size: 1.15rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #262626; }
    .car-content p { font-size: 0.95rem; line-height: 1.7; margin-bottom: 1.25rem; color: #404040; }
    .car-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #404040; }
    .car-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #404040; }
    .car-content li { margin-bottom: 0.5rem; font-size: 0.95rem; line-height: 1.6; }
    .car-content blockquote { border-left: 4px solid #171717; padding-left: 1rem; font-style: italic; margin-top: 1.25rem; margin-bottom: 1.25rem; color: #525252; }
    .car-content pre { background-color: #171717; color: #f5f5f5; padding: 1rem; overflow-x: auto; margin-top: 1.25rem; margin-bottom: 1.25rem; font-size: 0.875rem; border-radius: 0.75rem; }
    .car-content code { background-color: #f5f5f5; color: #171717; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace; }
    .car-content pre code { background-color: transparent; color: inherit; padding: 0; }
    .car-content a { color: #000; text-decoration: underline; font-weight: 600; }
    .car-content a:hover { color: #525252; }
  </style>
</head>
<body class="bg-neutral-50 min-h-screen flex flex-col font-sans text-neutral-900 selection:bg-black selection:text-white">

  <!-- Navbar -->
  <my-navbar>
    <div class="flex gap-6 items-center flex-grow">
      <a href="../index.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Home</a>
      <a href="../index.html#shop" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Shop</a>
      <a href="../car.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-black font-bold border-b-2 border-black pb-0.5">Cars</a>
      <a href="../blog.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Blog</a>
      <a href="../contact.html" class="hover:text-black transition-colors font-semibold text-xs tracking-wider uppercase text-neutral-600">Contact</a>
    </div>
    
    <my-cart storage-key="main_store_cart"></my-cart>
  </my-navbar>

  <!-- Main Standalone Vehicle Container with Alpine.js State -->
  <main class="p-4 md:p-8 flex flex-col items-center mt-4 w-full max-w-7xl mx-auto flex-grow gap-12" x-data="carPage()" x-cloak>
    <div class="w-full max-w-5xl mx-auto flex flex-col gap-8">
      
      <!-- Main Vehicle Card -->
      <div class="bg-white rounded-3xl border border-neutral-200 overflow-hidden flex flex-col md:flex-row w-full shadow-sm">
        
        <!-- Left: Image Preview -->
        <div class="w-full md:w-1/2 bg-neutral-100 flex items-center justify-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-neutral-200">
          <img 
            :src="currentImage" 
            :alt="car.title" 
            src="${initialImage}" 
            alt="${escapeHtml(car.title)}"
            class="w-full max-w-md object-contain mix-blend-multiply transition-all duration-300"
          >
        </div>

        <!-- Right: Details, Dropdown Selectors, and Contact Now -->
        <div class="w-full md:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col justify-between">
          
          <div>
            <!-- Tags -->
            <div class="flex flex-wrap gap-1.5 mb-3">
              ${tagsHtml}
            </div>

            <!-- Vehicle Title & Short Description -->
            <h1 class="text-2xl lg:text-3xl font-black text-black mb-2 leading-tight tracking-tight" x-text="car.title">${escapeHtml(car.title)}</h1>
            <p class="text-neutral-500 text-xs md:text-sm mb-4 leading-relaxed line-clamp-2" x-text="car.description">${escapeHtml(car.description)}</p>

            <!-- Dynamic Price Display (MSRP) -->
            <div class="flex items-baseline gap-2 mb-5">
              <span class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Est. MSRP:</span>
              <span class="text-2xl lg:text-3xl font-black text-black tracking-tight" x-text="'BDT ' + Number(currentPrice).toLocaleString('en-US')">BDT ${Number(initialPrice).toLocaleString('en-US')}</span>
              <template x-if="currentPrice !== car.price">
                <span class="text-xs font-bold text-neutral-400 line-through" x-text="'BDT ' + Number(car.price).toLocaleString('en-US')"></span>
              </template>
            </div>

            <!-- Dropdown: Edition / Trim (Level 1) -->
            <template x-if="car.types && car.types.length > 0">
              <div class="mb-3.5">
                <label for="trim-dropdown" class="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Select Edition / Trim
                </label>
                <div class="relative">
                  <select 
                    id="trim-dropdown"
                    x-model.number="selectedTypeIndex" 
                    @change="selectedSubProductIndex = 0"
                    class="w-full appearance-none bg-neutral-50 hover:bg-white border border-neutral-300 hover:border-black rounded-xl px-4 py-3 text-xs font-bold text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer pr-10"
                  >
                    <template x-for="(type, idx) in car.types" :key="type.subProductId || idx">
                      <option 
                        :value="idx" 
                        x-text="type.subTitle + (type.price && type.price !== car.price ? ' — BDT ' + Number(type.price).toLocaleString('en-US') : '')"
                      ></option>
                    </template>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </template>

            <!-- Dropdown: Package / Options (Level 2) -->
            <template x-if="selectedType && selectedType.subProducts && selectedType.subProducts.length > 0">
              <div class="mb-4">
                <label for="package-dropdown" class="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Select Package / Wheels Option
                </label>
                <div class="relative">
                  <select 
                    id="package-dropdown"
                    x-model.number="selectedSubProductIndex"
                    class="w-full appearance-none bg-neutral-50 hover:bg-white border border-neutral-300 hover:border-black rounded-xl px-4 py-3 text-xs font-bold text-neutral-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer pr-10"
                  >
                    <template x-for="(sub, sIdx) in selectedType.subProducts" :key="sub.subProductId || sIdx">
                      <option 
                        :value="sIdx" 
                        x-text="sub.subTitle + (sub.price && sub.price !== (selectedType.price || car.price) ? ' — BDT ' + Number(sub.price).toLocaleString('en-US') : '')"
                      ></option>
                    </template>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Contact Now Action Button -->
          <div class="pt-4 border-t border-neutral-100 flex flex-col gap-2 mt-4">
            <button 
              type="button"
              @click="contactNow()" 
              class="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all h-13 flex items-center justify-center gap-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact Now</span>
            </button>
            <p class="text-[10px] text-center text-neutral-400 font-medium">Inquire for allocations, bespoke build sheet, or test drive.</p>
          </div>

        </div>
      </div>

      <!-- Vehicle Overview Rich Content Section -->
      ${car.content ? `
      <section class="bg-white rounded-3xl border border-neutral-200 p-6 md:p-10 w-full shadow-sm">
        <h2 class="text-lg md:text-xl font-black text-black uppercase tracking-wider mb-5 border-b border-neutral-100 pb-3">Technical Specifications</h2>
        <div class="car-content text-neutral-800">
          ${car.content}
        </div>
      </section>
      ` : ''}

    </div>
  </main>

  <!-- Footer -->
  <my-footer>
    <div slot="description">
      <h3 class="text-xs font-bold text-white uppercase tracking-widest mb-2">Rawgad Automotive</h3>
      <p class="text-xs text-neutral-400 leading-relaxed">
        Engineered with Web Components and Tailwind CSS. No bloat, just speed.
      </p>
    </div>

    <div slot="social" class="flex flex-col gap-2 text-xs">
      <a href="https://twitter.com" target="_blank" class="text-neutral-400 hover:text-white transition-colors">X (Twitter)</a>
      <a href="https://instagram.com" target="_blank" class="text-neutral-400 hover:text-white transition-colors">Instagram</a>
      <a href="https://youtube.com" target="_blank" class="text-neutral-400 hover:text-white transition-colors">YouTube</a>
    </div>

    <div slot="extra">
      <h3 class="text-xs font-bold text-white uppercase tracking-widest mb-4">Newsletter</h3>
      <my-form api-endpoint="https://script.google.com/macros/s/AKfycbwnstevpnw3FdYnnuMF75_KaZk8Qi_8qqsWX0DsZ-Mr4fWahfmKMZyGHhubMj6ydxiy/exec" button-text="Subscribe">
        <input type="email" name="email" placeholder="Enter your email..." required class="border border-neutral-800 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-white w-full mb-2">
      </my-form>
    </div>
  </my-footer>

  <!-- Alpine.js Component Controller -->
  <script>
    document.addEventListener('alpine:init', () => {
      Alpine.data('carPage', () => ({
        car: ${sanitizedCarJson},
        selectedTypeIndex: 0,
        selectedSubProductIndex: 0,

        get selectedType() {
          if (!this.car.types || this.car.types.length === 0) return null;
          return this.car.types[this.selectedTypeIndex] || this.car.types[0];
        },

        get selectedSubProduct() {
          const type = this.selectedType;
          if (!type || !type.subProducts || type.subProducts.length === 0) return null;
          return type.subProducts[this.selectedSubProductIndex] || type.subProducts[0];
        },

        get activeItem() {
          return this.selectedSubProduct || this.selectedType || this.car;
        },

        get currentImage() {
          return this.selectedSubProduct?.subImage || this.selectedType?.subImage || this.car.imageSrc;
        },

        get currentPrice() {
          if (this.selectedSubProduct && typeof this.selectedSubProduct.price === 'number') {
            return this.selectedSubProduct.price;
          }
          if (this.selectedType && typeof this.selectedType.price === 'number') {
            return this.selectedType.price;
          }
          return Number(this.car.price) || 0;
        },

        contactNow() {
          const type = this.selectedType;
          const sub = this.selectedSubProduct;
          const params = new URLSearchParams({
            car_id: this.car.id,
            vehicle: this.car.title,
            trim: type ? type.subTitle : '',
            package: sub ? sub.subTitle : '',
            est_price: String(this.currentPrice)
          });
          window.location.href = '../contact.html?' + params.toString();
        }
      }));
    });
  </script>

</body>
</html>`;
}

/**
 * Builds standalone HTML pages inside cr/ directory
 */
function buildHtmlCars() {
  if (!fs.existsSync(CARS_JSON_FILE)) {
    console.log(`[build-html-cars] cars.json not found. Triggering build-car.js...`);
    generateCarsJson();
  }

  if (!fs.existsSync(HTML_OUTPUT_DIR)) {
    fs.mkdirSync(HTML_OUTPUT_DIR, { recursive: true });
  }

  const rawData = fs.readFileSync(CARS_JSON_FILE, 'utf8');
  const cars = JSON.parse(rawData);

  let count = 0;
  cars.forEach(car => {
    const filePath = path.join(HTML_OUTPUT_DIR, `${car.id}.html`);
    fs.writeFileSync(filePath, generateStandaloneCarHTML(car));
    count++;
  });

  console.log(`[build-html-cars] Successfully built ${count} standalone vehicle pages (with dropdown selectors) in ${HTML_OUTPUT_DIR}`);
  return cars;
}

if (require.main === module) {
  buildHtmlCars();
}

module.exports = buildHtmlCars;
