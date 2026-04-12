import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        photos: resolve(__dirname, 'photos.html'),
        songs: resolve(__dirname, 'songs.html'),
      },
    },
  },
});