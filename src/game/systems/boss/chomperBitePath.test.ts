import { describe, expect, it } from 'vitest';
import { CHOMPER_BITE_PATH as P, resolveChomperBitePoint } from './chomperBitePath';

describe('Chomper bite path', () => {
  it('descends on the far-left side instead of falling over the hero', () => {
    for (let p = 0; p <= P.stageProgress; p += 0.01) {
      expect(resolveChomperBitePoint(p).x).toBeLessThan(100);
    }
  });

  it('sweeps from left to right in a narrow ground-level band', () => {
    let previousX = -Infinity;
    for (let p = P.stageProgress; p <= P.contactProgress; p += 0.01) {
      const point = resolveChomperBitePoint(p);
      expect(point.x).toBeGreaterThanOrEqual(previousX);
      expect(point.y).toBeGreaterThanOrEqual(514);
      expect(point.y).toBeLessThanOrEqual(531);
      previousX = point.x;
    }
    expect(resolveChomperBitePoint(P.contactProgress)).toEqual(P.contact);
  });

  it('retreats below and left before rising, away from the hero column', () => {
    expect(resolveChomperBitePoint(P.retreatProgress)).toEqual(P.retreat);
    for (let p = P.retreatProgress; p <= 1; p += 0.01) {
      expect(resolveChomperBitePoint(p).x).toBeLessThan(120);
    }
    expect(resolveChomperBitePoint(1)).toEqual(P.end);
  });
});
