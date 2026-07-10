import type { DiscoveryBeatId } from '@/game/content/overlayText';

/**
 * Tracks which discovery beats have already been shown this browser session
 * (sessionStorage, not per-run — deliberately different from GuidanceDirector,
 * which resets every run). Phaser-free by design so it's directly unit
 * testable; DiscoveryFlow is the only caller.
 */

const DISCOVERY_SESSION_STORAGE_KEY = 'cure-runner.discovery-beats.v1';
let sessionCache: Set<DiscoveryBeatId> | null = null;

const getSessionCache = () => {
  if (sessionCache) {
    return sessionCache;
  }

  const fallback = new Set<DiscoveryBeatId>();

  if (typeof window === 'undefined') {
    sessionCache = fallback;
    return sessionCache;
  }

  try {
    const raw = window.sessionStorage.getItem(DISCOVERY_SESSION_STORAGE_KEY);

    if (!raw) {
      sessionCache = fallback;
      return sessionCache;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      sessionCache = fallback;
      return sessionCache;
    }

    sessionCache = new Set(parsed as DiscoveryBeatId[]);
    return sessionCache;
  } catch {
    sessionCache = fallback;
    return sessionCache;
  }
};

export const hasSeenDiscoveryBeat = (beatId: DiscoveryBeatId) => getSessionCache().has(beatId);

export const rememberDiscoveryBeat = (beatId: DiscoveryBeatId) => {
  const cache = getSessionCache();

  if (cache.has(beatId)) {
    return;
  }

  cache.add(beatId);

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(DISCOVERY_SESSION_STORAGE_KEY, JSON.stringify([...cache]));
  } catch {
    // Ignore storage failures and keep the in-memory session cache.
  }
};

export const forgetDiscoveryBeat = (beatId: DiscoveryBeatId) => {
  const cache = getSessionCache();

  if (!cache.delete(beatId) || typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(DISCOVERY_SESSION_STORAGE_KEY, JSON.stringify([...cache]));
  } catch {
    // Ignore storage failures and keep the in-memory session cache.
  }
};

/** Test-only: reset the in-memory cache so each test starts from a clean sessionStorage read. */
export const __resetDiscoverySessionCacheForTests = () => {
  sessionCache = null;
};
