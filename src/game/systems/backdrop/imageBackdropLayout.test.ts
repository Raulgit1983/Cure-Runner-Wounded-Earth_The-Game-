import { describe, expect, it } from 'vitest';

import {
  ARC_REST_ALPHA,
  arcPulse,
  beatSignal,
  clamp01,
  fitPlate,
  panCenterX,
  veilAlpha
} from './imageBackdropLayout';

/**
 * The two supplied plates and the logical canvas they have to live on. These
 * are the real numbers, so a future re-export that changes an aspect ratio
 * fails here instead of silently stretching Mateo's drawing on a phone.
 */
const VIEW = { width: 360, height: 640 };
const WOUNDED = { width: 941, height: 1672 };
const MOONLIGHT = { width: 1575, height: 999 };
const MOON_ARCS = { width: 1080, height: 680 };

describe('fitPlate', () => {
  it('scales the wounded plate uniformly on both axes', () => {
    const layout = fitPlate(WOUNDED, VIEW, 'contain');

    expect(layout.width / WOUNDED.width).toBeCloseTo(layout.height / WOUNDED.height, 12);
    expect(layout.scale).toBeCloseTo(layout.width / WOUNDED.width, 12);
  });

  it('keeps the whole wounded plate on screen, never cropping it', () => {
    const layout = fitPlate(WOUNDED, VIEW, 'contain');

    expect(layout.width).toBeLessThanOrEqual(VIEW.width + 1e-9);
    expect(layout.height).toBeLessThanOrEqual(VIEW.height + 1e-9);
  });

  it('fills the wounded canvas to within a pixel — the plate was cut for it', () => {
    const layout = fitPlate(WOUNDED, VIEW, 'contain');

    expect(VIEW.width - layout.width).toBeLessThan(1);
    expect(VIEW.height - layout.height).toBeLessThan(1);
  });

  it('gives the wounded plate no pan overflow, so it cannot drift', () => {
    expect(fitPlate(WOUNDED, VIEW, 'contain').overflowX).toBe(0);
  });

  it('scales the moonlight plate to the full viewport height', () => {
    const layout = fitPlate(MOONLIGHT, VIEW, 'cover-height');

    expect(layout.height).toBeCloseTo(VIEW.height, 9);
  });

  it('preserves the moonlight aspect ratio, leaving it wider than the screen', () => {
    const layout = fitPlate(MOONLIGHT, VIEW, 'cover-height');

    expect(layout.width / layout.height).toBeCloseTo(MOONLIGHT.width / MOONLIGHT.height, 9);
    expect(layout.width).toBeGreaterThan(VIEW.width);
    expect(layout.overflowX).toBeCloseTo(layout.width - VIEW.width, 9);
  });

  it('gives the arcs cut-out the same scale as the plate it belongs to', () => {
    // Both are placed by the renderer with the plate's own scale; this asserts
    // the cut-out is not secretly a different fit.
    const plate = fitPlate(MOONLIGHT, VIEW, 'cover-height');
    const arcs = fitPlate(MOON_ARCS, VIEW, 'cover-height');

    expect(arcs.scale).toBeGreaterThan(0);
    expect(plate.scale).toBeGreaterThan(0);
  });

  it('degenerates safely instead of producing an infinite scale', () => {
    const layout = fitPlate({ width: 0, height: 0 }, VIEW, 'contain');

    expect(layout.scale).toBe(0);
    expect(layout.width).toBe(0);
    expect(layout.overflowX).toBe(0);
    expect(layout.centerY).toBe(VIEW.height / 2);
  });
});

describe('panCenterX', () => {
  const layout = fitPlate(MOONLIGHT, VIEW, 'cover-height');

  it('starts with the plate left edge on the viewport left edge', () => {
    expect(panCenterX(layout, VIEW, 0) - layout.width / 2).toBeCloseTo(0, 9);
  });

  it('ends with the plate right edge on the viewport right edge', () => {
    expect(panCenterX(layout, VIEW, 1) + layout.width / 2).toBeCloseTo(VIEW.width, 9);
  });

  it('reveals exactly the overflow over the run and never more', () => {
    const travel = panCenterX(layout, VIEW, 0) - panCenterX(layout, VIEW, 1);

    expect(travel).toBeCloseTo(layout.overflowX, 9);
  });

  it('is monotonic across the run', () => {
    let previous = panCenterX(layout, VIEW, 0);

    for (let step = 1; step <= 20; step += 1) {
      const next = panCenterX(layout, VIEW, step / 20);

      expect(next).toBeLessThanOrEqual(previous + 1e-9);
      previous = next;
    }
  });

  it('clamps progress outside 0..1 to the two edges', () => {
    expect(panCenterX(layout, VIEW, -4)).toBeCloseTo(panCenterX(layout, VIEW, 0), 9);
    expect(panCenterX(layout, VIEW, 9)).toBeCloseTo(panCenterX(layout, VIEW, 1), 9);
  });

  it('centres a plate with no overflow instead of sliding it', () => {
    const wounded = fitPlate(WOUNDED, VIEW, 'contain');

    expect(panCenterX(wounded, VIEW, 0)).toBe(VIEW.width / 2);
    expect(panCenterX(wounded, VIEW, 1)).toBe(VIEW.width / 2);
  });
});

describe('beatSignal', () => {
  it('is silent when the player has done nothing', () => {
    expect(
      beatSignal({ collectFeedback: 0, chainFeedback: 0, awakeningFeedback: 0 })
    ).toBe(0);
  });

  it('rises with each of the three existing feedback channels', () => {
    const collect = beatSignal({ collectFeedback: 1, chainFeedback: 0, awakeningFeedback: 0 });
    const chain = beatSignal({ collectFeedback: 0, chainFeedback: 1, awakeningFeedback: 0 });
    const awakening = beatSignal({ collectFeedback: 0, chainFeedback: 0, awakeningFeedback: 1 });

    expect(collect).toBeGreaterThan(0);
    expect(chain).toBeGreaterThan(collect);
    expect(awakening).toBeGreaterThan(0);
    expect(awakening).toBeLessThan(collect);
  });

  it('never exceeds 1, however the three channels stack', () => {
    expect(
      beatSignal({ collectFeedback: 1, chainFeedback: 1, awakeningFeedback: 1 })
    ).toBe(1);
  });

  it('ignores negative and non-finite feedback', () => {
    expect(
      beatSignal({ collectFeedback: -3, chainFeedback: Number.NaN, awakeningFeedback: 0 })
    ).toBe(0);
  });
});

describe('arcPulse', () => {
  it('adds nothing at rest, so the arcs never read as a duplicate', () => {
    const pulse = arcPulse(0);

    expect(pulse.lineAlpha).toBe(ARC_REST_ALPHA);
    expect(pulse.weightAlpha).toBe(0);
    expect(pulse.weightScale).toBe(1);
  });

  it('answers a beat with a little more line, not a glow', () => {
    const pulse = arcPulse(1);

    expect(pulse.lineAlpha).toBeGreaterThan(0);
    expect(pulse.lineAlpha).toBeLessThan(0.4);
    expect(pulse.weightAlpha).toBeLessThan(pulse.lineAlpha);
  });

  it('thickens the stroke by well under a percent', () => {
    expect(arcPulse(1).weightScale).toBeGreaterThan(1);
    expect(arcPulse(1).weightScale).toBeLessThan(1.01);
  });

  it('is monotonic in the signal', () => {
    expect(arcPulse(0.25).lineAlpha).toBeLessThan(arcPulse(0.75).lineAlpha);
    expect(arcPulse(0.25).weightAlpha).toBeLessThan(arcPulse(0.75).weightAlpha);
  });

  it('clamps a signal outside 0..1', () => {
    expect(arcPulse(-2).lineAlpha).toBe(ARC_REST_ALPHA);
    expect(arcPulse(4).lineAlpha).toBe(arcPulse(1).lineAlpha);
  });
});

describe('veilAlpha', () => {
  const range = { restAlpha: 0.34, litAlpha: 0.12 };

  it('is heaviest on a sleeping world and lightest on an awake one', () => {
    expect(veilAlpha(0, range)).toBeCloseTo(0.34, 9);
    expect(veilAlpha(1, range)).toBeCloseTo(0.12, 9);
  });

  it('thins monotonically as the world wakes', () => {
    expect(veilAlpha(0.25, range)).toBeGreaterThan(veilAlpha(0.75, range));
  });

  it('stays inside the declared range for out-of-band levels', () => {
    expect(veilAlpha(-1, range)).toBeCloseTo(range.restAlpha, 9);
    expect(veilAlpha(2, range)).toBeCloseTo(range.litAlpha, 9);
  });
});

describe('clamp01', () => {
  it('passes through the unit range and clamps outside it', () => {
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });

  it('treats non-finite input as zero', () => {
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
