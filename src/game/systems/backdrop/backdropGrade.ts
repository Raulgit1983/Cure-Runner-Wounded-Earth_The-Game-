/**
 * The tonal grade laid over a stage's backdrop art, as pure geometry.
 *
 * Phaser-free on purpose, like `imageBackdropLayout.ts` and `blackForestArt.ts`.
 * Everything here is a list of horizontal bands with an alpha at the top edge
 * and an alpha at the bottom edge; a renderer's whole job is to fill them with
 * `fillGradientStyle`. Keeping it pure is what lets the two things that are easy
 * to get silently wrong — a band that leaves a seam uncovered, a ramp that
 * darkens the wrong third of the screen — be bounded by a unit test instead of
 * by looking at a phone.
 *
 * Two shapes are built from the same primitive:
 *
 *   - `depthRampBands` — the readability grade. A flat veil across the whole
 *     screen treats Mateo's sky and the lane the player actually reads as the
 *     same problem, and they are opposites: the upper art wants to be left
 *     alone, and the play band wants to be quiet so a pale collectible and a
 *     dark hazard both separate from it. So the grade is weakest at the top and
 *     strongest across the play band.
 *   - `featherBands` — dissolving the hard horizontal edge of a plate that does
 *     not cover the screen into the page tone behind it, so an illustration
 *     ends in atmosphere rather than on a cut line.
 *
 * Neither one tints: both are meant to be filled with the stage's own page/sky
 * colour, so paper grain and every pencil hue survive underneath.
 */

export interface AlphaBand {
  top: number;
  bottom: number;
  topAlpha: number;
  bottomAlpha: number;
}

/**
 * The grade's profile down the screen, as multipliers of the renderer's single
 * strength knob rather than absolute alphas. Expressing it as a shape is what
 * lets one `setAlpha` still drive the whole grade as the world wakes up, without
 * the three stops drifting apart from each other.
 */
export interface GradeShape {
  /** At the top of the screen, over sky and the quiet part of the drawing. */
  topAlpha: number;
  /** At the horizon — just above where a jump peaks. */
  horizonAlpha: number;
  /** Across the play band, where readability beats fidelity. */
  playAlpha: number;
}

const clampRange = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

/**
 * Where the grade turns from "leave the art alone" to "quiet the lane".
 *
 * Measured up from the ground line rather than down from the top, because the
 * thing it has to clear is the top of a jump, and that is anchored to the floor.
 * Clamped into the viewport so a stage with an unusual ground line degrades to a
 * two-stop ramp instead of producing an inverted band.
 */
export const horizonY = (viewHeight: number, groundLineY: number, lift: number) =>
  clampRange(groundLineY - lift, 0, viewHeight);

/**
 * The readability grade, as two stacked gradient bands meeting at the horizon.
 *
 * Returns bands covering the full height with no gap and no overlap, so the fill
 * cannot leave a seam of ungraded art between them.
 */
export const depthRampBands = (
  viewHeight: number,
  horizon: number,
  shape: GradeShape
): AlphaBand[] => {
  const split = clampRange(horizon, 0, viewHeight);

  return [
    { top: 0, bottom: split, topAlpha: shape.topAlpha, bottomAlpha: shape.horizonAlpha },
    {
      top: split,
      bottom: viewHeight,
      topAlpha: shape.horizonAlpha,
      bottomAlpha: shape.playAlpha
    }
  ];
};

export interface FeatherSpec {
  /**
   * How far the dissolve reaches into the plate from each edge, in px. The two
   * edges are separate because they are not the same problem: the top meets
   * empty sky, while the bottom meets the play band and usually wants a longer
   * ramp so the art settles into a horizon rather than stopping on a line.
   */
  topDepth: number;
  bottomDepth: number;
  /** How far it reaches past the edge into the bare page behind it, in px. */
  overshoot: number;
  /** Alpha of the page tone right at the plate's edge. 1 hides the edge fully. */
  edgeAlpha: number;
}

/**
 * The two dissolves that turn a plate's hard top and bottom edges into
 * atmosphere.
 *
 * The overshoot matters: a band that starts exactly at the edge still leaves the
 * cut visible, because the first row of the plate is only covered by the band's
 * own first, near-zero alpha. Starting outside the plate — where the fill lands
 * on the page tone it is made of, and so is invisible — means the plate's actual
 * first row is already well inside the ramp.
 */
export const featherBands = (
  plateTop: number,
  plateBottom: number,
  feather: FeatherSpec
): AlphaBand[] => {
  const { topDepth, bottomDepth, overshoot, edgeAlpha } = feather;

  if (plateBottom <= plateTop) {
    return [];
  }

  const bands: AlphaBand[] = [];

  if (topDepth > 0) {
    bands.push({
      top: plateTop - overshoot,
      bottom: plateTop + topDepth,
      topAlpha: edgeAlpha,
      bottomAlpha: 0
    });
  }

  if (bottomDepth > 0) {
    bands.push({
      top: plateBottom - bottomDepth,
      bottom: plateBottom + overshoot,
      topAlpha: 0,
      bottomAlpha: edgeAlpha
    });
  }

  return bands;
};
