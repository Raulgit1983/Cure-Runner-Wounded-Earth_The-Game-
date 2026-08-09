import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

/**
 * Black Forest's gameplay art is lazily requested by `JourneyScene.preload()`
 * so a player who never reaches the third world never downloads it. Two of the
 * cut-outs (the re-cut eye at 3.5 kB and the closed mouth at 2.8 kB) fall under
 * Vite's 4 kB default, so they were being inlined as base64 into the
 * JourneyScene chunk — bytes that shipped whether or not the stage was reached,
 * which is exactly what the lazy path exists to avoid. Opting this directory
 * out keeps all six as separate files. The alternative, padding the WebPs past
 * the limit, would mean altering Mateo's art to satisfy a bundler.
 */
const toPosixPath = (value: string) => value.replace(/\\/g, '/');
/** Absolute, so it is anchored to THIS repo and cannot match a like-named path elsewhere. */
const BLACK_FOREST_RUNTIME_DIR = toPosixPath(
  fileURLToPath(new URL('./src/assets/worlds/black-forest/runtime/', import.meta.url))
);

export default defineConfig({
  base: './',
  build: {
    // `false` = never inline; `undefined` = leave Vite's default rule alone.
    assetsInlineLimit: (filePath) =>
      toPosixPath(filePath).startsWith(BLACK_FOREST_RUNTIME_DIR) ? false : undefined,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/phaser/')) {
            return 'phaser-core';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4321,
    strictPort: true
  }
});
