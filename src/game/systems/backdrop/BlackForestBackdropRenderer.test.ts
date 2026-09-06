import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BlackForestBackdropRenderer } from './BlackForestBackdropRenderer';
import { BG_CENTER_X, BG_CENTER_Y, BG_PARALLAX_LIMIT, BLACK_FOREST_TEXTURES } from './blackForestArt';
import type { BackdropFrameTargets } from './StageBackdrop';

vi.mock('phaser', () => ({ default: { Math: {
  Linear: (a: number, b: number, t: number) => a + (b - a) * t,
  Clamp: (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
} } }));

class ArtObject {
  alpha = 1;
  depth = 0;
  children: ArtObject[] = [];
  destroyCount = 0;
  constructor(public x = 0, public y = 0, public key = '') {}
  setOrigin() { return this; }
  setScale() { return this; }
  setDepth(depth: number) { this.depth = depth; return this; }
  setAlpha(alpha: number) { this.alpha = alpha; return this; }
  setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
  setTexture(key: string) { this.key = key; return this; }
  clear = vi.fn();
  fillStyle = vi.fn(() => this);
  fillGradientStyle = vi.fn(() => this);
  fillRect = vi.fn(() => this);
  destroy() { this.destroyCount++; this.children.forEach((child) => child.destroy()); }
}

const targets: BackdropFrameTargets = {
  distanceTravelled: 0, levelProgress: 0, surfaceProgress: 0, finishRevealProgress: 0,
  environmentLevel: 0, collectFeedback: 0, chainFeedback: 0, awakeningFeedback: 0,
  heroX: 90, heroY: 520, heroRestX: 90, heroRestY: 520
};

function fixture(environment = 0, missingParts = false) {
  const roots: ArtObject[] = [];
  const graphics = () => { const g = new ArtObject(); roots.push(g); return g; };
  const scene = {
    add: {
      graphics,
      image: (x: number, y: number, key: string) => new ArtObject(x, y, key),
      container: (x: number, y: number, children: ArtObject[]) => {
        const c = new ArtObject(x, y); c.children = children; roots.push(c); return c;
      }
    },
    textures: { exists: () => !missingParts },
    tweens: { killTweensOf: vi.fn() }
  };
  const renderer = new BlackForestBackdropRenderer(scene as unknown as Phaser.Scene, environment);
  const plane = roots.find((g) => g.children.length)!;
  return { renderer, plane, veil: plane.children.at(-1)!, roots };
}

afterEach(() => vi.unstubAllGlobals());

describe('Black Forest assembled-art compositing', () => {
  it('dims once AFTER opaque plate/iris/mouth, never per overlapping child', () => {
    const { plane, veil } = fixture();
    expect(plane.alpha).toBe(1);
    expect(plane.children.slice(0, -1).map((g) => g.key)).toEqual([
      BLACK_FOREST_TEXTURES.plate, BLACK_FOREST_TEXTURES.iris, BLACK_FOREST_TEXTURES.mouthClosed
    ]);
    expect(plane.children.slice(0, -1).every((g) => g.alpha === 1)).toBe(true);
    expect(veil.alpha).toBeCloseTo(0.12);
    expect(veil.fillRect).toHaveBeenCalledOnce();
  });

  it('awakening changes only the final veil, without repainting static geometry', () => {
    const { renderer, plane, veil } = fixture(0.5);
    expect(veil.alpha).toBeCloseTo(0.075);
    renderer.update(0.016, 16, { ...targets, environmentLevel: 1, awakeningFeedback: 1 });
    expect(veil.alpha).toBeCloseTo(0);
    expect(plane.alpha).toBe(1);
    expect(veil.fillRect).toHaveBeenCalledOnce();
  });

  it('keeps the veil registered to the art at maximum travel', () => {
    const { renderer, plane, veil } = fixture();
    renderer.update(100, 100000, { ...targets, distanceTravelled: 20000 });
    expect(plane.x).toBe(BG_CENTER_X - BG_PARALLAX_LIMIT);
    expect(plane.y).toBe(BG_CENTER_Y);
    expect(plane.children.at(-1)).toBe(veil);
    expect(veil.x).toBe(0);
    expect(veil.y).toBe(0);
  });

  it('holds authored registration under reduced motion', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const { renderer, plane } = fixture();
    const iris = plane.children[1];
    const rest = { x: iris.x, y: iris.y };
    renderer.update(10, 10000, { ...targets, heroX: 999, heroY: -999, distanceTravelled: 99999 });
    expect({ x: iris.x, y: iris.y }).toEqual(rest);
    expect(plane.x).toBe(BG_CENTER_X);
    expect(plane.children[2].key).toBe(BLACK_FOREST_TEXTURES.mouthClosed);
  });

  it('also grades the plate when optional animated parts are unavailable', () => {
    const { plane, veil } = fixture(0, true);
    expect(plane.children).toHaveLength(2);
    expect(plane.children[0].key).toBe(BLACK_FOREST_TEXTURES.plate);
    expect(veil.alpha).toBeCloseTo(0.12);
  });

  it('disposes the veil with its parent exactly once and ignores later updates', () => {
    const { renderer, plane, veil } = fixture();
    renderer.destroy();
    renderer.destroy();
    renderer.update(1, 1000, targets);
    expect(plane.destroyCount).toBe(1);
    expect(veil.destroyCount).toBe(1);
  });
});
