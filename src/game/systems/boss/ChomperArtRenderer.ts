import Phaser from 'phaser';
import { CHOMPER_ART, CHOMPER_PUPPET_PIVOT, CHOMPER_RED } from '@/game/content/chomperArt';
import type { ChomperAttack, ChomperSnapshot } from './ChomperEncounter';
import { resolveChomperArtPose } from './chomperArtPose';

const SCALE = 0.5;
const TOP = 64;
const RIM_SCALE = 1.018;
const RIM_COLOR = 0x9fe0cf;

interface PuppetRig {
  puppet: Phaser.GameObjects.Container;
  red: Phaser.GameObjects.Container;
  redUpper: Phaser.GameObjects.Image;
  redLeft: Phaser.GameObjects.Image;
  redRight: Phaser.GameObjects.Image;
  gold: Phaser.GameObjects.Image;
}

const createPuppetRig = (scene: Phaser.Scene, rim: boolean): PuppetRig => {
  const pivot = CHOMPER_PUPPET_PIVOT;
  const decorate = (image: Phaser.GameObjects.Image) => {
    if (rim) image.setTintFill(RIM_COLOR).setBlendMode(Phaser.BlendModes.ADD);
    return image;
  };
  const body = CHOMPER_ART.body;
  const bodyImage = decorate(scene.add.image(
    (body.x - pivot.x) * SCALE, (body.y - pivot.y) * SCALE, body.key
  ).setOrigin(0).setScale(SCALE));
  const jaw = (part: typeof CHOMPER_ART.redUpper | typeof CHOMPER_ART.redLeft |
    typeof CHOMPER_ART.redRight | typeof CHOMPER_ART.redHub) => decorate(
    scene.add.image(0, 0, part.key)
      .setOrigin((part.pivot.x - part.x) / part.width, (part.pivot.y - part.y) / part.height)
      .setScale(SCALE)
  );
  const redUpper = jaw(CHOMPER_ART.redUpper);
  const redLeft = jaw(CHOMPER_ART.redLeft);
  const redRight = jaw(CHOMPER_ART.redRight);
  const redHub = jaw(CHOMPER_ART.redHub);
  const red = scene.add.container(
    (CHOMPER_RED.pivot.x - pivot.x) * SCALE,
    (CHOMPER_RED.pivot.y - pivot.y) * SCALE,
    [redUpper, redLeft, redRight, redHub]
  );
  const goldPart = CHOMPER_ART.gold;
  const gold = decorate(scene.add.image(
    (goldPart.pivot.x - pivot.x) * SCALE,
    (goldPart.pivot.y - pivot.y) * SCALE,
    goldPart.key
  ).setOrigin(
    (goldPart.pivot.x - goldPart.x) / goldPart.width,
    (goldPart.pivot.y - goldPart.y) / goldPart.height
  ).setScale(SCALE));
  const puppet = scene.add.container(
    pivot.x * SCALE, TOP + pivot.y * SCALE, [bodyImage, red, gold]
  );
  return { puppet, red, redUpper, redLeft, redRight, gold };
};

/** Seven retained rig images; scene teardown owns them. No tweens or extra clock. */
export class ChomperArtRenderer {
  private readonly backlight: Phaser.GameObjects.Container;
  private readonly rimPuppet: Phaser.GameObjects.Container;
  private readonly rimRed: Phaser.GameObjects.Container;
  private readonly rimRedUpper: Phaser.GameObjects.Image;
  private readonly rimRedLeft: Phaser.GameObjects.Image;
  private readonly rimRedRight: Phaser.GameObjects.Image;
  private readonly rimGold: Phaser.GameObjects.Image;
  private readonly puppet: Phaser.GameObjects.Container;
  private readonly red: Phaser.GameObjects.Container;
  private readonly redUpper: Phaser.GameObjects.Image;
  private readonly redLeft: Phaser.GameObjects.Image;
  private readonly redRight: Phaser.GameObjects.Image;
  private readonly gold: Phaser.GameObjects.Image;

  static preload(scene: Phaser.Scene) {
    if (!import.meta.env.DEV) return;
    for (const part of Object.values(CHOMPER_ART)) {
      if (!scene.textures.exists(part.key)) scene.load.image(part.key, part.url);
    }
  }

  static available(scene: Phaser.Scene) {
    return Object.values(CHOMPER_ART).every((part) => scene.textures.exists(part.key));
  }

  constructor(scene: Phaser.Scene) {
    scene.add.image(0, TOP, CHOMPER_ART.plate.key).setOrigin(0).setDisplaySize(360, 540);
    const pivot = CHOMPER_PUPPET_PIVOT;
    const outer = scene.add.ellipse(-34, -151, 292, 454, 0x589f95, 0.045)
      .setBlendMode(Phaser.BlendModes.ADD);
    const middle = scene.add.ellipse(-34, -151, 238, 392, 0x7bc4b2, 0.05)
      .setBlendMode(Phaser.BlendModes.ADD);
    const heart = scene.add.ellipse(-28, -155, 168, 292, 0xe5c565, 0.032)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.backlight = scene.add.container(
      pivot.x * SCALE, TOP + pivot.y * SCALE, [outer, middle, heart]
    );
    const rim = createPuppetRig(scene, true);
    this.rimPuppet = rim.puppet;
    this.rimRed = rim.red;
    this.rimRedUpper = rim.redUpper;
    this.rimRedLeft = rim.redLeft;
    this.rimRedRight = rim.redRight;
    this.rimGold = rim.gold;
    const main = createPuppetRig(scene, false);
    this.puppet = main.puppet;
    this.red = main.red;
    this.redUpper = main.redUpper;
    this.redLeft = main.redLeft;
    this.redRight = main.redRight;
    this.gold = main.gold;
  }

  update(state: ChomperSnapshot, reducedMotion: boolean) {
    const pose = resolveChomperArtPose(state, reducedMotion);
    const pivot = CHOMPER_PUPPET_PIVOT;
    const x = pivot.x * SCALE + pose.bodyX;
    const y = TOP + pivot.y * SCALE + pose.bodyY;
    this.puppet.setPosition(x, y).setAngle(pose.bodyAngle).setScale(pose.bodyScaleX, pose.bodyScaleY);
    this.rimPuppet.setPosition(x, y).setAngle(pose.bodyAngle)
      .setScale(pose.bodyScaleX * RIM_SCALE, pose.bodyScaleY * RIM_SCALE);
    this.backlight.setPosition(x, y).setAngle(pose.bodyAngle)
      .setScale(pose.bodyScaleX, pose.bodyScaleY);
    const biteCrossesHero = !reducedMotion && state.attack === 'bite-lunge' &&
      state.phase === 'attack' && state.phaseProgress >= 0.45 && state.phaseProgress <= 0.68;
    this.backlight.setDepth(biteCrossesHero ? 2.85 : 0.05);
    this.rimPuppet.setDepth(biteCrossesHero ? 3.15 : 0.1);
    this.puppet.setDepth(biteCrossesHero ? 3.25 : 0.2);
    const energy = state.phase === 'attack' ? 1
      : state.phase === 'warning' ? 0.72 + state.phaseProgress * 0.28
        : state.phase === 'recovery' ? 0.7 * (1 - state.phaseProgress) : 0.45;
    this.backlight.setAlpha(0.62 + energy * 0.28);
    this.rimPuppet.setAlpha(0.18 + energy * 0.12);
    this.red.setAngle(pose.redAngle);
    this.redUpper.setAngle(pose.redUpperJawAngle);
    this.redLeft.setAngle(pose.redLeftJawAngle);
    this.redRight.setAngle(pose.redRightJawAngle);
    this.gold.setAngle(pose.goldAngle);
    this.rimRed.setAngle(pose.redAngle);
    this.rimRedUpper.setAngle(pose.redUpperJawAngle);
    this.rimRedLeft.setAngle(pose.redLeftJawAngle);
    this.rimRedRight.setAngle(pose.redRightJawAngle);
    this.rimGold.setAngle(pose.goldAngle);
  }

  /** The visual warning follows the painted mouth; encounter colliders stay fixed. */
  mouth(attack: ChomperAttack) {
    const redAttack = attack !== 'low-wave';
    const pivot = redAttack ? CHOMPER_RED.pivot : CHOMPER_ART.gold.pivot;
    const point = attack === 'bite-lunge' ? CHOMPER_RED.biteMouth
      : redAttack ? CHOMPER_RED.highMouth : CHOMPER_ART.gold.mouth;
    const image = redAttack ? this.red : this.gold;
    const headDx = (point.x - pivot.x) * SCALE;
    const headDy = (point.y - pivot.y) * SCALE;
    const headCos = Math.cos(image.rotation), headSin = Math.sin(image.rotation);
    const localX = image.x + headDx * headCos - headDy * headSin;
    const localY = image.y + headDx * headSin + headDy * headCos;
    const scaledX = localX * this.puppet.scaleX;
    const scaledY = localY * this.puppet.scaleY;
    const bodyCos = Math.cos(this.puppet.rotation), bodySin = Math.sin(this.puppet.rotation);
    return {
      x: this.puppet.x + scaledX * bodyCos - scaledY * bodySin,
      y: this.puppet.y + scaledX * bodySin + scaledY * bodyCos
    };
  }
}
