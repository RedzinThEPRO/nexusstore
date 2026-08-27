import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const adminSrc = fileURLToPath(new URL('./src', import.meta.url));
const siteSrc = fileURLToPath(new URL('../site/src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // admin-only screens live here; everything else is shared with the site app
      { find: /^@\/pages\/admin\//, replacement: adminSrc + "/pages/admin/" },
      { find: /^@\//, replacement: siteSrc + '/' },
    ],
  },
});
