import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { createCollectibleArt, createPlatformArt } from './entityArt';

function fixture() {
  const g = {
    fillStyle: vi.fn().mockReturnThis(), fillEllipse: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(), strokeEllipse: vi.fn().mockReturnThis(),
    lineBetween: vi.fn().mockReturnThis(), fillPoints: vi.fn().mockReturnThis(),
    strokePoints: vi.fn().mockReturnThis()
  };
  const scene = { add: { graphics: vi.fn(() => g) } };
  return { g, scene: scene as unknown as Phaser.Scene, add: scene.add.graphics };
}

describe('auxiliary art contracts', () => {
  it.each(['spark', 'note', 'brush'] as const)('%s is one retained drawing, with no separate arrow-like objects', (variant) => {
    const { scene, g, add } = fixture();
    expect(createCollectibleArt(scene, variant, 'warm')).toBe(g);
    expect(add).toHaveBeenCalledTimes(1);
    // Every flag/beam stays connected to the stem region, not a floating mote.
    for (const [points] of g.fillPoints.mock.calls) {
      expect(points.some((p: { x: number }) => Math.abs(p.x) <= 4)).toBe(true);
    }
    expect(g.fillEllipse).toHaveBeenCalledTimes(variant === 'spark' ? 4 : 2);
  });

  it.each([72, 120, 188])('a %d px platform keeps the supported surface at the existing y=-9', (width) => {
    const { scene, g, add } = fixture();
    createPlatformArt(scene, width, 'cool');
    expect(add).toHaveBeenCalledTimes(1);
    const [outline] = g.fillPoints.mock.calls[0];
    expect(outline.slice(0, 2)).toEqual([
      { x: -width / 2 + 20, y: -9 }, { x: width / 2 - 20, y: -9 }
    ]);
    expect(outline.every((p: { x: number; y: number }) => Math.abs(p.x) <= width / 2 && p.y >= -9)).toBe(true);
  });

  it('warm/cool platforms keep the same silhouette and support geometry', () => {
    const warm = fixture(), cool = fixture();
    createPlatformArt(warm.scene, 120, 'warm');
    createPlatformArt(cool.scene, 120, 'cool');
    expect(warm.g.fillPoints.mock.calls).toEqual(cool.g.fillPoints.mock.calls);
    expect(warm.g.lineBetween.mock.calls).toEqual(cool.g.lineBetween.mock.calls);
    expect(warm.g.fillStyle.mock.calls).not.toEqual(cool.g.fillStyle.mock.calls);
  });
});
