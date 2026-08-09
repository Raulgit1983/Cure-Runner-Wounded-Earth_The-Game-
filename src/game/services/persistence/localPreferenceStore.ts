import {
  DEFAULT_CHARACTER_ID,
  resolveSelectableCharacterId,
  type PlayableCharacterId
} from '@/game/content/playableCharacters';

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
  /**
   * Never throws and never returns an id that cannot be played.
   *
   * Migration: `hero` (Carlitos) used to be a valid stored choice and is now a
   * support power rather than a playable character. A save that still names him
   * — like any unknown or corrupt value — resolves to the default Devilz here.
   * Nothing is deleted or rewritten: no other preference and no progress is
   * touched, and the stale value is simply ignored until the player picks again.
   */
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

      return resolveSelectableCharacterId(parsed.characterId);
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
