import { DEFAULT_CHARACTER_ID, isPlayableCharacterId, type PlayableCharacterId } from '@/game/content/playableCharacters';

/**
 * Deliberately a SEPARATE localStorage key from `localProgressStore`'s
 * `mateo.spark-journey.progress.v1`.
 *
 * Character choice is a preference, not run progress: `sessionState.restartRun()`
 * rebuilds the run state every retry, and "Inicio" calls `localProgressStore.clear()`
 * to wipe progress. Either would silently discard the choice if it lived in
 * `PersistentProgress`, so preferences get their own key and their own lifetime.
 */
const STORAGE_KEY = 'mateo.spark-journey.preferences.v1';

interface StoredPreferences {
  characterId: PlayableCharacterId;
}

export const localPreferenceStore = {
  /** Never throws and never returns an unknown id — always a playable default. */
  loadCharacterId(): PlayableCharacterId {
    if (typeof window === 'undefined') {
      return DEFAULT_CHARACTER_ID;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return DEFAULT_CHARACTER_ID;
      }

      const parsed = JSON.parse(raw) as Partial<StoredPreferences>;

      return isPlayableCharacterId(parsed.characterId) ? parsed.characterId : DEFAULT_CHARACTER_ID;
    } catch {
      return DEFAULT_CHARACTER_ID;
    }
  },

  saveCharacterId(characterId: PlayableCharacterId) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ characterId } satisfies StoredPreferences));
    } catch {
      // Storage can be unavailable (private mode, quota). The choice simply
      // does not persist; gameplay must not break because of it.
    }
  },

  clear() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }
};
