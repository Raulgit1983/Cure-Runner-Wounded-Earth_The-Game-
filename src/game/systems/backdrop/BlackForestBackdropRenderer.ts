import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import { prefersReducedMotion } from '@/ui/reducedMotion';

import type { BackdropFrameTargets, StageBackdrop } from './StageBackdrop';

/**
 * Image-based backdrop for The Black Forest.
 *
 * It is a separate renderer, delegated to by the scene, because `BackdropRenderer`
 * is a Graphics-only painter: putting sprites, parallax, an eye that tracks the
 * player and a yawning mouth inside it would turn it into two classes wearing
 * one name.
 *
 * Mateo's drawing is a pure alpha matte (every pixel is black with varying
 * alpha — the graphite IS the alpha channel). It is therefore drawn with
 * `setTintFill`, which replaces the colour and leaves the alpha untouched: every
 * stroke and every bit of pencil shading survives exactly as scanned, just
 * reading as light on the dark stage instead of dark on white paper. Nothing is
 * redrawn, recoloured per-stroke, stretched or cropped — aspect ratio is
 * preserved everywhere.
 *
 * [PENDIENTE DE RAÚL] Mateo's two annotated behaviours — the eye that "Follows
 * The Player" and the mouth that "Yawns Randomly" — are NOT wired up yet, and
 * this is deliberate rather than forgotten. Both were built and then removed
 * after looking at them on a phone viewport, because:
 *
 *   1. `world-02-eye.webp` and the three mouth frames carry their own scanner
 *      paper wash across the whole canvas (~77% of the eye's pixels are
 *      partial-alpha paper, not ink). Drawn over `bg-main`, that wash doubles
 *      up and the cut-out reads as a hard rectangular block — exactly the
 *      artifact this project bans.
 *   2. They are not registered to the flattened sheet: they were extracted at a
 *      higher resolution, so their ink boxes do not line up with the baked eye
 *      and mouth, and the offset is not derivable from the files.
 *
 * Fixing it is an asset step, not a code step: re-export the four cut-outs with
 * the paper thresholded out, and record their offset/scale against `bg-main`
 * once. That means processing Mateo's files, so it needs his call first. The
 * baked eye and mouth stay visible in the sheet meanwhile — the forest still
 * watches, it just does not blink yet.
 */

/** Source canvas of `black-forest-bg-main.webp`. */
const SRC_WIDTH = 1080;
const SRC_HEIGHT = 680;

/** On-screen width of the mid-plane; height follows the source aspect ratio. */
const BG_WIDTH = 460;
const BG_SCALE = BG_WIDTH / SRC_WIDTH;
const BG_CENTER_X = 150;
const BG_CENTER_Y = 235;
const BG_DEPTH = 0.2;
/** Slow mid-plane drift. The front pine band carries the visible parallax. */
const BG_PARALLAX_PER_PX = 0.0055;
const BG_PARALLAX_LIMIT = 30;

/** Foreground pine band, along the very bottom. */
const FRONT_SRC_WIDTH = 1080;
const FRONT_SRC_HEIGHT = 149;
const FRONT_HEIGHT = 68;
const FRONT_SCALE = FRONT_HEIGHT / FRONT_SRC_HEIGHT;
const FRONT_WIDTH = FRONT_SRC_WIDTH * FRONT_SCALE;
const FRONT_CENTER_Y = 606;
const FRONT_PARALLAX_PER_PX = 0.055;
/**
 * Above the player (depth 5) on purpose — it is a foreground plane. It can
 * never cover the hero, a hazard or a collectible because it lives entirely
 * below the ground line: its top edge sits at FRONT_CENTER_Y - FRONT_HEIGHT/2,
 * which `BlackForestBackdropRenderer.FRONT_TOP_Y` asserts stays under the floor.
 */
const FRONT_DEPTH = 5.42;

/**
 * Only the two planes this renderer actually draws. The eye and mouth cut-outs
 * are copied into the repo and ready, but are not listed here so a phone does
 * not download 116 kB it cannot show — see the [PENDIENTE DE RAÚL] note above.
 */
export const BLACK_FOREST_TEXTURES = {
  bgMain: 'black-forest-bg-main',
  layerFront: 'black-forest-bg-layer-front'
} as const;

/** Top edge of the foreground band, exported so a test can assert it clears the floor. */
export const FRONT_TOP_Y = FRONT_CENTER_Y - FRONT_HEIGHT / 2;

const INK_TINT = 0xd7e8c9;
const FRONT_INK_TINT = 0xa9c4a8;

export class BlackForestBackdropRenderer implements StageBackdrop {
  private readonly sky: Phaser.GameObjects.Graphics;
  private readonly midPlane: Phaser.GameObjects.Container;
  private readonly frontTiles: Phaser.GameObjects.Image[] = [];

  private distance = 0;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    initialEnvironmentLevel: number
  ) {
    const width = journeyConfig.logicalSize.width;
    const height = journeyConfig.logicalSize.height;

    // A quiet ground tone so the pale ink has something to sit on.
    this.sky = scene.add.graphics().setDepth(0);
    this.sky.fillGradientStyle(0x0b1016, 0x0b1016, 0x121a17, 0x141d18, 1, 1, 1, 1);
    this.sky.fillRect(0, 0, width, height);

    const sheet = scene.add
      .image(0, 0, BLACK_FOREST_TEXTURES.bgMain)
      .setOrigin(0.5)
      .setScale(BG_SCALE)
      .setTintFill(INK_TINT)
      .setAlpha(0.86);

    this.midPlane = scene.add
      .container(BG_CENTER_X, BG_CENTER_Y, [sheet])
      .setDepth(BG_DEPTH)
      .setAlpha(0.72 + initialEnvironmentLevel * 0.2);

    if (scene.textures.exists(BLACK_FOREST_TEXTURES.layerFront)) {
      // Two copies so the band wraps without a gap.
      for (let index = 0; index < 2; index += 1) {
        this.frontTiles.push(
          scene.add
            .image(index * FRONT_WIDTH, FRONT_CENTER_Y, BLACK_FOREST_TEXTURES.layerFront)
            .setOrigin(0, 0.5)
            .setScale(FRONT_SCALE)
            .setTintFill(FRONT_INK_TINT)
            .setAlpha(0.9)
            .setDepth(FRONT_DEPTH)
        );
      }
    }
  }

  renderInitial() {
    this.applyLayout();
  }

  update(deltaSeconds: number, _timeNow: number, targets: BackdropFrameTargets) {
    if (this.destroyed) {
      return;
    }

    const follow = 1 - Math.exp(-deltaSeconds * journeyConfig.backdrop.followSharpness);

    this.distance = Phaser.Math.Linear(this.distance, targets.distanceTravelled, follow);
    this.midPlane.setAlpha(
      0.72 + targets.environmentLevel * 0.2 + targets.awakeningFeedback * 0.05
    );
    this.applyLayout();
  }

  destroy() {
    this.destroyed = true;
    this.scene.tweens.killTweensOf(this.midPlane);
    this.frontTiles.forEach((tile) => tile.destroy());
    this.frontTiles.length = 0;
    this.midPlane.destroy(true);
    this.sky.destroy();
  }

  private applyLayout() {
    const reduced = prefersReducedMotion();
    const drift = reduced
      ? 0
      : Phaser.Math.Clamp(
          -this.distance * BG_PARALLAX_PER_PX,
          -BG_PARALLAX_LIMIT,
          BG_PARALLAX_LIMIT
        );

    this.midPlane.setPosition(BG_CENTER_X + drift, BG_CENTER_Y);


    if (this.frontTiles.length > 0) {
      const scroll = reduced ? 0 : (this.distance * FRONT_PARALLAX_PER_PX) % FRONT_WIDTH;

      this.frontTiles.forEach((tile, index) => {
        tile.setX(index * FRONT_WIDTH - scroll);
      });
    }
  }

}
