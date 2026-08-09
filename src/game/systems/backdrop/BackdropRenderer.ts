import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import { runnerConfig } from '@/game/content/runnerConfig';
import type { JourneyBackdropKind } from '@/game/content/journeyStages';
import { EmotionController, type MoodSnapshot } from '@/game/systems/emotion/EmotionController';

import type { BackdropFrameTargets, StageBackdrop } from './StageBackdrop';

/**
 * Owns the painted parallax backdrop for a journey stage: the Graphics layer,
 * the smoothed follow state, the redraw throttle, and the per-stage painters.
 * Extracted verbatim from JourneyScene (behavior-preserving) so the scene
 * stays an orchestrator. Redraws are throttled by journeyConfig.backdrop to
 * keep mobile GPU cost stable.
 */

export type { BackdropFrameTargets } from './StageBackdrop';

export class BackdropRenderer implements StageBackdrop {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly emotionController = new EmotionController();
  private readonly conduitHeights = [124, 156, 108, 168, 116, 144];
  private readonly conduitWidths = [18, 24, 16, 22, 20, 26];
  private readonly conduitOffsets = [12, -8, 18, -14, 10, -4];

  private distance = 0;
  private surfaceProgress = 0;
  private finishRevealProgress = 0;
  private environmentLevel: number;
  private lastRenderDistance = Number.NaN;
  private lastRenderSurface = Number.NaN;
  private lastRenderFinish = Number.NaN;
  private lastRenderLevel = Number.NaN;

  constructor(
    scene: Phaser.Scene,
    private readonly backdropKind: JourneyBackdropKind,
    initialEnvironmentLevel: number
  ) {
    this.graphics = scene.add.graphics().setDepth(0);
    this.environmentLevel = initialEnvironmentLevel;
  }

  /**
   * First paint right after scene create: distance/progress/feedback are all
   * zero and the redraw markers stay unset so the first update() repaints.
   */
  renderInitial(timeNow: number) {
    this.render(this.emotionController.getMood(this.environmentLevel), 0, 0, 0, timeNow, 0, 0, 0);
  }

  update(deltaSeconds: number, timeNow: number, targets: BackdropFrameTargets) {
    const follow = 1 - Math.exp(-deltaSeconds * journeyConfig.backdrop.followSharpness);

    this.distance = Phaser.Math.Linear(this.distance, targets.distanceTravelled, follow);
    this.surfaceProgress = Phaser.Math.Linear(
      this.surfaceProgress,
      targets.surfaceProgress,
      follow
    );
    this.finishRevealProgress = Phaser.Math.Linear(
      this.finishRevealProgress,
      targets.finishRevealProgress,
      follow
    );
    this.environmentLevel = Phaser.Math.Linear(
      this.environmentLevel,
      targets.environmentLevel,
      follow
    );

    if (!this.shouldRender()) {
      return;
    }

    this.render(
      this.emotionController.getMood(this.environmentLevel),
      this.distance,
      this.surfaceProgress,
      this.finishRevealProgress,
      timeNow,
      targets.collectFeedback,
      targets.chainFeedback,
      targets.awakeningFeedback
    );
    this.lastRenderDistance = this.distance;
    this.lastRenderSurface = this.surfaceProgress;
    this.lastRenderFinish = this.finishRevealProgress;
    this.lastRenderLevel = this.environmentLevel;
  }

  /** Graphics is scene-owned, but the interface asks every backdrop to clean up. */
  destroy() {
    this.graphics.destroy();
  }

  private shouldRender() {
    if (!Number.isFinite(this.lastRenderDistance)) {
      return true;
    }

    return (
      Math.abs(this.distance - this.lastRenderDistance) >=
        journeyConfig.backdrop.redrawDistancePx ||
      Math.abs(this.surfaceProgress - this.lastRenderSurface) >=
        journeyConfig.backdrop.redrawProgressStep ||
      Math.abs(this.finishRevealProgress - this.lastRenderFinish) >=
        journeyConfig.backdrop.redrawProgressStep ||
      Math.abs(this.environmentLevel - this.lastRenderLevel) >=
        journeyConfig.backdrop.redrawEmotionStep
    );
  }

  private mixStageColor(from: number, to: number, value: number) {
    const start = Phaser.Display.Color.ValueToColor(from);
    const end = Phaser.Display.Color.ValueToColor(to);
    const mixed = Phaser.Display.Color.Interpolate.ColorWithColor(
      start,
      end,
      100,
      Math.round(Phaser.Math.Clamp(value, 0, 1) * 100)
    );

    return Phaser.Display.Color.GetColor(mixed.r, mixed.g, mixed.b);
  }

  private render(
    mood: MoodSnapshot,
    distanceTravelled: number,
    surfaceProgress: number,
    finishRevealProgress: number,
    timeNow: number,
    collectFeedback: number,
    chainFeedback: number,
    awakeningFeedback: number
  ) {
    if (this.backdropKind === 'moonlight-mountain') {
      this.renderMoonlight(
        mood,
        distanceTravelled,
        surfaceProgress,
        finishRevealProgress,
        timeNow,
        collectFeedback,
        chainFeedback,
        awakeningFeedback
      );
      return;
    }

    const width = journeyConfig.logicalSize.width;
    const height = journeyConfig.logicalSize.height;
    const floorY = runnerConfig.visual.groundLineY;
    const interiorDarkness = Phaser.Math.Clamp(
      1 - surfaceProgress * 1.2 - finishRevealProgress * 0.85,
      0,
      1
    );
    const farOffset = -((distanceTravelled * 0.18) % 88);
    const midOffset = -((distanceTravelled * 0.34) % 92);
    const conduitOffset = -((distanceTravelled * 0.58) % 64);
    const pulseOffset = -((distanceTravelled * 0.88) % 54);
    const hubX = width * 0.52 + farOffset * 0.16;
    const hubY = height * 0.31;
    const hubAlpha = 0.14 - surfaceProgress * 0.04;

    this.graphics.clear();
    this.graphics.fillGradientStyle(
      mood.gradientTop,
      mood.gradientTop,
      mood.gradientBottom,
      mood.gradientBottom,
      1,
      1,
      1,
      1
    );
    this.graphics.fillRect(0, 0, width, height);

    if (interiorDarkness > 0.01) {
      this.graphics.fillStyle(0x04070b, 0.18 * interiorDarkness);
      this.graphics.fillRect(0, 0, width, height);
      this.graphics.fillStyle(0x091017, 0.1 * interiorDarkness);
      this.graphics.fillEllipse(width * 0.26, height * 0.28, 208, 168);
      this.graphics.fillEllipse(width * 0.74, height * 0.34, 244, 196);
    }

    this.graphics.fillStyle(mood.hazeColor, 0.08 + surfaceProgress * 0.03);
    this.graphics.fillEllipse(width * 0.22, height * 0.24, 170, 138);
    this.graphics.fillEllipse(width * 0.81, height * 0.2, 208, 156);
    this.graphics.fillEllipse(width * 0.54, height * 0.34, 244, 188);

    this.graphics.lineStyle(4, mood.floorLineColor, hubAlpha);
    for (let index = 0; index < 6; index += 1) {
      const angle = -1.52 + index * 0.58 + (index % 2 === 0 ? 0.08 : -0.06);
      const length = 58 + (index % 3) * 22;
      const jointX = hubX + Math.cos(angle) * length;
      const jointY = hubY + Math.sin(angle) * length;

      this.graphics.beginPath();
      this.graphics.moveTo(hubX, hubY);
      this.graphics.lineTo(jointX, jointY);
      this.graphics.lineTo(jointX + (index % 2 === 0 ? 10 : -8), jointY + 14);
      this.graphics.strokePath();
      this.graphics.fillStyle(mood.floorColor, 0.16);
      this.graphics.fillCircle(jointX, jointY, 8 + (index % 2) * 2);
    }

    this.graphics.lineStyle(2, mood.markerColor, 0.12 - surfaceProgress * 0.03);
    this.graphics.strokeEllipse(hubX, hubY, 58, 58);
    this.graphics.fillStyle(mood.markerColor, 0.12);
    this.graphics.fillCircle(hubX, hubY, 11);

    this.graphics.fillStyle(0xf2ffd6, 0.04 + surfaceProgress * 0.18 + finishRevealProgress * 0.24);
    this.graphics.fillEllipse(
      width * 0.98,
      height * 0.28,
      170 + finishRevealProgress * 86,
      304 + surfaceProgress * 144
    );
    this.graphics.fillStyle(mood.auraColor, 0.03 + surfaceProgress * 0.1 + finishRevealProgress * 0.04);
    this.graphics.fillRect(width * 0.88, 0, width * 0.18, floorY - 36);
    this.graphics.fillStyle(0xfff7dc, 0.018 + finishRevealProgress * 0.06);
    this.graphics.fillEllipse(width * 0.92, height * 0.2, 94 + finishRevealProgress * 42, 180);

    this.graphics.lineStyle(18, mood.floorColor, 0.12);
    this.graphics.strokeEllipse(width * 0.28 + farOffset * 0.25, height * 0.38, 230, 292);
    this.graphics.strokeEllipse(width * 0.82 + farOffset * 0.1, height * 0.42, 196, 262);
    this.graphics.lineStyle(6, mood.markerColor, 0.08);
    this.graphics.strokeEllipse(width * 0.53 + farOffset * 0.12, height * 0.26, 138, 176);

    this.graphics.fillStyle(mood.floorLineColor, 0.16);
    for (let index = 0; index < 7; index += 1) {
      const x = farOffset + index * 72;
      const bodyWidth = this.conduitWidths[index % this.conduitWidths.length]!;
      const bodyHeight = this.conduitHeights[index % this.conduitHeights.length]!;
      const neckShift = this.conduitOffsets[index % this.conduitOffsets.length]!;
      const bodyTop = floorY - 166 - bodyHeight;

      this.graphics.fillRoundedRect(x, bodyTop, bodyWidth, bodyHeight, 12);
      this.graphics.fillCircle(x + bodyWidth * 0.5, bodyTop + 20, 12);
      this.graphics.fillCircle(x + bodyWidth * 0.5 + neckShift * 0.25, bodyTop + bodyHeight - 18, 10);
      this.graphics.fillRect(x + bodyWidth * 0.32, bodyTop - 18, 6, 22);
    }

    this.graphics.fillStyle(mood.floorColor, 0.22);
    for (let index = 0; index < 6; index += 1) {
      const x = midOffset + index * 66;
      const y = floorY - 164 + (index % 3) * 12;

      this.graphics.fillRoundedRect(x, y, 14, 88, 14);
      this.graphics.fillRoundedRect(x + 18, y + 18, 32, 12, 10);
      this.graphics.fillCircle(x + 26, y + 24, 14);
      this.graphics.fillRoundedRect(x + 38, y + 42, 12, 42, 10);
      this.graphics.fillEllipse(x + 24, y + 72, 34, 16);
    }

    this.graphics.lineStyle(4, mood.shadowColor, 0.34);
    for (let index = 0; index < 5; index += 1) {
      const startX = conduitOffset + index * 86;
      const offset = index % 2 === 0 ? 12 : -12;

      if (startX > 92) {
        this.graphics.beginPath();
        this.graphics.moveTo(startX, -10);
        this.graphics.lineTo(startX + 16, 72);
        this.graphics.lineTo(startX - offset, 144);
        this.graphics.lineTo(startX + 10, 220);
        this.graphics.strokePath();
      }

      this.graphics.beginPath();
      this.graphics.moveTo(startX + 28, floorY - 14);
      this.graphics.lineTo(startX + 8, floorY - 82);
      this.graphics.lineTo(startX + 18 + offset, floorY - 148);
      this.graphics.strokePath();
    }

    this.graphics.lineStyle(2, mood.auraColor, 0.22);
    for (let x = pulseOffset - 20; x < width + 40; x += 42) {
      this.graphics.beginPath();
      this.graphics.moveTo(x, floorY - 36);
      this.graphics.lineTo(x + 14, floorY - 64);
      this.graphics.lineTo(x + 28, floorY - 44);
      this.graphics.strokePath();
    }

    this.graphics.fillStyle(mood.floorColor, 0.9);
    this.graphics.fillRect(-20, floorY, width + 40, height - floorY + 20);

    this.graphics.lineStyle(4, mood.floorLineColor, 0.72);
    this.graphics.beginPath();
    this.graphics.moveTo(0, floorY + 10);
    this.graphics.lineTo(width * 0.12, floorY + 4);
    this.graphics.lineTo(width * 0.28, floorY + 12);
    this.graphics.lineTo(width * 0.46, floorY + 6);
    this.graphics.lineTo(width * 0.64, floorY + 16);
    this.graphics.lineTo(width * 0.82, floorY + 8);
    this.graphics.lineTo(width, floorY + 12);

    this.graphics.strokePath();

    this.graphics.fillStyle(mood.hazeColor, 0.14);
    for (let x = pulseOffset - 24; x < width + 60; x += 58) {
      this.graphics.fillEllipse(x, floorY + 12, 52, 14);
    }

    this.graphics.lineStyle(2, mood.markerColor, 0.16);
    for (let x = conduitOffset - 30; x < width + 58; x += 48) {
      this.graphics.beginPath();
      this.graphics.moveTo(x, floorY - 50);
      this.graphics.lineTo(x + 8, floorY - 26);
      this.graphics.lineTo(x + 4, floorY - 6);
      this.graphics.strokePath();
    }

    this.graphics.fillStyle(mood.markerColor, 0.12);
    for (let x = pulseOffset - 24; x < width + 54; x += 46) {
      this.graphics.fillRect(x, floorY + 28, 20, 4);
    }
  }

  private renderMoonlight(
    mood: MoodSnapshot,
    distanceTravelled: number,
    surfaceProgress: number,
    finishRevealProgress: number,
    timeNow: number,
    collectFeedback: number,
    chainFeedback: number,
    awakeningFeedback: number
  ) {
    const width = journeyConfig.logicalSize.width;
    const height = journeyConfig.logicalSize.height;
    const floorY = runnerConfig.visual.groundLineY;
    const time = timeNow;
    const climb = Phaser.Math.Clamp(surfaceProgress * 0.84 + finishRevealProgress * 0.18, 0, 1);
    const beatGlow = Phaser.Math.Clamp(
      collectFeedback * 0.48 + chainFeedback * 0.68 + awakeningFeedback * 0.24,
      0,
      1
    );
    const farOffset = -((distanceTravelled * 0.12) % 136);
    const midOffset = -((distanceTravelled * 0.22) % 118);
    const nearOffset = -((distanceTravelled * 0.36) % 94);

    // --- Sky ---
    const skyTop = this.mixStageColor(0x08111d, 0x12253c, climb * 0.72 + beatGlow * 0.06);
    const skyBottom = this.mixStageColor(0x162134, 0x234666, climb * 0.7 + beatGlow * 0.08);
    this.graphics.clear();
    this.graphics.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1, 1, 1, 1);
    this.graphics.fillRect(0, 0, width, height);

    // --- Atmospheric haze ---
    const haze = this.mixStageColor(0x7ca0ba, 0xbdefff, climb * 0.46 + beatGlow * 0.28);
    this.graphics.fillStyle(haze, 0.12 + climb * 0.06);
    this.graphics.fillEllipse(width * 0.22, height * 0.2, 178, 132);
    this.graphics.fillEllipse(width * 0.82, height * 0.22, 198, 152);
    this.graphics.fillEllipse(width * 0.5, height * 0.32, 246, 178);

    // --- Moon (load-bearing: massive, centered behind peak) ---
    const moonX = width * 0.54;
    const moonY = 182;
    const moonSize = 280;
    const moonGlow = this.mixStageColor(0xfff3d4, 0xf8fff0, climb * 0.18 + beatGlow * 0.24);

    // Outer atmospheric halo
    this.graphics.fillStyle(moonGlow, 0.06 + beatGlow * 0.03);
    this.graphics.fillEllipse(moonX, moonY, moonSize + 108, moonSize + 108);
    // Inner halo
    this.graphics.fillStyle(0xffffff, 0.08 + beatGlow * 0.04);
    this.graphics.fillEllipse(moonX, moonY, moonSize + 52, moonSize + 52);
    // Moon body
    this.graphics.fillStyle(moonGlow, 0.94);
    this.graphics.fillEllipse(moonX, moonY, moonSize, moonSize);
    // Craters
    this.graphics.fillStyle(0xd6c7a2, 0.14);
    this.graphics.fillEllipse(moonX - 34, moonY - 38, 38, 30);
    this.graphics.fillEllipse(moonX + 28, moonY + 22, 30, 24);
    this.graphics.fillEllipse(moonX - 8, moonY + 48, 20, 14);
    this.graphics.fillEllipse(moonX + 48, moonY - 16, 16, 12);

    // --- Background crystal hints (behind mountain) ---
    const crystalFill = this.mixStageColor(0xa8e1d8, 0xe7fbff, climb * 0.54 + beatGlow * 0.34);
    const crystalFillSoft = this.mixStageColor(0x8dcfbf, 0xcff8ef, climb * 0.48 + beatGlow * 0.3);
    const crystalEdge = this.mixStageColor(0x4e7e74, 0x93efdf, climb * 0.3 + beatGlow * 0.34);

    this.graphics.fillStyle(crystalFillSoft, 0.18 + climb * 0.06);
    for (let i = 0; i < 5; i += 1) {
      const bx = 42 + i * 72 + farOffset * 0.06;
      const bh = 62 + (i % 3) * 18;
      this.graphics.fillTriangle(bx, floorY + 6, bx + 14, floorY - bh, bx + 30, floorY + 6);
    }

    // --- Mountain silhouette (load-bearing: one central peak + flanking ridges) ---
    const mountainShadow = this.mixStageColor(0x111925, 0x223240, climb * 0.6);
    const mountainBase = this.mixStageColor(0x1a2430, 0x2e4455, climb * 0.76);
    const mountainEdge = this.mixStageColor(0x334b5f, 0x6b9ab0, climb * 0.34 + beatGlow * 0.18);

    // Shadow layer (slightly wider, behind)
    this.graphics.fillStyle(mountainShadow, 0.96);
    this.graphics.fillTriangle(
      56 + farOffset * 0.06, floorY + 16,
      width * 0.52, 82,
      width - 32 + farOffset * 0.06, floorY + 16
    );

    // Main central peak
    this.graphics.fillStyle(mountainBase, 0.98);
    this.graphics.fillTriangle(
      86 + farOffset * 0.08, floorY + 14,
      width * 0.54, 98,
      width - 56 + farOffset * 0.08, floorY + 14
    );

    // Left flank ridge
    this.graphics.fillStyle(mountainShadow, 0.92);
    this.graphics.fillTriangle(
      14 + farOffset * 0.04, floorY + 12,
      92, 194,
      178 + farOffset * 0.04, floorY + 12
    );

    // Right flank ridge
    this.graphics.fillTriangle(
      width - 148 + farOffset * 0.05, floorY + 12,
      width - 72, 208,
      width + 14 + farOffset * 0.05, floorY + 12
    );

    // Mountain edge highlights (ridgeline light)
    this.graphics.lineStyle(3, mountainEdge, 0.26 + climb * 0.08);
    this.graphics.beginPath();
    this.graphics.moveTo(118 + farOffset * 0.08, floorY + 6);
    this.graphics.lineTo(width * 0.54, 98);
    this.graphics.lineTo(width - 88 + farOffset * 0.08, floorY + 8);
    this.graphics.strokePath();

    // --- Mid-layer distant crystal cliffs ---
    this.graphics.fillStyle(this.mixStageColor(0x273648, 0x36546b, climb * 0.5), 0.52);
    for (let i = 0; i < 7; i += 1) {
      const x = midOffset + i * 62;
      const h = 84 + (i % 3) * 22;
      this.graphics.fillTriangle(x, floorY + 12, x + 24, floorY - h, x + 52, floorY + 12);
    }

    // --- Foreground crystal field (load-bearing: dense, 2-tier, staggered glint) ---
    const mirrorLine = this.mixStageColor(0xe9ffff, 0xffffff, beatGlow * 0.58 + finishRevealProgress * 0.2);

    // Tier A: Large crystals
    for (let i = 0; i < 7; i += 1) {
      const x = nearOffset + i * 54;
      const h = 128 + (i % 3) * 32;
      const w = 38 + (i % 3) * 6;
      const fill = i % 2 === 0 ? crystalFill : crystalFillSoft;
      const glintPhase = Math.sin(time * 0.003 + i * 1.4) * 0.5 + 0.5;
      const crystalAlpha = 0.74 + climb * 0.16 + beatGlow * glintPhase * 0.12;

      this.graphics.fillStyle(fill, crystalAlpha);
      this.graphics.fillTriangle(x, floorY + 14, x + w * 0.5, floorY - h, x + w, floorY + 14);

      // Internal edge line
      this.graphics.lineStyle(2, crystalEdge, 0.38 + beatGlow * glintPhase * 0.22);
      this.graphics.beginPath();
      this.graphics.moveTo(x + w * 0.5, floorY - h);
      this.graphics.lineTo(x + w * 0.22, floorY + 6);
      this.graphics.strokePath();

      // Mirror highlight (staggered glint)
      this.graphics.lineStyle(2, mirrorLine, 0.1 + beatGlow * glintPhase * 0.28);
      this.graphics.beginPath();
      this.graphics.moveTo(x + w * 0.56, floorY - h + 16);
      this.graphics.lineTo(x + w * 0.78, floorY - h * 0.4);
      this.graphics.strokePath();
    }

    // Tier B: Smaller fill crystals (between the large ones)
    for (let i = 0; i < 8; i += 1) {
      const x = nearOffset + i * 54 + 22;
      const h = 72 + (i % 4) * 18;
      const w = 24 + (i % 2) * 6;
      const glintPhase = Math.sin(time * 0.003 + i * 1.8 + 0.7) * 0.5 + 0.5;
      const fillAlpha = 0.52 + climb * 0.12 + beatGlow * glintPhase * 0.08;

      this.graphics.fillStyle(crystalFillSoft, fillAlpha);
      this.graphics.fillTriangle(x, floorY + 14, x + w * 0.5, floorY - h, x + w, floorY + 14);

      this.graphics.lineStyle(1, crystalEdge, 0.24 + beatGlow * glintPhase * 0.16);
      this.graphics.beginPath();
      this.graphics.moveTo(x + w * 0.48, floorY - h);
      this.graphics.lineTo(x + w * 0.26, floorY - h * 0.3);
      this.graphics.strokePath();
    }

    // --- Ground plane ---
    this.graphics.fillStyle(this.mixStageColor(0x172536, 0x1e3144, climb * 0.42), 0.94);
    this.graphics.fillRect(-20, floorY, width + 40, height - floorY + 24);

    // Ground edge line
    this.graphics.lineStyle(4, crystalEdge, 0.34 + beatGlow * 0.18);
    this.graphics.beginPath();
    this.graphics.moveTo(0, floorY + 8);
    this.graphics.lineTo(width * 0.1, floorY + 2);
    this.graphics.lineTo(width * 0.22, floorY + 10);
    this.graphics.lineTo(width * 0.38, floorY + 4);
    this.graphics.lineTo(width * 0.54, floorY + 14);
    this.graphics.lineTo(width * 0.72, floorY + 6);
    this.graphics.lineTo(width * 0.88, floorY + 12);
    this.graphics.lineTo(width, floorY + 4);
    this.graphics.strokePath();

    // Ground haze particles
    this.graphics.fillStyle(haze, 0.07 + beatGlow * 0.05);
    for (let i = 0; i < 6; i += 1) {
      this.graphics.fillEllipse(32 + i * 58, floorY - 12 - (i % 2) * 10, 42, 12);
    }

    // Small crystal tips above haze
    this.graphics.lineStyle(2, mirrorLine, 0.1 + beatGlow * 0.18);
    for (let i = 0; i < 7; i += 1) {
      const x = nearOffset + i * 56 + 10;
      const peakY = floorY - 88 - (i % 3) * 26;
      this.graphics.beginPath();
      this.graphics.moveTo(x, peakY + 12);
      this.graphics.lineTo(x + 8, peakY - 10);
      this.graphics.lineTo(x + 18, peakY + 4);
      this.graphics.strokePath();
    }

    // Moonlight bloom near horizon
    this.graphics.fillStyle(0xf5fff4, 0.07 + beatGlow * 0.1 + finishRevealProgress * 0.05);
    this.graphics.fillEllipse(width * 0.54, floorY - 178, 178 + beatGlow * 26, 68 + beatGlow * 12);
    this.graphics.fillStyle(mood.auraColor, 0.04 + beatGlow * 0.06);
    this.graphics.fillEllipse(width * 0.72, floorY - 124, 134, 54);
  }
}
