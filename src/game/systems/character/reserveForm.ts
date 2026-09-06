import { getSupportCharacter, type PlayableCharacter } from '@/game/content/playableCharacters';

/** No clock or mechanics: the existing held-reserve count alone selects the form. */
export const reserveForm = (selected: PlayableCharacter, reserves: number): PlayableCharacter =>
  reserves > 0 ? getSupportCharacter() : selected;
