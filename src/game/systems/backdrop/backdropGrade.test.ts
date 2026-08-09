import { describe, expect, it } from 'vitest';

import { depthRampBands, featherBands, horizonY, type GradeShape } from './backdropGrade';

const shape: GradeShape = { topAlpha: 0.34, horizonAlpha: 0.68, playAlpha: 1 };

describe('horizonY', () => {
  it('measures the horizon up from the ground line', () => {
    expect(horizonY(640, 548, 150)).toBe(398);
  });

  it('stays inside the viewport for an unusual ground line', () => {
    expect(horizonY(640, 40, 150)).toBe(0);
    expect(horizonY(640, 900, 150)).toBe(640);
  });
});

describe('depthRampBands', () => {
  it('covers the full height with no gap and no overlap', () => {
    const bands = depthRampBands(640, 398, shape);

    expect(bands[0].top).toBe(0);
    expect(bands[bands.length - 1].bottom).toBe(640);
    bands.slice(1).forEach((band, index) => {
      expect(band.top).toBe(bands[index].bottom);
    });
  });

  it('is weakest at the top and strongest across the play band', () => {
    const [upper, lower] = depthRampBands(640, 398, shape);

    expect(upper.topAlpha).toBe(shape.topAlpha);
    expect(upper.bottomAlpha).toBe(shape.horizonAlpha);
    expect(lower.topAlpha).toBe(shape.horizonAlpha);
    expect(lower.bottomAlpha).toBe(shape.playAlpha);
    // The whole point of the ramp: the art is LESS covered up top than the flat
    // veil this replaced, and the lane the player reads is more.
    expect(upper.topAlpha).toBeLessThan(lower.bottomAlpha);
  });

  it('meets continuously at the horizon so no tonal step is visible', () => {
    const [upper, lower] = depthRampBands(640, 398, shape);

    expect(upper.bottomAlpha).toBe(lower.topAlpha);
  });

  it('degrades to a single full-height band when the horizon is clamped out', () => {
    const bands = depthRampBands(640, 0, shape);

    expect(bands[0].bottom).toBe(0);
    expect(bands[1]).toMatchObject({ top: 0, bottom: 640 });
  });
});

describe('featherBands', () => {
  const feather = { topDepth: 34, bottomDepth: 62, overshoot: 10, edgeAlpha: 0.94 };

  it('starts outside the plate so the cut itself is already inside the ramp', () => {
    const [top, bottom] = featherBands(87, 383, feather);

    expect(top.top).toBe(77);
    expect(top.bottom).toBe(121);
    expect(bottom.top).toBe(321);
    expect(bottom.bottom).toBe(393);
  });

  it('is opaque at each edge and clear where it meets the drawing', () => {
    const [top, bottom] = featherBands(87, 383, feather);

    expect(top.topAlpha).toBe(feather.edgeAlpha);
    expect(top.bottomAlpha).toBe(0);
    expect(bottom.topAlpha).toBe(0);
    expect(bottom.bottomAlpha).toBe(feather.edgeAlpha);
  });

  it('leaves the middle of the plate untouched', () => {
    const [top, bottom] = featherBands(87, 383, feather);

    expect(top.bottom).toBeLessThan(bottom.top);
  });

  it('omits an edge whose depth is zero, and a degenerate plate entirely', () => {
    expect(featherBands(87, 383, { ...feather, topDepth: 0 })).toHaveLength(1);
    expect(featherBands(87, 383, { ...feather, bottomDepth: 0 })).toHaveLength(1);
    expect(featherBands(383, 87, feather)).toHaveLength(0);
  });
});
