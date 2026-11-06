// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // site origin only; the base path is added by Astro
  site: 'https://SelcukOzdemir23.github.io',
  base: '/retrotv',
  output: 'static',
  // A single page, but the integration lists it with and without the trailing slash.
  integrations: [svelte(), sitemap({ filter: (page) => page.endsWith('/') })],

  vite: {
    plugins: [tailwindcss()],
  },
});
