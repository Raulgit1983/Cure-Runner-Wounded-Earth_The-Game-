/**
 * Source geometry, registration and texture keys for The Black Forest's colour
 * production art (v4).
 *
 * Phaser-free on purpose. Every number here is measured against the 1080x695
 * plate, so the one thing that can silently break the drawing — a cut-out
 * landing a few pixels away from the hole it was lifted out of — is expressed
 * as data a plain unit test can bound. The previous integration's rectangular
 * eye was exactly that class of bug, and it was invisible to `tsc`.
 *
 * The renderer keeps the runtime behaviour (easing, parallax, yawn phase); this
 * module keeps the fixed relationship between the drawing and its pieces.
 */

import { journeyConfig } from '@/game/content/journeyConfig';

import type { YawnPhase } from './blackForestYawn';

/** The logical canvas this framing is measured against. Plain data, no Phaser. */
const VIEW_WIDTH = journeyConfig.logicalSize.width;

/**
 * The v4 assets loaded at runtime. The entry illustration is deliberately
 * absent: it is a complete static drawing with the iris and the open mouth
 * baked in, loaded by `LevelEntryScene` under its own key, so the entry screen
 * can never show the holes the gameplay plate carries.
 */
export const BLACK_FOREST_TEXTURES = {
  plate: 'black-forest-color-plate-v4',
  iris: 'black-forest-color-iris-v4',
  mouthClosed: 'black-forest-color-mouth-closed-v4',
  mouthMid: 'black-forest-color-mouth-mid-v4',
  mouthOpen: 'black-forest-color-mouth-open-v4'
} as const;

/**
 * One drawing per yawn phase, all three on the same canvas and the same anchor,
 * so the mouth is only ever swapped — never stretched, and never at the cost of
 * moving the trunk it is drawn on.
 */
export const MOUTH_PHASE_TEXTURES: Record<YawnPhase, string> = {
  closed: BLACK_FOREST_TEXTURES.mouthClosed,
  mid: BLACK_FOREST_TEXTURES.mouthMid,
  open: BLACK_FOREST_TEXTURES.mouthOpen
};

/** Source canvas of the colour plate, and of the entry illustration cut with it. */
export const PLATE_SRC_WIDTH = 1080;
export const PLATE_SRC_HEIGHT = 695;

/** On-screen width of the mid-plane; the height follows the source aspect ratio. */
export const BG_WIDTH = 460;
export const BG_SCALE = BG_WIDTH / PLATE_SRC_WIDTH;
/**
 * Framing carried over unchanged from the pale-ink integration: the illustration
 * sits as a band across the upper half, wider than the 360 px canvas so the
 * parallax drift never exposes an edge, and clear of the play band where the
 * hero, hazards and collectibles have to stay readable.
 */
export const BG_CENTER_X = 150;
export const BG_CENTER_Y = 235;

/** On-screen height of the mid-plane, and the band it occupies at rest. */
export const BG_HEIGHT = PLATE_SRC_HEIGHT * BG_SCALE;
export const BG_TOP_Y = BG_CENTER_Y - BG_HEIGHT / 2;
export const BG_BOTTOM_Y = BG_CENTER_Y + BG_HEIGHT / 2;

/**
 * How far the mid-plane may drift before the plate stops covering the canvas.
 *
 * Derived from the framing rather than chosen, because the framing is not
 * symmetric: the band is 460 px wide on a 360 px canvas but centred at 150, so
 * it bleeds 80 px past the left edge and only 20 px past the right. A hand-set
 * limit of 30 px therefore pulled the right edge to x=350 and left a 10 px strip
 * of bare sky down the side of the illustration for the whole second half of
 * every run — the drift crosses 20 px around 3 600 px of travel, and the stage
 * is 10 160 px long. Deriving it means re-framing the band can no longer
 * reintroduce that silently, and `blackForestArt.test.ts` bounds it.
 */
export const BG_LEFT_BLEED = -(BG_CENTER_X - BG_WIDTH / 2);
export const BG_RIGHT_BLEED = BG_CENTER_X + BG_WIDTH / 2 - VIEW_WIDTH;
/**
 * One logical pixel is held back from the smaller bleed. Spending it exactly
 * would park the plate's edge on the viewport's edge, and the canvas is scaled
 * by a fractional device-pixel ratio on a real phone, so "exactly on the edge"
 * is where a one-pixel hairline of sky appears.
 */
const BG_PARALLAX_EDGE_GUARD = 1;
export const BG_PARALLAX_LIMIT = Math.max(
  0,
  Math.min(BG_LEFT_BLEED, BG_RIGHT_BLEED) - BG_PARALLAX_EDGE_GUARD
);

/** The iris/pupil cut-out, and its neutral top-left inside the fixed sclera. */
export const IRIS_SRC_WIDTH = 44;
export const IRIS_SRC_HEIGHT = 44;
export const IRIS_SRC_X = 917;
export const IRIS_SRC_Y = 196;

/** The shared mouth canvas and the single top-left all three phases are drawn at. */
export const MOUTH_SRC_WIDTH = 249;
export const MOUTH_SRC_HEIGHT = 221;
export const MOUTH_SRC_X = 435;
export const MOUTH_SRC_Y = 297;

/**
 * How far the iris may travel from its neutral registration, in SOURCE pixels.
 *
 * The socket, the eyelids and the bark around them live in the plate and never
 * move; only this small disc does. The budget is therefore bounded by the white
 * of the sclera rather than by taste, and it is deliberately conservative: an
 * iris that reaches the eyelid stops reading as a look and starts reading as a
 * sprite sliding over a drawing.
 */
export const IRIS_GAZE_MAX_X = 8;
export const IRIS_GAZE_MAX_Y = 4;
/**
 * How far the player has to move from their resting position for the iris to
 * reach the end of that budget. Roughly a tall jump, so an ordinary hop reads
 * as a glance and a big one as a full look.
 */
export const IRIS_GAZE_SPAN_X = 120;
export const IRIS_GAZE_SPAN_Y = 120;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Source pixel -> position inside the mid-plane, whose plate is centred at (0,0). */
export const toLocalX = (sourceX: number) => (sourceX - PLATE_SRC_WIDTH / 2) * BG_SCALE;
export const toLocalY = (sourceY: number) => (sourceY - PLATE_SRC_HEIGHT / 2) * BG_SCALE;

export interface IrisGaze {
  x: number;
  y: number;
}

/**
 * "Follows The Player", as a pure function of how far the player is drawn from
 * where the same player is drawn while simply running. Rest is exactly (0,0),
 * which is the only registration where the cut-out recomposes the plate, and
 * the result can never leave the budget however the caller's inputs combine.
 */
export const resolveIrisGaze = (heroOffsetX: number, heroOffsetY: number): IrisGaze => ({
  x: clamp(heroOffsetX / IRIS_GAZE_SPAN_X, -1, 1) * IRIS_GAZE_MAX_X,
  y: clamp(heroOffsetY / IRIS_GAZE_SPAN_Y, -1, 1) * IRIS_GAZE_MAX_Y
});

/** The iris' occupied rectangle in source pixels, for a given gaze. */
export const irisSourceBounds = (gaze: IrisGaze) => ({
  left: IRIS_SRC_X + gaze.x,
  top: IRIS_SRC_Y + gaze.y,
  right: IRIS_SRC_X + gaze.x + IRIS_SRC_WIDTH,
  bottom: IRIS_SRC_Y + gaze.y + IRIS_SRC_HEIGHT
});
