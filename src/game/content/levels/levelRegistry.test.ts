import { describe, expect, it } from 'vitest';

import { journeyStages } from '@/game/content/journeyStages';
import { getFirstLevel, getLevel, getNextLevel, levelRegistry } from '@/game/content/levels/levelRegistry';

describe('levelRegistry', () => {
  it('boots into the wounded-planet stage by reference (no copy)', () => {
    const first = getFirstLevel();

    expect(first.id).toBe('w1-l1');
    expect(first.stageKey).toBe('wounded-planet');
    expect(first.stage).toBe(journeyStages['wounded-planet']);
  });

  it('every registered level points at an existing stage and unique id', () => {
    const ids = new Set<string>();

    for (const level of levelRegistry) {
      expect(ids.has(level.id), `duplicate level id "${level.id}"`).toBe(false);
      ids.add(level.id);
      expect(journeyStages[level.stageKey]).toBeDefined();
      expect(level.stage).toBe(journeyStages[level.stageKey]);
    }
  });

  it('level chain links resolve or terminate cleanly', () => {
    for (const level of levelRegistry) {
      if (level.nextLevelId !== null) {
        expect(getLevel(level.nextLevelId), `broken nextLevelId in "${level.id}"`).toBeDefined();
      }
    }

    expect(getNextLevel('w1-l1')).toBeUndefined();
    expect(getLevel('does-not-exist')).toBeUndefined();
  });
});
