import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Un seul fichier index.html : JavaScript, CSS, icône et animation sont intégrés.
// Les pages, miniatures, audio et zooms restent des fichiers liés (public/...).
export default defineConfig({
  plugins: [viteSingleFile()],
  resolve: {
    alias: {
      '@flipbook/viewer': path.resolve(__dirname, '../../packages/viewer/src/index.js'),
    },
  },
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});
