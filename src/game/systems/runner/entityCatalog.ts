import type {
  CollectibleVariant,
  HazardVariant
} from '@/game/content/runnerPhrases';

/**
 * Pure entity metadata (labels, roles, hitbox sizes/offsets) shared by the
 * runner loop and by data-invariant tests. Keep this module Phaser-free so
 * fairness tests can read the real hitbox numbers without a browser runtime.
 */

export type LaneEntityRole = 'collectible' | 'hazard' | 'platform';

export interface EntityDefinition {
  label: string;
  role: LaneEntityRole;
  depth: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export const collectibleDefinitions: Record<CollectibleVariant, EntityDefinition> = {
  spark: { label: 'spark', role: 'collectible', depth: 4, width: 18, height: 18, offsetX: 0, offsetY: 0 },
  note: { label: 'note', role: 'collectible', depth: 4, width: 22, height: 30, offsetX: 0, offsetY: 0 },
  brush: { label: 'brush', role: 'collectible', depth: 4, width: 28, height: 18, offsetX: 0, offsetY: 0 }
} as const;

export const hazardDefinitions: Record<HazardVariant, EntityDefinition> = {
  sludge: { label: 'sludge', role: 'hazard', depth: 3.6, width: 34, height: 20, offsetX: -4, offsetY: -10 },
  warden: { label: 'warden', role: 'hazard', depth: 3.6, width: 30, height: 38, offsetX: 0, offsetY: -11 },
  hound: { label: 'hound', role: 'hazard', depth: 3.6, width: 36, height: 20, offsetX: 3, offsetY: -12 },
  shard: { label: 'shard', role: 'hazard', depth: 3.72, width: 36, height: 22, offsetX: 0, offsetY: -12 },
  mirror: { label: 'mirror', role: 'hazard', depth: 3.72, width: 28, height: 44, offsetX: 0, offsetY: -8 },
  crown: { label: 'crown', role: 'hazard', depth: 3.72, width: 42, height: 26, offsetX: 0, offsetY: -14 }
} as const;
