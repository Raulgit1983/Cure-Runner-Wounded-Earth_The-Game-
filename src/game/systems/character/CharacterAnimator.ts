import Phaser from 'phaser';

import type { CharacterPose, PlayableCharacter } from '@/game/content/playableCharacters';

import {
  isAirPoseState,
  resolveCharacterPoseState,
  type AirPoseState,
  type CharacterPoseState
} from './characterPoseState';

/** Hit pose lock — unchanged from the value the scene used before. */
export const HIT_POSE_LOCK_SECONDS = 0.15;
/** Landing compress hold, per the animation pack's recommendation. */
export const LANDING_POSE_LOCK_SECONDS = 0.09;
const RUN_FRAME_RATE = 10;
/** Guards the landing edge against float noise in a decaying burst value. */
const LANDING_BURST_EPSILON = 0.001;

/**
 * Owns the playable character's texture/animation state and nothing else.
 *
 * It does NOT touch position, origin, depth, alpha, scale, rotation, aura or
 * shadow — the scene keeps every one of those, and keeps driving them exactly
 * as before. This class only decides which frame (or which running animation)
 * the sprite shows.
 *
 * The landing moment is the rising edge of `RunnerLoopSnapshot.landingBurst`,
 * i.e. the one the runner already computes on the frame it touches down. There
 * is deliberately no second detector here.
 */
export class CharacterAnimator {
  private runAnimationKey: string | null;
  private hitLockSeconds = 0;
  private landingLockSeconds = 0;
  private previousAirState: AirPoseState | null = null;
  private previousLandingBurst = 0;
  private previousDistance = -1;
  private currentState: CharacterPoseState | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sprite: Phaser.GameObjects.Sprite,
    private character: PlayableCharacter
  ) {
    this.runAnimationKey = this.registerRunAnimation();
  }

  /** Appearance only: changing form must not reset the runner or its pose locks. */
  setCharacter(character: PlayableCharacter) {
    if (character.id === this.character.id) return;
    this.sprite.stop();
    this.character = character;
    this.runAnimationKey = this.registerRunAnimation();
    this.currentState = null;
  }

  /** Called when the character takes a hit; keeps the existing 150 ms lock. */
  noteHit() {
    this.hitLockSeconds = Math.max(this.hitLockSeconds, HIT_POSE_LOCK_SECONDS);
  }

  /** Fail/finish flows clear the transient poses, same as they cleared the old timers. */
  clearTransient() {
    this.hitLockSeconds = 0;
    this.landingLockSeconds = 0;
  }

  /** True while the looping run cycle is the visible state. */
  isRunCycleActive() {
    return this.currentState === 'run' && this.runAnimationKey !== null;
  }

  /**
   * Pauses/resumes the looping run cycle. Animations advance on the game's
   * animation manager, not from `Scene.update()`, so a scene that early-returns
   * while paused would otherwise leave the character running on the spot behind
   * the pause panel.
   */
  setPaused(paused: boolean) {
    const anims = this.sprite.anims;

    if (paused) {
      if (anims.isPlaying) {
        anims.pause();
      }

      return;
    }

    if (anims.isPaused) {
      anims.resume();
    }
  }

  update(
    deltaSeconds: number,
    snapshot: {
      grounded: boolean;
      velocityY: number;
      distanceTravelled: number;
      landingBurst: number;
    },
    finishResolved: boolean
  ) {
    this.hitLockSeconds = Math.max(0, this.hitLockSeconds - deltaSeconds);
    this.landingLockSeconds = Math.max(0, this.landingLockSeconds - deltaSeconds);

    // `landingBurst` is raised by the runner on the touchdown frame and decays
    // from there, so a rise IS a landing. Reusing it keeps one landing moment
    // shared by physics, squash and this pose.
    if (snapshot.landingBurst > this.previousLandingBurst + LANDING_BURST_EPSILON) {
      this.landingLockSeconds = LANDING_POSE_LOCK_SECONDS;
    }

    this.previousLandingBurst = snapshot.landingBurst;

    const state = resolveCharacterPoseState({
      finishResolved,
      hitLockSeconds: this.hitLockSeconds,
      landingLockSeconds: this.landingLockSeconds,
      grounded: snapshot.grounded,
      velocityY: snapshot.velocityY,
      previousAirState: this.previousAirState
    });

    this.previousAirState = isAirPoseState(state) ? state : null;

    if (state !== this.currentState) {
      this.currentState = state;
      this.apply(state);
    }

    // The world stops for a discovery beat, a retry and the finish sequence
    // without `Scene.update()` stopping, so freeze the run cycle whenever the
    // runner is not actually covering ground.
    const advancing = snapshot.distanceTravelled > this.previousDistance;
    this.previousDistance = snapshot.distanceTravelled;
    this.setPaused(!advancing);
  }

  private apply(state: CharacterPoseState) {
    if (state === 'run' && this.runAnimationKey) {
      this.sprite.play(this.runAnimationKey, true);
      return;
    }

    this.sprite.stop();
    this.sprite.setTexture(this.resolveTextureKey(state));
  }

  /**
   * Every optional pose stays behind a `textures.exists()` guard, so a
   * character missing part of the set falls through to its OWN `main` texture
   * and can never render another character's frame.
   */
  private resolveTextureKey(state: CharacterPoseState) {
    const poses = this.character.poses;
    const candidate = (pose: CharacterPose | undefined) =>
      pose && this.scene.textures.exists(pose.key) ? pose.key : null;

    switch (state) {
      case 'finish':
        return candidate(poses.finishAwakened) ?? poses.main.key;
      case 'hit':
        return candidate(poses.hit) ?? poses.main.key;
      case 'landing':
        return candidate(poses.landing) ?? candidate(poses.runContact) ?? poses.main.key;
      case 'jump-rise':
        return candidate(poses.jumpRise) ?? poses.main.key;
      case 'jump-apex':
        return candidate(poses.jumpApex) ?? candidate(poses.jumpRise) ?? poses.main.key;
      case 'jump-fall':
        return candidate(poses.jumpFall) ?? poses.main.key;
      default:
        return poses.main.key;
    }
  }

  /**
   * `contact -> pass -> push -> pass` at 10 fps, looping — one animation per
   * character, built from that character's own texture keys. Animations live on
   * the game-level manager, so this is idempotent across scene restarts.
   */
  private registerRunAnimation(): string | null {
    const { runContact, runPass, runPush } = this.character.poses;
    const cycle = [runContact, runPass, runPush, runPass];

    if (cycle.some((pose) => !pose || !this.scene.textures.exists(pose.key))) {
      return null;
    }

    const key = `${this.character.id}-run`;

    if (!this.scene.anims.exists(key)) {
      this.scene.anims.create({
        key,
        frames: cycle.map((pose) => ({ key: pose!.key })),
        frameRate: RUN_FRAME_RATE,
        repeat: -1
      });
    }

    return key;
  }
}
