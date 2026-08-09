import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import { prefersReducedMotion } from '@/ui/reducedMotion';

import { YawnClock, type YawnPhase } from './blackForestYawn';
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
 * stroke and every bit of pencil shading survives, just reading as light on the
 * dark stage instead of dark on white paper. Nothing is redrawn, recoloured
 * per-stroke, stretched or cropped — aspect ratio is preserved everywhere.
 *
 * "Survives" means at the level of the drawing, not of the raw scan: the
 * approved art pass applied one global `alpha = level(6%,92%)` to the sheet,
 * which floors the scanner's paper wash to zero and remaps the remaining
 * graphite across the alpha range — midtones and soft edges stay partial, they
 * are not driven to solid. That is the washed-floor treatment, and it is why
 * the four masked annotation blocks no longer read as darker rectangles.
 *
 * Mateo's two annotated behaviours — the eye that "Follows The Player" and the
 * mouth that "Yawns Randomly" — are wired up here.
 *
 * They were built once before and removed, because the first cut-outs carried
 * their own scanner paper wash (~77% of the eye's pixels were partial-alpha
 * paper, not ink) and were extracted at a resolution that did not register
 * against the flattened sheet, so they read as hard rectangular blocks. That
 * was an asset problem, and an asset pass fixed it: the sheet was split into a
 * plate with the eye and mouth lifted out, a re-cut eye, and three mouth phases
 * on one shared canvas and anchor — verified to recompose the original with
 * alpha RMSE 0 at rest. The runtime therefore draws `bg-plate`, never
 * `bg-main`; the uncut `bg-main` (itself replaced by the approved washed-floor
 * version in the same pass) is still what the level-entry screen shows, so that
 * illustration keeps its baked eye and mouth and has no holes.
 *
 * Two consequences worth keeping:
 *
 *   1. The eye, the mouth and the plate are ONE container. They share its
 *      position, drift, parallax, depth and alpha, and each carries the same
 *      tint and alpha as the plate, so nothing can drift out of the drawing.
 *   2. Rest is exactly the authored registration, offset (0,0). That is the
 *      only place the eye recomposes the plate perfectly; the art pass left a
 *      real, deliberately unfilled gap in the right eyelid at the eye/canopy
 *      junction, and it is only visible while the eye is away from rest. So
 *      the eye settles back toward neutral whenever the player is simply
 *      running (see `updateEye` for why "toward" and not "onto"), and
 *      reduced motion pins it there.
 */

/** Source canvas of `black-forest-bg-main.webp` and of the plate cut from it. */
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
 * exported as `FRONT_TOP_Y` so that clearance can be asserted. Nothing asserts
 * it today — the export exists for a test that has not been written.
 */
const FRONT_DEPTH = 5.42;

/**
 * Everything this renderer draws. `bg-main` is deliberately absent: the runtime
 * uses the plate, and the full illustration is the level-entry screen's own
 * texture, loaded by `LevelEntryScene` under its own key.
 */
export const BLACK_FOREST_TEXTURES = {
  bgPlate: 'black-forest-bg-plate',
  layerFront: 'black-forest-bg-layer-front',
  eye: 'black-forest-eye',
  mouthClosed: 'black-forest-mouth-closed',
  mouthMid: 'black-forest-mouth-mid',
  mouthOpen: 'black-forest-mouth-open'
} as const;

const MOUTH_PHASE_TEXTURES: Record<YawnPhase, string> = {
  closed: BLACK_FOREST_TEXTURES.mouthClosed,
  mid: BLACK_FOREST_TEXTURES.mouthMid,
  open: BLACK_FOREST_TEXTURES.mouthOpen
};

/**
 * Registration measured by the art pass, as top-left corners in the 1080x680
 * source canvas at scale 1. The three mouth phases share one 165x183 canvas and
 * one anchor precisely so the phase can be swapped without moving anything.
 */
const EYE_SRC_X = 860;
const EYE_SRC_Y = 165;
const MOUTH_SRC_X = 444;
const MOUTH_SRC_Y = 333;

/**
 * The eye's travel budget, in SOURCE pixels. These are not taste: the re-cut
 * eye has 20/20/18/19 px of margin around its ink box, and the art pass
 * reserved exactly this much of it, leaving 13/13/14.5/15.5 px spare. Going
 * past it would clip Mateo's line.
 */
const EYE_GAZE_MAX_X = 7;
const EYE_GAZE_MAX_Y = 3.5;
/**
 * How far the player has to move from their resting position for the eye to
 * reach the end of that budget. Roughly a tall jump, so an ordinary hop reads
 * as a glance and a big one as a full look.
 */
const EYE_GAZE_SPAN_X = 120;
const EYE_GAZE_SPAN_Y = 120;
/** Exponential follow, delta-driven so it is frame-rate independent. */
const EYE_FOLLOW_SHARPNESS = 4.2;

/** Top edge of the foreground band, exported so a test can assert it clears the floor. */
export const FRONT_TOP_Y = FRONT_CENTER_Y - FRONT_HEIGHT / 2;

const INK_TINT = 0xd7e8c9;
const FRONT_INK_TINT = 0xa9c4a8;
const SHEET_ALPHA = 0.86;

/** Source pixel -> position inside `midPlane`, whose sheet is centred at (0,0). */
const toLocalX = (sourceX: number) => (sourceX - SRC_WIDTH / 2) * BG_SCALE;
const toLocalY = (sourceY: number) => (sourceY - SRC_HEIGHT / 2) * BG_SCALE;

export class BlackForestBackdropRenderer implements StageBackdrop {
  private readonly sky: Phaser.GameObjects.Graphics;
  private readonly midPlane: Phaser.GameObjects.Container;
  private readonly frontTiles: Phaser.GameObjects.Image[] = [];
  private readonly eye?: Phaser.GameObjects.Image;
  private readonly mouth?: Phaser.GameObjects.Image;
  private readonly yawn = new YawnClock();

  private distance = 0;
  private destroyed = false;
  /** Current gaze offset in source pixels, eased toward the player each frame. */
  private eyeGazeX = 0;
  private eyeGazeY = 0;
  private mouthTextureKey = MOUTH_PHASE_TEXTURES.closed;

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
      .image(0, 0, BLACK_FOREST_TEXTURES.bgPlate)
      .setOrigin(0.5)
      .setScale(BG_SCALE)
      .setTintFill(INK_TINT)
      .setAlpha(SHEET_ALPHA);
    // Order is the container's list order — a Container does not depth-sort its
    // children — so the plate is added first and the two cut-outs sit on top of
    // the holes they were lifted out of.
    const midPlaneParts: Phaser.GameObjects.GameObject[] = [sheet];

    if (scene.textures.exists(BLACK_FOREST_TEXTURES.eye)) {
      // Same scale, tint and alpha as the plate, and a child of the same
      // container: there is no way for it to read as a separate sprite.
      this.eye = scene.add
        .image(toLocalX(EYE_SRC_X), toLocalY(EYE_SRC_Y), BLACK_FOREST_TEXTURES.eye)
        .setOrigin(0, 0)
        .setScale(BG_SCALE)
        .setTintFill(INK_TINT)
        .setAlpha(SHEET_ALPHA);
      midPlaneParts.push(this.eye);
    }

    if (scene.textures.exists(this.mouthTextureKey)) {
      this.mouth = scene.add
        .image(toLocalX(MOUTH_SRC_X), toLocalY(MOUTH_SRC_Y), this.mouthTextureKey)
        .setOrigin(0, 0)
        .setScale(BG_SCALE)
        .setTintFill(INK_TINT)
        .setAlpha(SHEET_ALPHA);
      midPlaneParts.push(this.mouth);
    }

    this.midPlane = scene.add
      .container(BG_CENTER_X, BG_CENTER_Y, midPlaneParts)
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
    this.updateEye(deltaSeconds, targets);
    this.updateMouth(deltaSeconds);
    this.applyLayout();
  }

  /**
   * "Follows The Player". The gaze is the player's displacement from where the
   * same player is drawn while simply running, so an ordinary run holds the eye
   * close to the authored registration and only real movement — a jump, a hit
   * recoil, the glide to the final note — visibly moves it. It is near-neutral rather than exactly neutral while running:
   * the run bob, the character's scale breathing and the late-level surface
   * lift each shift the drawn anchor a little, and no single constant bounds
   * their sum, so no figure is quoted here. What does bound the result is the
   * clamp: both axes are held inside the margin the art pass reserved, so
   * Mateo's line can never be clipped however those terms combine.
   */
  private updateEye(deltaSeconds: number, targets: BackdropFrameTargets) {
    if (!this.eye) {
      return;
    }

    if (prefersReducedMotion()) {
      this.eyeGazeX = 0;
      this.eyeGazeY = 0;
    } else {
      const targetGazeX =
        Phaser.Math.Clamp((targets.heroX - targets.heroRestX) / EYE_GAZE_SPAN_X, -1, 1) *
        EYE_GAZE_MAX_X;
      const targetGazeY =
        Phaser.Math.Clamp((targets.heroY - targets.heroRestY) / EYE_GAZE_SPAN_Y, -1, 1) *
        EYE_GAZE_MAX_Y;
      const follow = 1 - Math.exp(-deltaSeconds * EYE_FOLLOW_SHARPNESS);

      this.eyeGazeX = Phaser.Math.Linear(this.eyeGazeX, targetGazeX, follow);
      this.eyeGazeY = Phaser.Math.Linear(this.eyeGazeY, targetGazeY, follow);
    }

    this.eye.setPosition(
      toLocalX(EYE_SRC_X + this.eyeGazeX),
      toLocalY(EYE_SRC_Y + this.eyeGazeY)
    );
  }

  /**
   * "Yawns Randomly". Nothing here is procedural: the three phases are three
   * drawings on one shared canvas and anchor, so the mouth is swapped, never
   * stretched. The trunk around it lives in the plate and never moves.
   *
   * The clock is only ticked from here, and this whole renderer is skipped while
   * the pause overlay is open, so a pause freezes the yawn mid-phase and resumes
   * it exactly where it stopped.
   */
  private updateMouth(deltaSeconds: number) {
    if (!this.mouth) {
      return;
    }

    if (prefersReducedMotion()) {
      this.yawn.holdClosed();
    } else {
      this.yawn.advance(deltaSeconds);
    }

    const textureKey = MOUTH_PHASE_TEXTURES[this.yawn.phase];

    if (textureKey !== this.mouthTextureKey && this.scene.textures.exists(textureKey)) {
      this.mouth.setTexture(textureKey);
      this.mouthTextureKey = textureKey;
    }
  }

  destroy() {
    this.destroyed = true;
    this.scene.tweens.killTweensOf(this.midPlane);
    this.frontTiles.forEach((tile) => tile.destroy());
    this.frontTiles.length = 0;
    // Takes the eye and the mouth with it — they are children of this container,
    // not free sprites. Neither one owns a tween, a timer or a listener: the
    // gaze is written per frame and the yawn is a plain delta-driven clock.
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
