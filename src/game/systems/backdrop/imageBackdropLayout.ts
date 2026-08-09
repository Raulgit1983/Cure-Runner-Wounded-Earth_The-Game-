/**
 * The sizing, panning and pulse maths behind the image-backed stage plates.
 *
 * Phaser-free on purpose, exactly like `blackForestYawn.ts`: every edge case
 * that decides whether Mateo's drawing is stretched, cropped or drifted off its
 * own canvas is a pure function here, and `ImageBackdropRenderer` is left with
 * the job of moving sprites to the numbers this file returns.
 *
 * Two fits, because the two supplied plates are two different problems:
 *
 *   - `contain`     — Wounded Planet is a portrait plate whose aspect ratio is
 *                     within a fifth of a pixel of the 360x640 logical canvas.
 *                     Uniform scale, nothing cropped, letterbox measured in
 *                     tenths of a pixel.
 *   - `cover-height` — Moonlight Mountain is a landscape plate that must keep
 *                     its full source canvas. It is scaled so its HEIGHT fills
 *                     the viewport, which leaves it much wider than the screen,
 *                     and that overflow is what the bounded pan reveals.
 *
 * Neither fit ever scales x and y by different factors. That is the single
 * invariant this module exists to protect.
 */

export interface BackdropSize {
  width: number;
  height: number;
}

export type BackdropFit = 'contain' | 'cover-height';

export interface PlateLayout {
  /** Uniform scale applied to BOTH axes. */
  scale: number;
  /** On-screen size of the plate at that scale. */
  width: number;
  height: number;
  /** Centre of the viewport vertically — the plate is drawn with origin 0.5. */
  centerY: number;
  /** How much wider than the viewport the plate is; 0 when it fits. */
  overflowX: number;
}

export const clamp01 = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value < 0 ? 0 : value > 1 ? 1 : value;
};

/**
 * A source canvas with a zero or negative dimension would produce an infinite
 * or negative scale and take the whole stage down with it, so it degenerates to
 * "draw nothing at scale 0" rather than throwing inside a scene constructor.
 */
export const fitPlate = (
  source: BackdropSize,
  view: BackdropSize,
  fit: BackdropFit
): PlateLayout => {
  if (
    !Number.isFinite(source.width) ||
    !Number.isFinite(source.height) ||
    source.width <= 0 ||
    source.height <= 0
  ) {
    return { scale: 0, width: 0, height: 0, centerY: view.height / 2, overflowX: 0 };
  }

  const scale =
    fit === 'cover-height'
      ? view.height / source.height
      : Math.min(view.width / source.width, view.height / source.height);
  const width = source.width * scale;
  const height = source.height * scale;

  return {
    scale,
    width,
    height,
    centerY: view.height / 2,
    overflowX: Math.max(0, width - view.width)
  };
};

/**
 * Where the plate's centre sits for a given 0..1 travel progress.
 *
 * Bounded by construction: at 0 the plate's LEFT edge is on the viewport's left
 * edge, at 1 its RIGHT edge is on the viewport's right edge, so no pan can ever
 * expose blank canvas beside the drawing. A plate that is not wider than the
 * viewport has nothing to reveal and stays centred, which is also what makes
 * this safe to call for Wounded Planet's near-exact fit.
 */
export const panCenterX = (layout: PlateLayout, view: BackdropSize, progress: number) => {
  if (layout.overflowX <= 0) {
    return view.width / 2;
  }

  const leftMost = layout.width / 2;
  const rightMost = view.width - layout.width / 2;

  return leftMost + (rightMost - leftMost) * clamp01(progress);
};

/**
 * The stage's existing feedback signal, unchanged in spirit from the painted
 * moonlight renderer's `beatGlow`: collect, chain and awakening, already
 * decayed by the scene. There is no clock, no tempo and no timer here — the
 * arcs only ever answer something the player just did.
 */
export interface BackdropBeatInputs {
  collectFeedback: number;
  chainFeedback: number;
  awakeningFeedback: number;
}

export const beatSignal = (inputs: BackdropBeatInputs) =>
  clamp01(
    clamp01(inputs.collectFeedback) * 0.48 +
      clamp01(inputs.chainFeedback) * 0.68 +
      clamp01(inputs.awakeningFeedback) * 0.24
  );

export interface ArcPulse {
  /** Alpha of the arc overlay itself. */
  lineAlpha: number;
  /** Alpha of the very slightly larger second pass that thickens the stroke. */
  weightAlpha: number;
  /** Scale of that second pass, relative to the plate's own scale. */
  weightScale: number;
}

/**
 * The open arcs are already drawn into the plate. Laying the cut-out on top at
 * rest would double the graphite and read as a duplicate, so rest is alpha 0 —
 * literally nothing added — and a beat brings the same line back a little
 * stronger, plus a second pass a fraction of a percent larger so the stroke
 * gains weight the way a pencil line does when it is gone over twice.
 *
 * No closed disk, no filled moon, no halo, no bloom, no background flash: the
 * only things that move are these two alphas and a sub-pixel scale.
 */
export const ARC_REST_ALPHA = 0;
export const ARC_PULSE_ALPHA = 0.26;
export const ARC_PULSE_WEIGHT_ALPHA = 0.11;
export const ARC_PULSE_WEIGHT_SCALE = 0.006;

export const arcPulse = (signal: number): ArcPulse => {
  const strength = clamp01(signal);

  return {
    lineAlpha: ARC_REST_ALPHA + strength * ARC_PULSE_ALPHA,
    weightAlpha: strength * ARC_PULSE_WEIGHT_ALPHA,
    weightScale: 1 + strength * ARC_PULSE_WEIGHT_SCALE
  };
};

/**
 * The readability veil over the plate. It is a flat tone, not a blur or a
 * vignette, so the paper grain and every pencil stroke survive underneath while
 * the bright hero, collectibles and hazards keep the foreground. It thins as
 * the world wakes up, which is the only thing the emotional level is allowed to
 * do to Mateo's colours here.
 */
export interface VeilRange {
  restAlpha: number;
  litAlpha: number;
}

export const veilAlpha = (environmentLevel: number, range: VeilRange) =>
  range.restAlpha + (range.litAlpha - range.restAlpha) * clamp01(environmentLevel);
