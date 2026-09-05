import Phaser from 'phaser';

/** Artwork only: preserves the two existing ingredient identities and anchors. */
export function createRewardArt(scene: Phaser.Scene, kind: 'nota-sol' | 'moonlight-shard') {
  const g = scene.add.graphics();
  if (kind === 'nota-sol') {
    // A warm paper/enamel keepsake. The clef is a drawn line, not a glyph that
    // can turn into a missing-font rectangle on a phone.
    g.fillStyle(0x17262b, 1).fillEllipse(0, 3, 67, 87);
    g.fillStyle(0xe0b766, 1).fillEllipse(0, 0, 60, 80);
    g.lineStyle(2, 0xfff0b1, 0.95).strokeEllipse(0, -1, 58, 78);
    g.fillStyle(0xf0e0bc, 1).fillEllipse(0, 1, 50, 68);
    g.lineStyle(1, 0x8d7350, 0.35);
    for (let y = -17; y <= 19; y += 9) g.lineBetween(-19, y, 19, y);
    const clef = new Phaser.Curves.Spline([
      -7, 28, 1, 33, 8, 25, 4, 6, -3, -17, -4, -31,
      2, -38, 7, -30, 3, -19, -12, -3, -14, 9, -5, 19,
      9, 15, 14, 4, 7, -5, -3, -5, -7, 2, -3, 9
    ]).getPoints(96);
    g.lineStyle(6, 0x493c30, 1).strokePoints(clef, false);
    g.lineStyle(3.5, 0xb58236, 1).strokePoints(clef, false);
    g.fillStyle(0x493c30, 1).fillCircle(-7, 28, 4);
    g.fillStyle(0xe4b969, 1).fillCircle(-8, 27, 2);
    g.fillStyle(0x6c9d7e, 1).fillEllipse(0, 45, 8, 11);
  } else {
    const outline = [{ x: 0, y: -40 }, { x: 28, y: -8 }, { x: 18, y: 24 }, { x: 0, y: 42 }, { x: -22, y: 17 }, { x: -27, y: -9 }];
    g.fillStyle(0x1c334b, 1).fillPoints(outline, true);
    g.lineStyle(3, 0xb5dfec, 1).strokePoints(outline, true);
    g.fillStyle(0xafd4de, 1).fillPoints([{ x: 0, y: -37 }, { x: 2, y: 8 }, { x: -24, y: -9 }], true);
    g.fillStyle(0x608ea7, 1).fillPoints([{ x: 0, y: -37 }, { x: 25, y: -8 }, { x: 2, y: 8 }], true);
    g.fillStyle(0x80b9c5, 1).fillPoints([{ x: -24, y: -9 }, { x: 2, y: 8 }, { x: 0, y: 38 }, { x: -20, y: 16 }], true);
    g.fillStyle(0x426886, 1).fillPoints([{ x: 25, y: -8 }, { x: 17, y: 23 }, { x: 0, y: 38 }, { x: 2, y: 8 }], true);
    g.lineStyle(2, 0xf5f5d9, 0.8).lineBetween(-22, -9, 0, -35);
    g.lineStyle(1, 0xd7e8e4, 0.5).lineBetween(2, 8, 0, 35);
    // The crescent is engraved within the shard, never a separate pickup.
    g.fillStyle(0xffecc0, 1).fillCircle(1, -3, 10);
    g.fillStyle(0x608ea7, 1).fillCircle(5, -6, 9);
    g.lineStyle(1, 0xe8f8ed, 0.25);
    g.lineBetween(-16, 3, -7, 7); g.lineBetween(-13, 14, -6, 17);
  }
  return g;
}
