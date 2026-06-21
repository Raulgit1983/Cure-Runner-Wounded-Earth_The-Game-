import type { JourneyStageDefinition, JourneyStageKey } from '@/game/content/journeyStages';

/**
 * Minimal level abstraction layer.
 *
 * A LevelDefinition is a thin, data-driven wrapper around the existing
 * journey-stage content. It introduces stable level identity (id/index/world)
 * and progression metadata (nextLevelId/difficulty) WITHOUT owning or
 * duplicating any gameplay data: the actual stage content is referenced from
 * `journeyStages` via `stage`. This keeps a single source of truth while
 * giving the future 10-level expansion a place to grow.
 */

export type WorldId = 'world-01';

/** Stable level identifier, e.g. `w1-l1`. Kept as a string so levels 2-10 can be added as data only. */
export type LevelId = string;

/** Difficulty band used to shape the onboarding -> climax curve across a world. */
export type LevelDifficulty = 'onboarding' | 'low' | 'medium' | 'high' | 'climax';

export interface LevelDefinition {
  /** Stable, URL-safe id, e.g. `w1-l1`. */
  id: LevelId;
  /** World this level belongs to. */
  world: WorldId;
  /** 1-based position within its world. */
  index: number;
  /** Human-readable name for UI/level cards. */
  displayName: string;
  /** Key of the underlying journey stage that supplies gameplay content. */
  stageKey: JourneyStageKey;
  /** Reference to the existing stage definition (not a copy). */
  stage: JourneyStageDefinition;
  /** Next level in sequence, or null if this is the last defined level. */
  nextLevelId: LevelId | null;
  /** Difficulty band for curve/tuning decisions in future slices. */
  difficulty: LevelDifficulty;
}
