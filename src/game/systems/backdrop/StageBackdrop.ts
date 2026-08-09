/**
 * The contract `JourneyScene` talks to, so a stage can bring its own backdrop
 * implementation without the scene knowing which one it got.
 *
 * `BackdropRenderer` paints Wounded Planet and Moonlight Mountain with Graphics;
 * `BlackForestBackdropRenderer` composes Mateo's scanned sheet with parallax,
 * a tracking eye and a yawning mouth. They share nothing but this interface.
 *
 * Everything a backdrop may react to arrives through `BackdropFrameTargets`.
 * Keep it that way: a `stage === '<key>'` branch in the scene is how the second
 * world's behaviour silently leaked into every other one before.
 */
export interface BackdropFrameTargets {
  distanceTravelled: number;
  surfaceProgress: number;
  finishRevealProgress: number;
  environmentLevel: number;
  collectFeedback: number;
  chainFeedback: number;
  awakeningFeedback: number;
  /**
   * Where the player is drawn this frame, and where the same player is drawn
   * when simply running along the ground. A backdrop that wants to react to the
   * player reads the displacement between the two, so it never has to know the
   * hero's physics constants, the active character's art metrics or the stage.
   *
   * The rest pair is supplied rather than assumed because a grounded character's
   * rendered anchor is NOT `runnerConfig.hero.runY`: each character's footing
   * correction shifts it, so hardcoding a neutral would leave a stage reacting
   * to a player who is standing still.
   *
   * `BackdropRenderer` (stages 1-2) ignores all four.
   */
  heroX: number;
  heroY: number;
  heroRestX: number;
  heroRestY: number;
}

export interface StageBackdrop {
  /** First paint right after scene create. */
  renderInitial(timeNow: number): void;
  update(deltaSeconds: number, timeNow: number, targets: BackdropFrameTargets): void;
  /** Release sprites, timers and tweens on shutdown/restart. */
  destroy(): void;
}
