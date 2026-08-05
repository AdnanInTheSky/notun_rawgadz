import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { tailwindStyles } from '../utilities/tailwind02.js';

class WorkoutPrograms extends LitElement {
  static properties = {
    dataSrc: { type: String, attribute: 'data-src' },
    programs: { type: Array, state: true }
  };

  constructor() {
    super();
    this.programs = [];
  }

  firstUpdated() {
    this.fetchData();
  }

  async fetchData() {
    if (!this.dataSrc) return;
    try {
      const res = await fetch(this.dataSrc);
      this.programs = await res.json();
    } catch (err) {
      console.error("Failed to load programs", err);
    }
  }

  render() {
    return html`
      ${tailwindStyles}
      <section class="w-full max-w-4xl mx-auto py-20 px-8 font-sans">
        <h2 class="text-white text-3xl font-bold mb-2">Workout Programs</h2>
        <p class="text-gray-400 mb-8">Master the Basics</p>
        <div class="flex flex-col gap-4">
          ${this.programs.map(prog => html`
            <div class="bg-iron-card p-6 rounded-lg flex justify-between items-center border border-gray-800">
              <div>
                <h3 class="text-white text-xl font-bold mb-1">${prog.title}</h3>
                <p class="text-gray-400 text-sm mb-2">${prog.schedule}</p>
                <p class="text-gray-500 text-sm">${prog.description}</p>
              </div>
              <button class="bg-iron-green text-iron-dark font-bold py-2 px-6 rounded-full hover:opacity-80">
                ${prog.buttonText}
              </button>
            </div>
          `)}
        </div>
      </section>
    `;
  }
}
customElements.define('workout-programs', WorkoutPrograms);