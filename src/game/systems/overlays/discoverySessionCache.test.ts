import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'cure-runner.discovery-beats.v1';

describe('discoverySessionCache', () => {
  let backing: Map<string, string>;

  beforeEach(() => {
    backing = new Map<string, string>();

    vi.stubGlobal('window', {
      sessionStorage: {
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
    vi.resetModules();
  });

  it('starts with no beat seen', async () => {
    const { hasSeenDiscoveryBeat } = await import('@/game/systems/overlays/discoverySessionCache');

    expect(hasSeenDiscoveryBeat('jump_intro')).toBe(false);
  });

  it('remembers a beat and persists it to sessionStorage', async () => {
    const { hasSeenDiscoveryBeat, rememberDiscoveryBeat } = await import(
      '@/game/systems/overlays/discoverySessionCache'
    );

    rememberDiscoveryBeat('notes_intro');

    expect(hasSeenDiscoveryBeat('notes_intro')).toBe(true);
    expect(JSON.parse(backing.get(STORAGE_KEY)!)).toEqual(['notes_intro']);
  });

  it('remembering twice is idempotent', async () => {
    const { rememberDiscoveryBeat } = await import('@/game/systems/overlays/discoverySessionCache');

    rememberDiscoveryBeat('hazard_intro');
    rememberDiscoveryBeat('hazard_intro');

    expect(JSON.parse(backing.get(STORAGE_KEY)!)).toEqual(['hazard_intro']);
  });

  it('forgets a beat and persists the removal', async () => {
    const { hasSeenDiscoveryBeat, rememberDiscoveryBeat, forgetDiscoveryBeat } = await import(
      '@/game/systems/overlays/discoverySessionCache'
    );

    rememberDiscoveryBeat('shark_catch');
    forgetDiscoveryBeat('shark_catch');

    expect(hasSeenDiscoveryBeat('shark_catch')).toBe(false);
    expect(JSON.parse(backing.get(STORAGE_KEY)!)).toEqual([]);
  });

  it('forgetting a beat that was never seen is a no-op', async () => {
    const { forgetDiscoveryBeat } = await import('@/game/systems/overlays/discoverySessionCache');

    forgetDiscoveryBeat('reserve_gain');

    expect(backing.has(STORAGE_KEY)).toBe(false);
  });

  it('loads pre-existing sessionStorage state on first read', async () => {
    backing.set(STORAGE_KEY, JSON.stringify(['jump_intro', 'shark_sighting']));

    const { hasSeenDiscoveryBeat } = await import('@/game/systems/overlays/discoverySessionCache');

    expect(hasSeenDiscoveryBeat('jump_intro')).toBe(true);
    expect(hasSeenDiscoveryBeat('shark_sighting')).toBe(true);
    expect(hasSeenDiscoveryBeat('reserve_hint')).toBe(false);
  });

  it('survives corrupted sessionStorage without throwing', async () => {
    backing.set(STORAGE_KEY, '{not json');

    const { hasSeenDiscoveryBeat, rememberDiscoveryBeat } = await import(
      '@/game/systems/overlays/discoverySessionCache'
    );

    expect(hasSeenDiscoveryBeat('jump_intro')).toBe(false);
    expect(() => rememberDiscoveryBeat('jump_intro')).not.toThrow();
  });

  it('ignores a non-array sessionStorage value', async () => {
    backing.set(STORAGE_KEY, JSON.stringify({ not: 'an array' }));

    const { hasSeenDiscoveryBeat } = await import('@/game/systems/overlays/discoverySessionCache');

    expect(hasSeenDiscoveryBeat('jump_intro')).toBe(false);
  });

  it('caches in-memory after the first read, ignoring later sessionStorage edits', async () => {
    const { hasSeenDiscoveryBeat, rememberDiscoveryBeat } = await import(
      '@/game/systems/overlays/discoverySessionCache'
    );

    rememberDiscoveryBeat('reserve_spent');
    backing.set(STORAGE_KEY, JSON.stringify([]));

    expect(hasSeenDiscoveryBeat('reserve_spent')).toBe(true);
  });
});
