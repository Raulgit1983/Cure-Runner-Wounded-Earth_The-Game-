import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

/**
 * Every world's gameplay art is lazily requested by `JourneyScene.preload()` so
 * a player who never reaches the third world never downloads it. Two of the
 * Black Forest cut-outs (the re-cut eye at 3.5 kB and the closed mouth at
 * 2.8 kB) fall under Vite's 4 kB default, so they were being inlined as base64
 * into the JourneyScene chunk — bytes that shipped whether or not the stage was
 * reached, which is exactly what the lazy path exists to avoid. Opting the
 * whole `worlds/` tree out keeps every stage plate and cut-out a separate file,
 * so the lazy path holds for a future small export too. The alternative,
 * padding the WebPs past the limit, would mean altering Mateo's art to satisfy
 * a bundler.
 */
const toPosixPath = (value: string) => value.replace(/\\/g, '/');
/** Absolute, so it is anchored to THIS repo and cannot match a like-named path elsewhere. */
const WORLD_ASSETS_DIR = toPosixPath(
  fileURLToPath(new URL('./src/assets/worlds/', import.meta.url))
);

export default defineConfig({
  base: './',
  build: {
    // `false` = never inline; `undefined` = leave Vite's default rule alone.
    assetsInlineLimit: (filePath) =>
      toPosixPath(filePath).startsWith(WORLD_ASSETS_DIR) ? false : undefined,
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
