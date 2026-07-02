import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { localProgressStore } from '@/game/services/persistence/localProgressStore';

const STORAGE_KEY = 'mateo.spark-journey.progress.v1';

describe('localProgressStore', () => {
  let backing: Map<string, string>;

  beforeEach(() => {
    backing = new Map<string, string>();

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => backing.get(key) ?? null,
        setItem: (key: string, value: string) => {
          backing.set(key, value);
        },
        removeItem: (key: string) => {
          backing.delete(key);
        }
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty progress when nothing is stored', () => {
    expect(localProgressStore.load()).toEqual({});
  });

  it('round-trips progress through save/load', () => {
    localProgressStore.save({ awakeningLevel: 0.42, collectedSparks: 37 });

    expect(localProgressStore.load()).toEqual({
      awakeningLevel: 0.42,
      collectedSparks: 37
    });
  });

  it('clamps and floors values on both save and load', () => {
    localProgressStore.save({ awakeningLevel: 3.2, collectedSparks: 12.9 });

    expect(localProgressStore.load()).toEqual({
      awakeningLevel: 1,
      collectedSparks: 12
    });

    backing.set(STORAGE_KEY, JSON.stringify({ awakeningLevel: -1, collectedSparks: -50 }));

    expect(localProgressStore.load()).toEqual({
      awakeningLevel: 0,
      collectedSparks: 0
    });
  });

  it('survives corrupted storage without throwing', () => {
    backing.set(STORAGE_KEY, '{not json');

    expect(localProgressStore.load()).toEqual({});
  });

  it('clear removes the stored progress', () => {
    localProgressStore.save({ awakeningLevel: 0.5, collectedSparks: 10 });
    localProgressStore.clear();

    expect(backing.has(STORAGE_KEY)).toBe(false);
    expect(localProgressStore.load()).toEqual({});
  });
});
