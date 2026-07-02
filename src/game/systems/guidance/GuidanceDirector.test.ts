import { beforeEach, describe, expect, it } from 'vitest';

import {
  GuidanceDirector,
  guidanceKeys,
  type GuidanceKey
} from '@/game/systems/guidance/GuidanceDirector';

describe('GuidanceDirector', () => {
  let director: GuidanceDirector;

  beforeEach(() => {
    director = new GuidanceDirector();
  });

  it('starts a run with no guidance shown', () => {
    for (const key of guidanceKeys) {
      expect(director.hasShown(key), `"${key}" must start unshown`).toBe(false);
    }
  });

  it('markShown records a guide and is idempotent', () => {
    director.markShown('jump_intro');

    expect(director.hasShown('jump_intro')).toBe(true);

    director.markShown('jump_intro');

    expect(director.hasShown('jump_intro')).toBe(true);
  });

  it('showOnce consumes a guide exactly once', () => {
    expect(director.showOnce('notes_intro')).toBe(true);
    expect(director.hasShown('notes_intro')).toBe(true);
    expect(director.showOnce('notes_intro')).toBe(false);
    expect(director.showOnce('notes_intro')).toBe(false);
  });

  it('keys are independent — marking one never leaks into another', () => {
    director.markShown('hazard_intro');

    expect(director.hasShown('hazard_intro')).toBe(true);
    expect(director.hasShown('shark_sighting')).toBe(false);
    expect(director.hasShown('shark_catch')).toBe(false);
    expect(director.showOnce('reserve_gain')).toBe(true);
  });

  it('reset forgets everything for the next run', () => {
    for (const key of guidanceKeys) {
      director.markShown(key);
    }

    director.reset();

    for (const key of guidanceKeys) {
      expect(director.hasShown(key), `"${key}" must be unshown after reset`).toBe(false);
      expect(director.showOnce(key), `"${key}" must be consumable again after reset`).toBe(true);
    }
  });

  it('the table has no duplicate keys', () => {
    expect(new Set<GuidanceKey>(guidanceKeys).size).toBe(guidanceKeys.length);
  });

  it('covers the 13 guidance moments the old booleans latched', () => {
    // One entry per replaced *GuidanceShown boolean — if a key is added or
    // removed, this list (and the scene call sites) must move together.
    expect([...guidanceKeys].sort()).toEqual(
      [
        'stage_intro',
        'stage_beat',
        'stage_surface',
        'jump_intro',
        'double_jump_intro',
        'upper_route_intro',
        'notes_intro',
        'hazard_intro',
        'reserve_hint',
        'reserve_gain',
        'reserve_spent',
        'shark_sighting',
        'shark_catch'
      ].sort()
    );
  });

  it('supports the shark director dual-role reads (query without consuming)', () => {
    // hasShown must never mutate: the shark trigger logic polls these every
    // frame and the guides must still be consumable afterwards.
    expect(director.hasShown('hazard_intro')).toBe(false);
    expect(director.hasShown('shark_sighting')).toBe(false);
    expect(director.showOnce('hazard_intro')).toBe(true);
    expect(director.showOnce('shark_sighting')).toBe(true);
  });
});
