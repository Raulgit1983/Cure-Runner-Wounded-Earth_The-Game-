/**
 * Pure pose-priority resolution for the playable character. Phaser-free on
 * purpose so the priority order can be unit-tested — it is the one piece of the
 * animation work that has real branching.
 *
 * Priority (strict, top wins):
 *   finish -> hit -> landing -> jump -> run
 *
 * These thresholds are shared by every character: the jump arc, its timing and
 * how a pose is chosen must feel identical no matter who is on screen. Only the
 * texture keys behind the poses vary.
 */
export type CharacterPoseState =
  | 'finish'
  | 'hit'
  | 'landing'
  | 'jump-rise'
  | 'jump-apex'
  | 'jump-fall'
  | 'run';

export type AirPoseState = 'jump-rise' | 'jump-apex' | 'jump-fall';

/** Rising fast enough to read as a clear ascent. */
export const AIR_RISE_THRESHOLD = -32;
/** Falling fast enough to read as a clear descent. */
export const AIR_FALL_THRESHOLD = 32;
/** Near-zero vertical speed: the apex frame's window. */
export const AIR_APEX_DEADZONE = 12;

export interface CharacterPoseInput {
  /** Finish sequence has resolved — outranks everything else. */
  finishResolved: boolean;
  /** Remaining hit-pose lock, seconds. */
  hitLockSeconds: number;
  /** Remaining landing-compress lock, seconds. */
  landingLockSeconds: number;
  grounded: boolean;
  velocityY: number;
  /**
   * Air pose chosen on the previous frame, or null. Used as hysteresis in the
   * bands between the apex deadzone and the rise/fall thresholds so the sprite
   * does not flicker between two frames around a threshold.
   */
  previousAirState: AirPoseState | null;
}

export const resolveCharacterPoseState = (input: CharacterPoseInput): CharacterPoseState => {
  if (input.finishResolved) {
    return 'finish';
  }

  if (input.hitLockSeconds > 0) {
    return 'hit';
  }

  if (input.grounded) {
    // The landing compress only reads on the ground; an airborne frame must
    // never hold it, or a double jump taken straight out of a landing would
    // keep the compressed pose in mid-air.
    return input.landingLockSeconds > 0 ? 'landing' : 'run';
  }

  const velocityY = input.velocityY;

  if (Math.abs(velocityY) <= AIR_APEX_DEADZONE) {
    return 'jump-apex';
  }

  if (velocityY <= AIR_RISE_THRESHOLD) {
    return 'jump-rise';
  }

  if (velocityY >= AIR_FALL_THRESHOLD) {
    return 'jump-fall';
  }

  // Between the deadzone and a threshold: hold whatever was showing, so the
  // pose only changes on a decisive velocity, never on jitter.
  if (input.previousAirState) {
    return input.previousAirState;
  }

  return velocityY < 0 ? 'jump-rise' : 'jump-fall';
};

export const isAirPoseState = (state: CharacterPoseState): state is AirPoseState =>
  state === 'jump-rise' || state === 'jump-apex' || state === 'jump-fall';
