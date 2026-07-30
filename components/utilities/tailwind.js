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
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      box-sizing: border-box;
      color: #000000;
    }
    *, *::before, *::after {
      box-sizing: inherit;
    }
    /* Sleek monochrome scrollbar */
    ::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    ::-webkit-scrollbar-track {
      background: #fafafa;
    }
    ::-webkit-scrollbar-thumb {
      background: #171717;
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #404040;
    }
  </style>
`;