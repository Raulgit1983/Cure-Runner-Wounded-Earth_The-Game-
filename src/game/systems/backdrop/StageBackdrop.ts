/**
 * The contract `JourneyScene` talks to, so a stage can bring its own backdrop
 * implementation without the scene knowing which one it got.
 *
 * `BackdropRenderer` paints Wounded Planet and Moonlight Mountain with Graphics;
 * `BlackForestBackdropRenderer` composes Mateo's scanned sheet with parallax,
 * a tracking eye and a yawning mouth. They share nothing but this interface.
 */
export interface BackdropFrameTargets {
  distanceTravelled: number;
  surfaceProgress: number;
  finishRevealProgress: number;
  environmentLevel: number;
  collectFeedback: number;
  chainFeedback: number;
  awakeningFeedback: number;
}

export interface StageBackdrop {
  /** First paint right after scene create. */
  renderInitial(timeNow: number): void;
  update(deltaSeconds: number, timeNow: number, targets: BackdropFrameTargets): void;
  /** Release sprites, timers and tweens on shutdown/restart. */
  destroy(): void;
}
