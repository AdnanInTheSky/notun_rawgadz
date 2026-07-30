/**
 * ============================================================================
 * AI SUMMARY / QUICK REFERENCE
 * ============================================================================
 * How to use:
 * • Import in any Lit component: `import { tailwindStyles } from '../utilities/tailwind.js';`
 * • Inject inside render(): `${tailwindStyles}`
 * 
 * What is happening inside:
 * • Exports a Lit `html` template containing a CDN stylesheet link to Tailwind CSS (v2.2.19) and baseline Shadow DOM styles.
 * • Sets up global font smoothing, box-sizing, black-and-white theme colors, and custom scrollbar styling.
 * ============================================================================
 */

import { html } from 'https://cdn.jsdelivr.net/npm/lit@3/+esm';

// Shared monochrome styles for Shadow DOM components
export const tailwindStyles = html`
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
  <style>
    :host {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      box-sizing: border-box;
      color: #000000;
    }
    *, *::before, *::after {
      box-sizing: inherit;
    }
    /* Subtle monochrome scrollbar */
    ::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    ::-webkit-scrollbar-track {
      background: #ffffff;
    }
    ::-webkit-scrollbar-thumb {
      background: #d1d5db;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  </style>
`;