/** Shared font metrics for Phaser layout and the native uiText surface. */

export const UI_FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Text texture resolution clamped to a sensible 2-3x range for hi-DPI phones. */
export const uiTextResolution = (): number => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(3, Math.max(2, Math.ceil(dpr)));
};
