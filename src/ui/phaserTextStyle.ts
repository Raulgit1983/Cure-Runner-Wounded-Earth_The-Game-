/**
 * Shared crisp text styling for the loading and level-entry scenes.
 *
 * The Phaser canvas renders at the 360x640 logical size and is then CSS-upscaled
 * to fill the phone, so text baked at 1x (or even 2x) still gets blurred on
 * hi-DPI screens. Baking text at the device pixel ratio keeps it sharp, and a
 * modern system font stack avoids the bitmap-looking Android fallback.
 */

export const UI_FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Text texture resolution clamped to a sensible 2-3x range for hi-DPI phones. */
export const uiTextResolution = (): number => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(3, Math.max(2, Math.ceil(dpr)));
};
