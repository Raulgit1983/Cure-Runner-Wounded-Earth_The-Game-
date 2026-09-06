import Phaser from 'phaser';

import { journeyConfig } from '@/game/content/journeyConfig';
import { prefersReducedMotion } from '@/ui/reducedMotion';

import { featherBands } from './backdropGrade';
import {
  BG_BOTTOM_Y,
  BG_CENTER_X,
  BG_CENTER_Y,
  BG_HEIGHT,
  BG_PARALLAX_LIMIT,
  BG_SCALE,
  BG_TOP_Y,
  BG_WIDTH,
  BLACK_FOREST_TEXTURES,
  IRIS_SRC_X,
  IRIS_SRC_Y,
  MOUTH_PHASE_TEXTURES,
  MOUTH_SRC_X,
  MOUTH_SRC_Y,
  resolveIrisGaze,
  toLocalX,
  toLocalY
} from './blackForestArt';
import { YawnClock } from './blackForestYawn';
import type { BackdropFrameTargets, StageBackdrop } from './StageBackdrop';

/**
 * Image-based backdrop for The Black Forest.
 *
 * It is a separate renderer, delegated to by the scene, because `BackdropRenderer`
 * is a Graphics-only painter: putting sprites, parallax, an eye that tracks the
 * player and a yawning mouth inside it would turn it into two classes wearing
 * one name.
 *
 * It draws the colour production art (v4). Mateo's sheet used to reach the
 * runtime as a pure alpha matte — every pixel black, the graphite encoded as
 * alpha — which had to be recoloured with `setTintFill` to be visible at all.
 * That is over: the plate, the iris and the three mouths are finished colour
 * drawings, so NOTHING here tints them. `setTintFill` on colour art would
 * discard every hue in the drawing and replace it with one flat value, which is
 * the whole thing this pass exists to stop doing.
 *
 * Mateo's two annotated behaviours — the eye that "Follows The Player" and the
 * mouth that "Yawns Randomly" — are wired up here, and the shape of that wiring
 * is the correction this version carries:
 *
 *   1. The socket, the eyelids and the bark around them are PAINTED INTO THE
 *      PLATE and never move. The only thing that moves is the small iris disc,
 *      inside a budget bounded by the white of the sclera (see
 *      `blackForestArt.ts`). Earlier cut-outs moved a whole eye and read as a
 *      rectangular sprite sliding over a drawing; there is now no anatomy left
 *      in a moving object for that to happen to.
 *   2. The plate, the iris and the mouth are ONE container. They share its
 *      position, drift, parallax and depth. A single veil AFTER the assembled
 *      drawing controls its presence; per-child alpha would expose overlaps.
 *   3. Rest is exactly the authored registration, offset (0,0) — the only place
 *      the cut-outs recompose the plate. Reduced motion pins the iris there and
 *      holds the mouth closed.
 *
 * There is no foreground plane. The pale pine strip that used to run along the
 * bottom was a second, separately tinted copy of pines that the colour plate
 * already draws, and a mint-tinted matte over finished colour art reads as a
 * different world. It stays on disk as rollback material, unreferenced.
 */

/**
 * The night the drawing sits in. It is deliberately a desaturated, darker
 * version of the plate's own field rather than the previous green-black. The
 * same colours form the veil over the fully opaque art assembly.
 */
const SKY_TOP = 0x0a1122;
const SKY_BOTTOM = 0x070c18;

const BG_DEPTH = 0.2;
/**
 * Slow mid-plane drift, the only parallax this stage has. Its bound is NOT set
 * here: `BG_PARALLAX_LIMIT` is derived from the framing in `blackForestArt.ts`,
 * because a hand-set number is what previously let the drift pull the plate off
 * the right edge of the canvas.
 */
const BG_PARALLAX_PER_PX = 0.0055;

/**
 * The dissolve that ends the illustration.
 *
 * The plate is a band across the upper screen, so it has a hard horizontal edge
 * at the top and another at the bottom, and both used to cut straight across the
 * night. A forest at night has no such line: it emerges out of the dark and
 * fades back into it. These two ramps are the sky's own colour, so they add no
 * hue — the drawing simply stops being fully present near its own edges.
 *
 * The bottom edge is feathered harder than the top. Below it is the play band,
 * where the hero, the shards and the notes have to read, and letting the grass
 * settle into the dark rather than stop on a line is what gives that band a
 * horizon instead of a seam.
 */
const FEATHER_DEPTH_TOP = 34;
const FEATHER_DEPTH_BOTTOM = 62;
const FEATHER_OVERSHOOT = 10;
const FEATHER_EDGE_ALPHA = 0.94;

/**
 * The single knob for "how present is the illustration". Phaser multiplies
 * container alpha into EACH child; fading overlapping opaque patches that way
 * exposes the plate below them. Instead, composite the art at full opacity and
 * put one sky-coloured veil over the result. No offscreen texture is needed.
 *
 * It stays close to opaque on purpose. The art is authored colour now, and the
 * heavy knock-down the alpha matte needed (an effective 0.62-0.83) would mix a
 * third of the sky into every hue Mateo chose. What is left is a small
 * atmospheric lift as the world wakes up, not a wash.
 */
const PLATE_BASE_ALPHA = 0.88;
const PLATE_ENV_ALPHA_GAIN = 0.09;
const PLATE_AWAKENING_ALPHA_GAIN = 0.03;

/** Exponential follow, delta-driven so it is frame-rate independent. */
const IRIS_FOLLOW_SHARPNESS = 4.2;

export class BlackForestBackdropRenderer implements StageBackdrop {
  private readonly ground?: Phaser.GameObjects.Image;
  private readonly groundFade?: Phaser.GameObjects.Graphics;
  private readonly sky: Phaser.GameObjects.Graphics;
  private readonly midPlane: Phaser.GameObjects.Container;
  private readonly feather: Phaser.GameObjects.Graphics;
  private readonly atmosphere: Phaser.GameObjects.Graphics;
  private readonly iris?: Phaser.GameObjects.Image;
  private readonly mouth?: Phaser.GameObjects.Image;
  private readonly yawn = new YawnClock();

  private distance = 0;
  private destroyed = false;
  /** Current gaze offset in source pixels, eased toward the player each frame. */
  private irisGazeX = 0;
  private irisGazeY = 0;
  private mouthTextureKey = MOUTH_PHASE_TEXTURES.closed;

  constructor(
    private readonly scene: Phaser.Scene,
    initialEnvironmentLevel: number
  ) {
    const width = journeyConfig.logicalSize.width;
    const height = journeyConfig.logicalSize.height;

    this.sky = scene.add.graphics().setDepth(0);
    this.sky.fillGradientStyle(SKY_TOP, SKY_TOP, SKY_BOTTOM, SKY_BOTTOM, 1, 1, 1, 1);
    this.sky.fillRect(0, 0, width, height);

    if (scene.textures.exists('black-forest-floor-v1')) {
      this.ground = scene.add.image(0, 100, 'black-forest-floor-v1')
        .setOrigin(0).setScale(0.5).setDepth(0.1).setAlpha(0.92);
      this.groundFade = scene.add.graphics().setDepth(0.11);
      this.groundFade.fillStyle(SKY_BOTTOM, 1).fillRect(0, 100, width, 260);
      this.groundFade.fillGradientStyle(SKY_BOTTOM, SKY_BOTTOM, SKY_BOTTOM, SKY_BOTTOM, 1, 1, 0, 0);
      this.groundFade.fillRect(0, 360, width, 142);
    }

    // No tint anywhere below this line: the plate and the cut-outs keep the RGB
    // and the alpha they were authored with.
    const plate = scene.add
      .image(0, 0, BLACK_FOREST_TEXTURES.plate)
      .setOrigin(0.5)
      .setScale(BG_SCALE);
    // Order is the container's list order — a Container does not depth-sort its
    // children — so the plate is added first and the two cut-outs sit on top of
    // the holes they were lifted out of.
    const midPlaneParts: Phaser.GameObjects.GameObject[] = [plate];

    if (scene.textures.exists(BLACK_FOREST_TEXTURES.iris)) {
      // Same scale as the plate and a child of the same container, so it cannot
      // read as a separate sprite. Everything around it — sclera, lids, bark —
      // is in the plate and stays put.
      this.iris = scene.add
        .image(toLocalX(IRIS_SRC_X), toLocalY(IRIS_SRC_Y), BLACK_FOREST_TEXTURES.iris)
        .setOrigin(0, 0)
        .setScale(BG_SCALE);
      midPlaneParts.push(this.iris);
    }

    if (scene.textures.exists(this.mouthTextureKey)) {
      this.mouth = scene.add
        .image(toLocalX(MOUTH_SRC_X), toLocalY(MOUTH_SRC_Y), this.mouthTextureKey)
        .setOrigin(0, 0)
        .setScale(BG_SCALE);
      midPlaneParts.push(this.mouth);
    }

    this.atmosphere = scene.add.graphics();
    // Match the sky's vertical gradient at this fixed Y registration. Only X
    // drifts, so the geometry and colour stops can be drawn once.
    const skyAt = (y: number) => {
      const t = y / height;
      const channel = (shift: number) => Math.round(
        ((SKY_TOP >> shift) & 255) * (1 - t) + ((SKY_BOTTOM >> shift) & 255) * t
      );
      return (channel(16) << 16) | (channel(8) << 8) | channel(0);
    };
    const top = skyAt(BG_TOP_Y);
    const bottom = skyAt(BG_BOTTOM_Y);
    this.atmosphere.fillGradientStyle(top, top, bottom, bottom, 1, 1, 1, 1);
    this.atmosphere.fillRect(-BG_WIDTH / 2, -BG_HEIGHT / 2, BG_WIDTH, BG_HEIGHT);
    midPlaneParts.push(this.atmosphere);

    this.midPlane = scene.add
      .container(BG_CENTER_X, BG_CENTER_Y, midPlaneParts)
      .setDepth(BG_DEPTH);
    this.updateAtmosphere(initialEnvironmentLevel, 0);

    // Above the mid-plane, below every gameplay entity: static geometry, drawn
    // once. The band only drifts sideways, so a vertical dissolve never has to
    // be repainted.
    this.feather = scene.add.graphics().setDepth(BG_DEPTH + 0.01);
    this.paintFeather(width);
  }

  /**
   * Dissolves the plate's two hard horizontal edges into the night behind it,
   * using the sky's own colours so nothing is tinted.
   */
  private paintFeather(width: number) {
    this.feather.clear();

    featherBands(BG_TOP_Y, BG_BOTTOM_Y, {
      topDepth: FEATHER_DEPTH_TOP,
      bottomDepth: FEATHER_DEPTH_BOTTOM,
      overshoot: FEATHER_OVERSHOOT,
      edgeAlpha: FEATHER_EDGE_ALPHA
    }).forEach((band) => {
      this.feather.fillGradientStyle(
        SKY_TOP,
        SKY_TOP,
        SKY_BOTTOM,
        SKY_BOTTOM,
        band.topAlpha,
        band.topAlpha,
        band.bottomAlpha,
        band.bottomAlpha
      );
      this.feather.fillRect(-2, band.top, width + 4, band.bottom - band.top);
    });
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
    this.updateAtmosphere(targets.environmentLevel, targets.awakeningFeedback);
    this.updateIris(deltaSeconds, targets);
    this.updateMouth(deltaSeconds);
    this.applyLayout();
  }

  private updateAtmosphere(environment: number, awakening: number) {
    const presence = Phaser.Math.Clamp(
      PLATE_BASE_ALPHA + environment * PLATE_ENV_ALPHA_GAIN +
        awakening * PLATE_AWAKENING_ALPHA_GAIN,
      0, 1
    );
    this.atmosphere.setAlpha(1 - presence);
  }

  /**
   * "Follows The Player". The gaze is the player's displacement from where the
   * same player is drawn while simply running, so an ordinary run holds the
   * iris close to the authored registration and only real movement — a jump, a
   * hit recoil, the glide to the final note — visibly moves it. It is
   * near-neutral rather than exactly neutral while running: the run bob, the
   * character's scale breathing and the late-level surface lift each shift the
   * drawn anchor a little, and no single constant bounds their sum, so no figure
   * is quoted here. What does bound the result is `resolveIrisGaze`, which
   * clamps both axes inside the sclera however those terms combine.
   */
  private updateIris(deltaSeconds: number, targets: BackdropFrameTargets) {
    if (!this.iris) {
      return;
    }

    if (prefersReducedMotion()) {
      this.irisGazeX = 0;
      this.irisGazeY = 0;
    } else {
      const gaze = resolveIrisGaze(
        targets.heroX - targets.heroRestX,
        targets.heroY - targets.heroRestY
      );
      const follow = 1 - Math.exp(-deltaSeconds * IRIS_FOLLOW_SHARPNESS);

      this.irisGazeX = Phaser.Math.Linear(this.irisGazeX, gaze.x, follow);
      this.irisGazeY = Phaser.Math.Linear(this.irisGazeY, gaze.y, follow);
    }

    this.iris.setPosition(
      toLocalX(IRIS_SRC_X + this.irisGazeX),
      toLocalY(IRIS_SRC_Y + this.irisGazeY)
    );
  }

  /**
   * "Yawns Randomly". Nothing here is procedural: the three phases are three
   * drawings on one shared canvas and anchor, so the mouth is swapped, never
   * stretched. The trunk around it lives in the plate and never moves or scales.
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
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.tweens.killTweensOf(this.midPlane);
    // Takes the iris and the mouth with it — they are children of this
    // container, not free sprites. Neither one owns a tween, a timer or a
    // listener: the gaze is written per frame and the yawn is a plain
    // delta-driven clock.
    this.midPlane.destroy(true);
    this.feather.destroy();
    this.sky.destroy();
    this.ground?.destroy();
    this.groundFade?.destroy();
  }

  private applyLayout() {
    const drift = prefersReducedMotion()
      ? 0
      : Phaser.Math.Clamp(
          -this.distance * BG_PARALLAX_PER_PX,
          -BG_PARALLAX_LIMIT,
          BG_PARALLAX_LIMIT
        );

    this.midPlane.setPosition(BG_CENTER_X + drift, BG_CENTER_Y);
  }
}
