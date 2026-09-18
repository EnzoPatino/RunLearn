import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  redirects: {
    '/docker': '/docker-explicacion',
    '/base-de-datos': '/database-explicacion',
    '/http-https': '/http-explicacion',
  },
});

