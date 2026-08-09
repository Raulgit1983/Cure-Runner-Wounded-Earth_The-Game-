import { describe, expect, it } from 'vitest';

import { journeyConfig } from '@/game/content/journeyConfig';

import {
  BG_BOTTOM_Y,
  BG_CENTER_X,
  BG_HEIGHT,
  BG_PARALLAX_LIMIT,
  BG_SCALE,
  BG_TOP_Y,
  BG_WIDTH,
  BLACK_FOREST_TEXTURES,
  IRIS_GAZE_MAX_X,
  IRIS_GAZE_MAX_Y,
  IRIS_SRC_HEIGHT,
  IRIS_SRC_WIDTH,
  IRIS_SRC_X,
  IRIS_SRC_Y,
  MOUTH_SRC_HEIGHT,
  MOUTH_SRC_WIDTH,
  MOUTH_SRC_X,
  MOUTH_SRC_Y,
  PLATE_SRC_HEIGHT,
  PLATE_SRC_WIDTH,
  irisSourceBounds,
  resolveIrisGaze,
  toLocalX,
  toLocalY
} from './blackForestArt';

describe('Black Forest colour-art registration', () => {
  it('keeps every lifted part inside the authored plate', () => {
    expect(IRIS_SRC_X).toBeGreaterThanOrEqual(0);
    expect(IRIS_SRC_Y).toBeGreaterThanOrEqual(0);
    expect(IRIS_SRC_X + IRIS_SRC_WIDTH).toBeLessThanOrEqual(PLATE_SRC_WIDTH);
    expect(IRIS_SRC_Y + IRIS_SRC_HEIGHT).toBeLessThanOrEqual(PLATE_SRC_HEIGHT);
    expect(MOUTH_SRC_X).toBeGreaterThanOrEqual(0);
    expect(MOUTH_SRC_Y).toBeGreaterThanOrEqual(0);
    expect(MOUTH_SRC_X + MOUTH_SRC_WIDTH).toBeLessThanOrEqual(PLATE_SRC_WIDTH);
    expect(MOUTH_SRC_Y + MOUTH_SRC_HEIGHT).toBeLessThanOrEqual(PLATE_SRC_HEIGHT);
  });

  it('maps source top-lefts into the scaled, centred plate', () => {
    expect(toLocalX(PLATE_SRC_WIDTH / 2)).toBe(0);
    expect(toLocalY(PLATE_SRC_HEIGHT / 2)).toBe(0);
    expect(toLocalX(IRIS_SRC_X)).toBeCloseTo(
      (IRIS_SRC_X - PLATE_SRC_WIDTH / 2) * BG_SCALE
    );
    expect(toLocalY(MOUTH_SRC_Y)).toBeCloseTo(
      (MOUTH_SRC_Y - PLATE_SRC_HEIGHT / 2) * BG_SCALE
    );
  });

  it('rests at the authored registration', () => {
    expect(resolveIrisGaze(0, 0)).toEqual({ x: 0, y: 0 });
    expect(irisSourceBounds(resolveIrisGaze(0, 0))).toEqual({
      left: IRIS_SRC_X,
      top: IRIS_SRC_Y,
      right: IRIS_SRC_X + IRIS_SRC_WIDTH,
      bottom: IRIS_SRC_Y + IRIS_SRC_HEIGHT
    });
  });

  it('clamps the moving iris to its conservative socket budget', () => {
    const farPositive = resolveIrisGaze(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY
    );
    const farNegative = resolveIrisGaze(
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY
    );

    expect(farPositive).toEqual({
      x: IRIS_GAZE_MAX_X,
      y: IRIS_GAZE_MAX_Y
    });
    expect(farNegative).toEqual({
      x: -IRIS_GAZE_MAX_X,
      y: -IRIS_GAZE_MAX_Y
    });

    [farPositive, farNegative].forEach((gaze) => {
      const bounds = irisSourceBounds(gaze);

      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(PLATE_SRC_WIDTH);
      expect(bounds.bottom).toBeLessThanOrEqual(PLATE_SRC_HEIGHT);
    });
  });

  it('never lets the parallax drift expose bare canvas beside the plate', () => {
    const halfWidth = BG_WIDTH / 2;
    const viewWidth = journeyConfig.logicalSize.width;

    // The regression this bounds: a hand-set limit of 30 px against a 20 px
    // right-hand bleed left a 10 px strip of sky down the side of the drawing.
    expect(BG_PARALLAX_LIMIT).toBeLessThanOrEqual(20);
    expect(BG_PARALLAX_LIMIT).toBeGreaterThan(0);

    [BG_PARALLAX_LIMIT, -BG_PARALLAX_LIMIT].forEach((drift) => {
      // Strictly past each edge, not level with it: a plate that lands exactly
      // on the boundary shows a hairline once the canvas is scaled by a
      // fractional device-pixel ratio.
      expect(BG_CENTER_X + drift - halfWidth).toBeLessThan(0);
      expect(BG_CENTER_X + drift + halfWidth).toBeGreaterThan(viewWidth);
    });
  });

  it('states the band it occupies, clear of the play band', () => {
    expect(BG_HEIGHT).toBeCloseTo(PLATE_SRC_HEIGHT * BG_SCALE, 5);
    expect(BG_BOTTOM_Y - BG_TOP_Y).toBeCloseTo(BG_HEIGHT, 5);
    expect(BG_TOP_Y).toBeGreaterThanOrEqual(0);
    // It is a band across the upper screen, not a full-canvas plate: the
    // feather in the renderer exists precisely because it ends mid-screen.
    expect(BG_BOTTOM_Y).toBeLessThan(journeyConfig.logicalSize.height);
  });

  it('uses five unique gameplay texture keys', () => {
    const keys = Object.values(BLACK_FOREST_TEXTURES);

    expect(keys).toHaveLength(5);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
