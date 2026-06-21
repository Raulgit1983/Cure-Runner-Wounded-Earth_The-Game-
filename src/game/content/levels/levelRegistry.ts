import { journeyStages } from '@/game/content/journeyStages';
import type { LevelDefinition, LevelId } from '@/game/content/levels/types';

/**
 * Ordered registry of playable levels.
 *
 * For this foundation slice it contains a single level (`w1-l1`) that wraps the
 * existing `wounded-planet` stage by reference. Levels 2-10 are intentionally
 * NOT defined yet — they will be added here as data in a later slice without
 * touching scenes, systems, physics, or tuning.
 */

const woundedPlanetStageKey = 'wounded-planet' as const;
const woundedPlanetStage = journeyStages[woundedPlanetStageKey];

const woundedPlanetLevel: LevelDefinition = {
  id: 'w1-l1',
  world: 'world-01',
  index: 1,
  // Reuse the existing stage label — no new player-facing copy is introduced here.
  displayName: woundedPlanetStage.label,
  stageKey: woundedPlanetStageKey,
  stage: woundedPlanetStage,
  nextLevelId: null,
  difficulty: 'onboarding'
};

export const levelRegistry: readonly LevelDefinition[] = [woundedPlanetLevel];

/** Look up a level by id. Returns undefined if the id is unknown. */
export const getLevel = (id: LevelId): LevelDefinition | undefined =>
  levelRegistry.find((level) => level.id === id);

/** The first (default) playable level. Drives the initial boot flow. */
export const getFirstLevel = (): LevelDefinition => levelRegistry[0];

/** The next level after the given id, or undefined if none/last. */
export const getNextLevel = (id: LevelId): LevelDefinition | undefined => {
  const current = getLevel(id);

  if (!current || current.nextLevelId === null) {
    return undefined;
  }

  return getLevel(current.nextLevelId);
};
