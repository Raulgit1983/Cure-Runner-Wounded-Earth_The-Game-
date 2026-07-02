/**
 * Data-driven registry of one-time player guidance for a run.
 *
 * Replaces the 13 `*GuidanceShown` boolean latches that lived in JourneyScene
 * (behavior-preserving extraction). Each key below is one guidance moment: a
 * discovery beat (panel/line via `triggerDiscoveryBeat`, keyed by its beat id)
 * or a per-stage guidance line. The scene keeps ALL trigger conditions
 * (phrase ids, time gates, progress thresholds); this module only answers
 * "was this guide already shown this run?" and records when it is.
 *
 * Two keys are also read as game-state by the Tiburoncín (shark) director,
 * exactly like their old booleans were:
 * - `hazard_intro`   → "the player has been hit at least once"
 * - `shark_sighting` → "the first shark window was consumed" (note: only
 *   marked when the sighting beat actually shows — a spawn suppressed by the
 *   guidance cooldown leaves it unmarked, so the next spawn counts as the
 *   first window again; that timing subtlety is intentional and preserved)
 * And `shark_catch` doubles as "rescued at least once" (`firstRescue`).
 *
 * Phaser-free on purpose so it stays unit-testable.
 */

export const guidanceKeys = [
  // Per-stage guidance lines (data on JourneyStageDefinition)
  'stage_intro', // was moonlightIntroGuidanceShown — stage.introGuidance on create
  'stage_beat', // was moonlightBeatGuidanceShown — stage.beatGuidance on first chain
  'stage_surface', // was surfaceGuidanceShown — stage.surfaceGuidance at surfaceProgress>=0.56
  // Discovery beats (same ids as triggerDiscoveryBeat)
  'jump_intro', // was firstJumpGuidanceShown
  'double_jump_intro', // was doubleJumpHintShown
  'upper_route_intro', // was upperRouteHintShown
  'notes_intro', // was firstCollectGuidanceShown
  'hazard_intro', // was firstHitGuidanceShown (also read by shark director)
  'reserve_hint', // was reserveGuidanceShown
  'reserve_gain', // was reserveFillBeatShown (later fills fall back to a line)
  'reserve_spent', // was reserveSpentGuidanceShown
  'shark_sighting', // was sharkHelpGuidanceShown (also read by shark director)
  'shark_catch' // was sharkBenefitGuidanceShown (firstRescue = !hasShown)
] as const;

export type GuidanceKey = (typeof guidanceKeys)[number];

export class GuidanceDirector {
  private readonly shown = new Set<GuidanceKey>();

  /** Has this guide already been shown this run? */
  hasShown(key: GuidanceKey): boolean {
    return this.shown.has(key);
  }

  /** Record that this guide was shown. Idempotent. */
  markShown(key: GuidanceKey): void {
    this.shown.add(key);
  }

  /**
   * Query-and-mark in one step: returns true only the first time it is called
   * for a key (marking it shown), false ever after. Place it LAST in a
   * compound condition so the guide is only consumed when every other gate
   * already passed.
   */
  showOnce(key: GuidanceKey): boolean {
    if (this.shown.has(key)) {
      return false;
    }

    this.shown.add(key);
    return true;
  }

  /** Forget everything — called on run start/restart (scene create). */
  reset(): void {
    this.shown.clear();
  }
}
