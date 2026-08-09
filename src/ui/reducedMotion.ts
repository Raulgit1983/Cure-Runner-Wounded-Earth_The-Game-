/**
 * Single source for the reduced-motion preference.
 *
 * `global.css` already honours it for DOM/CSS animation; this is the canvas-side
 * equivalent, for effects Phaser drives with tweens. Read it at the moment an
 * effect starts rather than caching, so a mid-session change is respected.
 */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
