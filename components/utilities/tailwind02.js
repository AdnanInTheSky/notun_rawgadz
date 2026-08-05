/**import { css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

// This must contain the actual CSS rules your components use.
// In a real project, a build tool (like Vite or Webpack) generates this for you.
export const tailwindStyles = html`
   
  link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
  <style>
  :host {
    --iron-green: #84cc16;
    --iron-green-dark: #65a30d;
    --iron-dark: #0a0a0a;
    --iron-card: #111111;
    --iron-gray: #1a1a1a;
  }

  /* Your compiled Tailwind classes 
  .w-full { width: 100%; }
  .max-w-4xl { max-width: 56rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .py-20 { padding-top: 5rem; padding-bottom: 5rem; }
  .px-8 { padding-left: 2rem; padding-right: 2rem; }
  .font-sans { font-family: 'Inter', sans-serif; }
  .text-white { color: #fff; }
  .text-gray-400 { color: #9ca3af; }
  .text-gray-500 { color: #6b7280; }
  .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
  .font-bold { font-weight: 700; }
  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .bg-iron-card { background-color: var(--iron-card); }
  .bg-iron-green { background-color: var(--iron-green); }
  .text-iron-dark { color: var(--iron-dark); }
  .p-6 { padding: 1.5rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-full { border-radius: 9999px; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .justify-between { justify-content: space-between; }
  .items-center { align-items: center; }
  .gap-4 { gap: 1rem; }
  .border { border-width: 1px; }
  .border-gray-800 { border-color: #1f2937; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .hover\\:opacity-80:hover { opacity: 0.8; }
  </style>
`;
*/
/*
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
    --iron-green: #84cc16;
    --iron-green-dark: #65a30d;
    --iron-dark: #0a0a0a;
    --iron-card: #111111;
    --iron-gray: #1a1a1a;
  }

   Your compiled Tailwind classes 
  .w-full { width: 100%; }
  .max-w-4xl { max-width: 56rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .py-20 { padding-top: 5rem; padding-bottom: 5rem; }
  .px-8 { padding-left: 2rem; padding-right: 2rem; }
  .font-sans { font-family: 'Inter', sans-serif; }
  .text-white { color: #fff; }
  .text-gray-400 { color: #9ca3af; }
  .text-gray-500 { color: #6b7280; }
  .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
  .font-bold { font-weight: 700; }
  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .bg-iron-card { background-color: var(--iron-card); }
  .bg-iron-green { background-color: var(--iron-green); }
  .text-iron-dark { color: var(--iron-dark); }
  .p-6 { padding: 1.5rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-full { border-radius: 9999px; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .justify-between { justify-content: space-between; }
  .items-center { align-items: center; }
  .gap-4 { gap: 1rem; }
  .border { border-width: 1px; }
  .border-gray-800 { border-color: #1f2937; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .hover\\:opacity-80:hover { opacity: 0.8; }
  </style>
`;
