import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import { runnerConfig } from '@/game/content/runnerConfig';
import type { JourneyBackdropKind } from '@/game/content/journeyStages';
import { prefersReducedMotion } from '@/ui/reducedMotion';

import { depthRampBands, horizonY, type GradeShape } from './backdropGrade';
import {
  arcPulse,
  beatSignal,
  clamp01,
  fitPlate,
  panCenterX,
  veilAlpha,
  type BackdropFit,
  type BackdropSize,
  type PlateLayout
} from './imageBackdropLayout';
import type { BackdropFrameTargets, StageBackdrop } from './StageBackdrop';

/**
 * Image-backed backdrop for the two stages whose art is a scanned drawing:
 * Wounded Planet and Moonlight Mountain.
 *
 * It replaces the hundreds of `fillEllipse`/`fillTriangle` calls those two
 * stages used to be painted with. `BackdropRenderer` is deliberately still in
 * the tree as the fallback for a stage whose plate has not loaded — a missing
 * texture must degrade to the old painted stage, not to a black screen.
 *
 * Everything that varies between the two stages is data in `ImageBackdropPlan`,
 * so a third image-backed world is a plan entry rather than another branch.
 * Nothing here reads the stage key.
 *
 * Layering, from the back:
 *
 *   -0.1  page tone, so a sub-pixel letterbox is never a white sliver
 *    0    the plate itself, uniform scale, never stretched
 *    0.05 the arcs cut-out (Moonlight only), in the plate's own rect
 *    0.1  the readability grade — flat tone in a vertical ramp, so paper
 *         grain survives and the play band is the quietest part of the frame
 *    0.14 the quiet floor band, drawn once
 *
 * The hero shadow sits at depth 1, the hero at 5, and every runner entity above
 * both, so all of this stays behind the play.
 */

export interface ImageBackdropPlan {
  plate: {
    textureKey: string;
    source: BackdropSize;
    fit: BackdropFit;
  };
  /**
   * An optional transparent cut-out drawn in the plate's OWN on-screen rect, so
   * it pans with the plate and cannot drift off the composition it was lifted
   * from. Only Moonlight has one: the two open moon arcs.
   */
  overlay?: {
    textureKey: string;
    source: BackdropSize;
  };
  /** Page tone behind the plate. */
  pageColor: number;
  /**
   * Strength of the readability grade. The two alphas are the grade at its
   * STRONGEST stop — across the play band — before and after the world wakes up;
   * `BACKDROP_GRADE_SHAPE` thins it toward the top of the screen.
   */
  veil: {
    color: number;
    restAlpha: number;
    litAlpha: number;
  };
  floor: {
    fillColor: number;
    fillAlpha: number;
    lineColor: number;
    lineAlpha: number;
  };
}

/**
 * How the grade thins from the play band up to the top of the screen, shared by
 * every image-backed stage so the two worlds cannot drift into two different
 * readings of depth.
 *
 * The top stop is deliberately far below 1: Mateo's sky, his coloured pencil
 * field and the drawing's own subject live up there and nothing is played
 * against them, so that part of the plate is left close to how it was scanned.
 * The play band gets the full strength, because that is the only strip where a
 * pale collectible and a dark hazard have to separate from the art behind them.
 */
export const BACKDROP_GRADE_SHAPE: GradeShape = {
  topAlpha: 0.34,
  horizonAlpha: 0.68,
  playAlpha: 1
};

/**
 * How far above the ground line the grade reaches full strength, in px. Set
 * clear of a jump's apex, so the hero climbs INTO the quiet band rather than out
 * of it and never crosses a visible tonal step mid-jump.
 */
export const GRADE_HORIZON_LIFT = 150;

/**
 * Measured source canvases of the three supplied WebP files. They are declared
 * rather than read from `texture.getSourceImage()` so the maths is testable
 * without Phaser, and so a re-export at a different size fails a unit test
 * instead of quietly changing the fit on a phone.
 */
export const IMAGE_BACKDROP_PLANS: Partial<Record<JourneyBackdropKind, ImageBackdropPlan>> = {
  'wounded-planet': {
    plate: {
      textureKey: 'wounded-planet-bg-main',
      // 941x1672 — within a fifth of a pixel of the 360x640 canvas, which is
      // why it is contained whole rather than cropped to fill.
      source: { width: 941, height: 1672 },
      fit: 'contain'
    },
    pageColor: 0x120f0d,
    veil: {
      // Warm-neutral ink over warm paper: it lowers the plate without tinting
      // Mateo's colour pencils toward blue.
      color: 0x110c0a,
      // The warmest, lightest plate of the three, and the one whose graphite
      // radiating limbs cross the lane the player reads, so it needs the
      // strongest play-band stop to keep the mint collectibles separated.
      restAlpha: 0.5,
      litAlpha: 0.24
    },
    floor: {
      fillColor: 0x1a1410,
      fillAlpha: 0.72,
      lineColor: 0x6f6252,
      lineAlpha: 0.38
    }
  },
  'moonlight-mountain': {
    plate: {
      textureKey: 'moonlight-mountain-bg-main',
      // 1575x999 landscape. Scaled to the viewport HEIGHT, so the full source
      // canvas is preserved and the extra width becomes the pan budget.
      source: { width: 1575, height: 999 },
      fit: 'cover-height'
    },
    overlay: {
      textureKey: 'moonlight-mountain-moon-arcs',
      source: { width: 1080, height: 680 }
    },
    pageColor: 0x0a1018,
    veil: {
      // Already a night plate, so it reaches readable contrast with less.
      color: 0x08101c,
      restAlpha: 0.46,
      litAlpha: 0.22
    },
    floor: {
      fillColor: 0x101a29,
      fillAlpha: 0.68,
      lineColor: 0x7fa6bd,
      lineAlpha: 0.4
    }
  }
};

export class ImageBackdropRenderer implements StageBackdrop {
  private readonly page: Phaser.GameObjects.Graphics;
  private readonly plate: Phaser.GameObjects.Image;
  private readonly arcs?: Phaser.GameObjects.Image;
  /** Second, barely larger pass over the arcs — the "gone over twice" weight. */
  private readonly arcsWeight?: Phaser.GameObjects.Image;
  private readonly veil: Phaser.GameObjects.Graphics;
  private readonly floor: Phaser.GameObjects.Graphics;
  private readonly layout: PlateLayout;
  private readonly view: BackdropSize;

  private destroyed = false;
  private panProgress = 0;
  private environmentLevel: number;
  private signal = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly plan: ImageBackdropPlan,
    initialEnvironmentLevel: number
  ) {
    this.view = {
      width: journeyConfig.logicalSize.width,
      height: journeyConfig.logicalSize.height
    };
    this.environmentLevel = clamp01(initialEnvironmentLevel);
    this.layout = fitPlate(plan.plate.source, this.view, plan.plate.fit);
    this.panProgress = prefersReducedMotion() ? 0.5 : 0;

    this.page = scene.add.graphics().setDepth(-0.1);
    this.page.fillStyle(plan.pageColor, 1);
    this.page.fillRect(0, 0, this.view.width, this.view.height);

    // One scale for both axes, straight from the pure layout — this is the line
    // that guarantees the drawing is never stretched.
    this.plate = scene.add
      .image(this.view.width / 2, this.layout.centerY, plan.plate.textureKey)
      .setOrigin(0.5)
      .setScale(this.layout.scale)
      .setDepth(0);

    if (plan.overlay && scene.textures.exists(plan.overlay.textureKey)) {
      // The cut-out is mapped onto the plate's exact on-screen rect, so it pans
      // with it and stays registered on the arcs already drawn into the plate.
      const overlayScaleX = this.layout.width / plan.overlay.source.width;
      const overlayScaleY = this.layout.height / plan.overlay.source.height;

      this.arcsWeight = scene.add
        .image(this.view.width / 2, this.layout.centerY, plan.overlay.textureKey)
        .setOrigin(0.5)
        .setScale(overlayScaleX, overlayScaleY)
        .setAlpha(0)
        .setDepth(0.04);
      this.arcs = scene.add
        .image(this.view.width / 2, this.layout.centerY, plan.overlay.textureKey)
        .setOrigin(0.5)
        .setScale(overlayScaleX, overlayScaleY)
        .setAlpha(0)
        .setDepth(0.05);
    }

    // Painted once as a shape, then driven by a single `setAlpha`: the ramp's
    // three stops keep their relationship to each other however far the world
    // has woken up, and no per-frame redraw is needed to animate it.
    this.veil = scene.add.graphics().setDepth(0.1);
    this.paintGrade();
    this.veil.setAlpha(veilAlpha(this.environmentLevel, plan.veil));

    // Drawn once: the floor is static geometry, so it costs nothing per frame.
    // It does not move `runnerConfig.visual.groundLineY`; it reads it.
    this.floor = scene.add.graphics().setDepth(0.14);
    this.paintFloor();
  }

  renderInitial() {
    this.applyLayout();
  }

  update(deltaSeconds: number, _timeNow: number, targets: BackdropFrameTargets) {
    if (this.destroyed) {
      return;
    }

    const follow = 1 - Math.exp(-deltaSeconds * journeyConfig.backdrop.followSharpness);
    // Reduced motion pins the plate at the middle of its travel: the pan is the
    // only continuous movement here, so switching it off is the whole
    // accommodation. The composition is then read as a fixed frame instead of
    // being revealed across the run.
    const targetProgress = prefersReducedMotion() ? 0.5 : clamp01(targets.levelProgress);

    this.panProgress = Phaser.Math.Linear(this.panProgress, targetProgress, follow);
    this.environmentLevel = Phaser.Math.Linear(
      this.environmentLevel,
      clamp01(targets.environmentLevel),
      follow
    );
    // Smoothed toward the scene's already-decaying feedback, so a beat is a
    // swell and a release rather than a step. Nothing here is driven by a clock.
    this.signal = Phaser.Math.Linear(this.signal, beatSignal(targets), follow);
    this.applyLayout();
  }

  destroy() {
    this.destroyed = true;
    this.scene.tweens.killTweensOf(this.plate);
    this.plate.destroy();
    this.arcs?.destroy();
    this.arcsWeight?.destroy();
    this.veil.destroy();
    this.floor.destroy();
    this.page.destroy();
  }

  private applyLayout() {
    const centerX = panCenterX(this.layout, this.view, this.panProgress);

    this.plate.setX(centerX);
    this.veil.setAlpha(veilAlpha(this.environmentLevel, this.plan.veil));

    if (this.arcs && this.arcsWeight) {
      const pulse = arcPulse(this.signal);
      const scaleX = this.arcs.scaleX;
      const scaleY = this.arcs.scaleY;

      this.arcs.setX(centerX).setAlpha(pulse.lineAlpha);
      this.arcsWeight
        .setX(centerX)
        .setAlpha(pulse.weightAlpha)
        .setScale(scaleX * pulse.weightScale, scaleY * pulse.weightScale);
    }
  }

  /**
   * The readability grade: the stage's own page tone, ramped from light at the
   * top of the screen to full strength across the play band.
   *
   * A flat rect was treating Mateo's sky and the lane the player reads as one
   * problem. They are opposite problems — the upper art wants to be left alone,
   * the lane wants to be quiet — so this is a ramp, and the net effect is that
   * the drawing is LESS covered than before everywhere above the horizon.
   */
  private paintGrade() {
    this.veil.clear();
    this.veil.fillStyle(this.plan.veil.color, 1);

    depthRampBands(
      this.view.height,
      horizonY(this.view.height, runnerConfig.visual.groundLineY, GRADE_HORIZON_LIFT),
      BACKDROP_GRADE_SHAPE
    ).forEach((band) => {
      this.veil.fillGradientStyle(
        this.plan.veil.color,
        this.plan.veil.color,
        this.plan.veil.color,
        this.plan.veil.color,
        band.topAlpha,
        band.topAlpha,
        band.bottomAlpha,
        band.bottomAlpha
      );
      // Bled sideways so a fractional device-pixel edge never leaves a lit
      // hairline down the side of the screen.
      this.veil.fillRect(-2, band.top, this.view.width + 4, band.bottom - band.top);
    });
  }

  /**
   * A quiet paper/ink shelf under the play, with one hand-drawn wobble so it
   * reads as a drawn edge rather than a UI bar. Geometry only — the ground line
   * itself is the runner's, and is only read here.
   */
  private paintFloor() {
    const width = this.view.width;
    const height = this.view.height;
    const floorY = runnerConfig.visual.groundLineY;
    const { fillColor, fillAlpha, lineColor, lineAlpha } = this.plan.floor;

    this.floor.clear();
    // Fade into the shelf instead of drawing a flat opaque rectangle. This
    // keeps Mateo's lower pencil work visible and avoids reading as a UI bar,
    // while the denser bottom still gives hazards and feet a quiet stage.
    this.floor.fillGradientStyle(
      fillColor,
      fillColor,
      fillColor,
      fillColor,
      fillAlpha * 0.55,
      fillAlpha * 0.55,
      fillAlpha,
      fillAlpha
    );
    this.floor.fillRect(-20, floorY, width + 40, height - floorY + 20);
    this.floor.lineStyle(3, lineColor, lineAlpha);
    this.floor.beginPath();
    this.floor.moveTo(0, floorY + 9);
    this.floor.lineTo(width * 0.14, floorY + 3);
    this.floor.lineTo(width * 0.31, floorY + 11);
    this.floor.lineTo(width * 0.48, floorY + 5);
    this.floor.lineTo(width * 0.66, floorY + 13);
    this.floor.lineTo(width * 0.84, floorY + 6);
    this.floor.lineTo(width, floorY + 10);
    this.floor.strokePath();
  }
}
