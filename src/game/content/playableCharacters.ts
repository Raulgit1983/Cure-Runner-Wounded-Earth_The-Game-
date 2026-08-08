import deviHitStaggerUrl from '@/assets/devilz/devi-hit-stagger.webp';
import deviJumpFallUrl from '@/assets/devilz/devi-jump-fall.webp';
import deviJumpRiseUrl from '@/assets/devilz/devi-jump-rise.webp';
import deviMainUrl from '@/assets/devilz/devi-main.webp';
import divuHitStaggerUrl from '@/assets/devilz/divu-hit-stagger.webp';
import divuJumpFallUrl from '@/assets/devilz/divu-jump-fall.webp';
import divuJumpRiseUrl from '@/assets/devilz/divu-jump-rise.webp';
import divuMainUrl from '@/assets/devilz/divu-main.webp';
import lovuHitStaggerUrl from '@/assets/devilz/lovu-hit-stagger.webp';
import lovuJumpFallUrl from '@/assets/devilz/lovu-jump-fall.webp';
import lovuJumpRiseUrl from '@/assets/devilz/lovu-jump-rise.webp';
import lovuMainUrl from '@/assets/devilz/lovu-main.webp';
import heroFinishAwakenedUrl from '@/assets/hero/hero-finish-awakened.webp';
import heroHitStaggerUrl from '@/assets/hero/hero-hit-stagger.webp';
import heroJumpFallUrl from '@/assets/hero/hero-jump-fall.webp';
import heroJumpRiseUrl from '@/assets/hero/hero-jump-rise.webp';
import heroMainUrl from '@/assets/hero/hero-main.webp';

import { devilzProfiles } from './devilzProfiles';
import { heroProfile } from './heroProfile';

/**
 * One loadable pose: the Phaser texture key plus the bundled asset URL, so
 * BootScene can preload every character by walking this registry instead of
 * hardcoding one `load.image` line per file.
 */
export interface CharacterPose {
  key: string;
  url: string;
}

/**
 * `main` is the only required pose — it doubles as the grounded pose and the
 * final fallback. Every optional pose is guarded by `textures.exists()` at
 * switch time, so a character that ships without `finishAwakened` (or without
 * air poses) degrades to `main` instead of breaking the switcher.
 */
export interface CharacterPoseSet {
  main: CharacterPose;
  hit?: CharacterPose;
  jumpRise?: CharacterPose;
  jumpFall?: CharacterPose;
  finishAwakened?: CharacterPose;
}

export interface PlayableCharacter {
  id: PlayableCharacterId;
  /** Shown in the entry-screen picker. Spanish-first, like the rest of the UI copy. */
  displayName: string;
  poses: CharacterPoseSet;
  /**
   * Drives `baseHeroScale` (preferredPx / texture height) so characters drawn
   * at different source resolutions still read at a comparable on-screen size.
   * This is the ONLY per-character gameplay-adjacent value — jump physics,
   * gravity, timing and the collect radius are shared by every character.
   */
  mobileScale: {
    minPx: number;
    preferredPx: number;
    maxPx: number;
  };
}

export type PlayableCharacterId = 'hero' | 'devi' | 'lovu' | 'divu';

/**
 * Shared by every character on purpose — pose art is authored against this one
 * anchor, so there are deliberately no per-character origin overrides.
 * Sourced from `heroProfile` to keep a single truth.
 */
export const CHARACTER_RENDER_ORIGIN = heroProfile.renderOrigin;

export const DEFAULT_CHARACTER_ID: PlayableCharacterId = 'hero';

/**
 * Registry of playable characters. `heroProfile` stays the source of truth for
 * the original hero's numbers; this wraps it behind a shared shape so the
 * scene can drive pose switching, scale and preload from one place.
 */
export const playableCharacters: Record<PlayableCharacterId, PlayableCharacter> = {
  hero: {
    id: 'hero',
    displayName: 'Carlitos',
    poses: {
      main: { key: heroProfile.textureKey, url: heroMainUrl },
      hit: { key: 'hero-hit-stagger', url: heroHitStaggerUrl },
      jumpRise: { key: 'hero-jump-rise', url: heroJumpRiseUrl },
      jumpFall: { key: 'hero-jump-fall', url: heroJumpFallUrl },
      finishAwakened: { key: 'hero-finish-awakened', url: heroFinishAwakenedUrl }
    },
    mobileScale: heroProfile.mobileScale
  },

  // The three Devilz ship with four poses each and NO finish-awakened art.
  // `devilzProfiles.ts` names a `finish` key for each of them, but no such file
  // exists on disk — so `finishAwakened` is deliberately left unset here rather
  // than registered with a URL that cannot resolve. The switcher's
  // `textures.exists()` guard then falls straight through to `main`, which is
  // the documented intent (see devilzProfiles.ts:15).
  devi: {
    id: 'devi',
    displayName: devilzProfiles.devi.displayName,
    poses: {
      main: { key: devilzProfiles.devi.textureKey, url: deviMainUrl },
      hit: { key: devilzProfiles.devi.poseTextureKeys.hit, url: deviHitStaggerUrl },
      jumpRise: { key: devilzProfiles.devi.poseTextureKeys.airRise, url: deviJumpRiseUrl },
      jumpFall: { key: devilzProfiles.devi.poseTextureKeys.airFall, url: deviJumpFallUrl }
    },
    mobileScale: devilzProfiles.devi.mobileScale
  },

  lovu: {
    id: 'lovu',
    displayName: devilzProfiles.lovu.displayName,
    poses: {
      main: { key: devilzProfiles.lovu.textureKey, url: lovuMainUrl },
      hit: { key: devilzProfiles.lovu.poseTextureKeys.hit, url: lovuHitStaggerUrl },
      jumpRise: { key: devilzProfiles.lovu.poseTextureKeys.airRise, url: lovuJumpRiseUrl },
      jumpFall: { key: devilzProfiles.lovu.poseTextureKeys.airFall, url: lovuJumpFallUrl }
    },
    mobileScale: devilzProfiles.lovu.mobileScale
  },

  divu: {
    id: 'divu',
    displayName: devilzProfiles.divu.displayName,
    poses: {
      main: { key: devilzProfiles.divu.textureKey, url: divuMainUrl },
      hit: { key: devilzProfiles.divu.poseTextureKeys.hit, url: divuHitStaggerUrl },
      jumpRise: { key: devilzProfiles.divu.poseTextureKeys.airRise, url: divuJumpRiseUrl },
      jumpFall: { key: devilzProfiles.divu.poseTextureKeys.airFall, url: divuJumpFallUrl }
    },
    mobileScale: devilzProfiles.divu.mobileScale
  }
};

/** Picker order: the original hero first (the default), then the Devilz. */
export const PLAYABLE_ORDER: readonly PlayableCharacterId[] = ['hero', 'devi', 'lovu', 'divu'];

export const isPlayableCharacterId = (value: unknown): value is PlayableCharacterId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(playableCharacters, value);

/** Always resolves to a real character — an unknown id falls back to the default. */
export const getCharacter = (id: string | undefined): PlayableCharacter =>
  (isPlayableCharacterId(id) ? playableCharacters[id] : playableCharacters[DEFAULT_CHARACTER_ID]);

export const listPlayableCharacters = (): PlayableCharacter[] =>
  PLAYABLE_ORDER.map((id) => playableCharacters[id]);

/** Every pose across every character, for BootScene's preload loop. */
export const listAllCharacterPoses = (): CharacterPose[] =>
  listPlayableCharacters().flatMap((character) =>
    Object.values(character.poses).filter((pose): pose is CharacterPose => Boolean(pose))
  );
