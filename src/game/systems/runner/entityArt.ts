import type Phaser from 'phaser';
import type { CollectibleVariant } from '@/game/content/runnerPhrases';

/**
 * Auxiliary art is not a Mateo source drawing (Raúl, 2026-09-05).
 * Fixed, connected musical silhouettes; no floating annotation-like triangles.
 * Geometry is drawn once. Physics, pickup radius and platform support are owned
 * by the runner/catalogue and are deliberately absent from these factories.
 */
export function createCollectibleArt(
  scene: Phaser.Scene,
  variant: CollectibleVariant,
  palette: 'warm' | 'cool'
) {
  const g = scene.add.graphics();
  const edge = 0x262330;
  const gold = palette === 'cool' ? 0xf2c868 : 0xe7bd66;
  const light = palette === 'cool' ? 0xfff1c5 : 0xffe5a0;
  const shade = 0x92704e;
  const head = (x: number, y: number) => {
    g.fillStyle(shade, 1).fillEllipse(x, y + 1, 19, 14);
    g.lineStyle(2.5, edge, 1).strokeEllipse(x, y + 1, 19, 14);
    g.fillStyle(gold, 1).fillEllipse(x, y - 1, 16, 10);
    g.lineStyle(1.6, light, 1).lineBetween(x - 5, y - 3, x + 3, y - 4);
  };
  const stem = (x: number, top: number, bottom: number) => {
    g.lineStyle(7, edge, 1).lineBetween(x, top, x, bottom);
    g.lineStyle(4, gold, 1).lineBetween(x, top, x, bottom);
    g.lineStyle(1, light, 0.9).lineBetween(x - 1, top + 1, x - 1, bottom - 2);
  };
  const polygon = (points: Array<{ x: number; y: number }>) => {
    g.fillStyle(gold, 1).fillPoints(points, true);
    g.lineStyle(2, edge, 1).strokePoints(points, true);
  };
  if (variant === 'spark') {
    stem(-2, -19, 9); stem(16, -16, 12);
    polygon([{ x: -4, y: -22 }, { x: 18, y: -18 }, { x: 18, y: -11 }, { x: -4, y: -15 }]);
    g.lineStyle(1.5, light, 1).lineBetween(-2, -20, 16, -17);
    head(-9, 9); head(9, 12);
  } else {
    stem(3, -22, 9);
    const flag = (top: number) => polygon([
      { x: 3, y: top }, { x: 10, y: top + 2 }, { x: 16, y: top + 7 },
      { x: 18, y: top + 13 }, { x: 14, y: top + 12 },
      { x: 10, y: top + 8 }, { x: 3, y: top + 7 }
    ]);
    flag(-24);
    if (variant === 'brush') flag(-13);
    head(-4, 11);
  }
  return g;
}

export function createPlatformArt(scene: Phaser.Scene, width: number, palette: 'warm' | 'cool') {
  const g = scene.add.graphics();
  const half = width / 2;
  const cool = palette === 'cool';
  const body = cool ? 0x486176 : 0x3f6154;
  const edge = cool ? 0x192b40 : 0x142c27;
  const lip = cool ? 0xd8eff1 : 0xd4dda6;
  g.fillStyle(0x040b10, 0.3).fillEllipse(0, 23, width * 0.88, 10);
  const outline = [
    { x: -half + 20, y: -9 }, { x: half - 20, y: -9 },
    { x: half - 2, y: -3 }, { x: half - 5, y: 8 },
    { x: half - 25, y: 15 }, { x: half * 0.18, y: 17 },
    { x: -half * 0.3, y: 14 }, { x: -half + 9, y: 10 }, { x: -half + 2, y: -2 }
  ];
  g.fillStyle(body, 1).fillPoints(outline, true);
  g.lineStyle(3, edge, 1).strokePoints(outline, true);
  // The brightest, flat lip matches the existing supported span and y=-9.
  g.lineStyle(4, lip, 1).lineBetween(-half + 20, -7, half - 20, -7);
  g.lineStyle(1, 0xfff7d9, 0.7).lineBetween(-half + 22, -9, half - 22, -9);
  g.lineStyle(2, edge, 0.7).lineBetween(-half + 10, 5, half - 12, 5);
  g.lineStyle(1, lip, 0.25);
  for (let x = -half + 18; x < half - 12; x += 17) g.lineBetween(x, 8, x + 8, 10);
  return g;
}
