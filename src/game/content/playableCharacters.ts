// Animation pack v2 — ten poses per Devilz, 512x512 WebP RGBA, shared origin
// (0.5, 0.58). These live under `animation-pack-v2/` and are imported by NEW
// paths on purpose: the original `src/assets/devilz/*.webp` line-art files stay
// on disk untouched, they simply stop being referenced.
import deviFinishAwakenedUrl from '@/assets/devilz/animation-pack-v2/devi/devi-finish-awakened.webp';
import deviHitStaggerUrl from '@/assets/devilz/animation-pack-v2/devi/devi-hit-stagger.webp';
import deviJumpApexUrl from '@/assets/devilz/animation-pack-v2/devi/devi-jump-apex.webp';
import deviJumpFallUrl from '@/assets/devilz/animation-pack-v2/devi/devi-jump-fall.webp';
import deviJumpRiseUrl from '@/assets/devilz/animation-pack-v2/devi/devi-jump-rise.webp';
import deviLandingCompressUrl from '@/assets/devilz/animation-pack-v2/devi/devi-landing-compress.webp';
import deviMainUrl from '@/assets/devilz/animation-pack-v2/devi/devi-main.webp';
import deviRunContactUrl from '@/assets/devilz/animation-pack-v2/devi/devi-run-contact.webp';
import deviRunPassUrl from '@/assets/devilz/animation-pack-v2/devi/devi-run-pass.webp';
import deviRunPushUrl from '@/assets/devilz/animation-pack-v2/devi/devi-run-push.webp';
import divuFinishAwakenedUrl from '@/assets/devilz/animation-pack-v2/divu/divu-finish-awakened.webp';
import divuHitStaggerUrl from '@/assets/devilz/animation-pack-v2/divu/divu-hit-stagger.webp';
import divuJumpApexUrl from '@/assets/devilz/animation-pack-v2/divu/divu-jump-apex.webp';
import divuJumpFallUrl from '@/assets/devilz/animation-pack-v2/divu/divu-jump-fall.webp';
import divuJumpRiseUrl from '@/assets/devilz/animation-pack-v2/divu/divu-jump-rise.webp';
import divuLandingCompressUrl from '@/assets/devilz/animation-pack-v2/divu/divu-landing-compress.webp';
import divuMainUrl from '@/assets/devilz/animation-pack-v2/divu/divu-main.webp';
import divuRunContactUrl from '@/assets/devilz/animation-pack-v2/divu/divu-run-contact.webp';
import divuRunPassUrl from '@/assets/devilz/animation-pack-v2/divu/divu-run-pass.webp';
import divuRunPushUrl from '@/assets/devilz/animation-pack-v2/divu/divu-run-push.webp';
import lovuFinishAwakenedUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-finish-awakened.webp';
import lovuHitStaggerUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-hit-stagger.webp';
import lovuJumpApexUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-jump-apex.webp';
import lovuJumpFallUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-jump-fall.webp';
import lovuJumpRiseUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-jump-rise.webp';
import lovuLandingCompressUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-landing-compress.webp';
import lovuMainUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-main.webp';
import lovuRunContactUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-run-contact.webp';
import lovuRunPassUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-run-pass.webp';
import lovuRunPushUrl from '@/assets/devilz/animation-pack-v2/lovu/lovu-run-push.webp';
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
 * `main` is the only required pose — it doubles as the resting pose and the
 * final fallback. Every optional pose is guarded by `textures.exists()` at
 * switch time, so a character that ships without part of the set degrades to
 * `main` instead of breaking the switcher.
 *
 * The three run frames drive one looping animation
 * (`contact -> pass -> push -> pass`, 10 fps); the rest are single frames
 * chosen by the pose switcher.
 */
export interface CharacterPoseSet {
  main: CharacterPose;
  runContact?: CharacterPose;
  runPass?: CharacterPose;
  runPush?: CharacterPose;
  jumpRise?: CharacterPose;
  jumpApex?: CharacterPose;
  jumpFall?: CharacterPose;
  landing?: CharacterPose;
  hit?: CharacterPose;
  finishAwakened?: CharacterPose;
}

/**
 * Where the drawing actually is inside its source canvas, measured once offline
 * from the alpha channel and committed as data.
 *
 * This exists because the two canvases in play are not comparable. Alfredito'
 * art is cropped tight (512x458, full-bleed), while animation pack v2 uses a
 * padded 512x512 canvas with ~85px of transparency below the character. Sizing
 * or footing a sprite by its canvas therefore draws pack-v2 characters too
 * small AND floating above the floor — which is exactly what happened.
 *
 * Everything that needs "how big is the drawing" or "where are its feet" must
 * read these numbers, never `texture.height`.
 */
export interface CharacterArtMetrics {
  sourceWidth: number;
  sourceHeight: number;
  /** Alpha bounds of the `main` pose. Drives portrait size + centring. */
  portrait: { left: number; top: number; right: number; bottom: number };
  /**
   * Texture row the feet rest on in the grounded frames (the three run frames
   * and landing-compress, which the pack authors to one shared baseline).
   * Air poses deliberately differ — that vertical travel is the animation.
   */
  groundedBaselineRow: number;
}

export interface PlayableCharacter {
  id: PlayableCharacterId;
  /** Shown in the entry-screen carousel. Spanish-first, like the rest of the UI copy. */
  displayName: string;
  poses: CharacterPoseSet;
  artMetrics: CharacterArtMetrics;
  /**
   * Drives `baseHeroScale` (preferredPx / texture height) so characters drawn
   * at different source resolutions still read at a comparable on-screen size,
   * and sizes the carousel portrait.
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
 * anchor (animation pack v2 restates it in its manifest), so there are
 * deliberately no per-character origin overrides.
 */
export const CHARACTER_RENDER_ORIGIN = heroProfile.renderOrigin;

/**
 * Alfredito is NOT selectable any more. He stays registered so old saved
 * preferences resolve without throwing, and so his `main` texture is available
 * for "El Latido de Alfredito" — the visual form of the existing reserve.
 */
export const SUPPORT_CHARACTER_ID: PlayableCharacterId = 'hero';
export const SUPPORT_POWER_NAME = 'El Latido de Alfredito';

export const DEFAULT_CHARACTER_ID: PlayableCharacterId = 'devi';

// v2 texture keys are suffixed so they can never silently mix with the v1 keys
// named in `devilzProfiles.ts` (whose art is still on disk but no longer
// loaded). `devilzProfiles` remains the source of truth for display names,
// mobile scale and silhouette rules.
const deviPoses: CharacterPoseSet = {
  main: { key: 'devi-v2-main', url: deviMainUrl },
  runContact: { key: 'devi-v2-run-contact', url: deviRunContactUrl },
  runPass: { key: 'devi-v2-run-pass', url: deviRunPassUrl },
  runPush: { key: 'devi-v2-run-push', url: deviRunPushUrl },
  jumpRise: { key: 'devi-v2-jump-rise', url: deviJumpRiseUrl },
  jumpApex: { key: 'devi-v2-jump-apex', url: deviJumpApexUrl },
  jumpFall: { key: 'devi-v2-jump-fall', url: deviJumpFallUrl },
  landing: { key: 'devi-v2-landing-compress', url: deviLandingCompressUrl },
  hit: { key: 'devi-v2-hit-stagger', url: deviHitStaggerUrl },
  finishAwakened: { key: 'devi-v2-finish-awakened', url: deviFinishAwakenedUrl }
};

const lovuPoses: CharacterPoseSet = {
  main: { key: 'lovu-v2-main', url: lovuMainUrl },
  runContact: { key: 'lovu-v2-run-contact', url: lovuRunContactUrl },
  runPass: { key: 'lovu-v2-run-pass', url: lovuRunPassUrl },
  runPush: { key: 'lovu-v2-run-push', url: lovuRunPushUrl },
  jumpRise: { key: 'lovu-v2-jump-rise', url: lovuJumpRiseUrl },
  jumpApex: { key: 'lovu-v2-jump-apex', url: lovuJumpApexUrl },
  jumpFall: { key: 'lovu-v2-jump-fall', url: lovuJumpFallUrl },
  landing: { key: 'lovu-v2-landing-compress', url: lovuLandingCompressUrl },
  hit: { key: 'lovu-v2-hit-stagger', url: lovuHitStaggerUrl },
  finishAwakened: { key: 'lovu-v2-finish-awakened', url: lovuFinishAwakenedUrl }
};

const divuPoses: CharacterPoseSet = {
  main: { key: 'divu-v2-main', url: divuMainUrl },
  runContact: { key: 'divu-v2-run-contact', url: divuRunContactUrl },
  runPass: { key: 'divu-v2-run-pass', url: divuRunPassUrl },
  runPush: { key: 'divu-v2-run-push', url: divuRunPushUrl },
  jumpRise: { key: 'divu-v2-jump-rise', url: divuJumpRiseUrl },
  jumpApex: { key: 'divu-v2-jump-apex', url: divuJumpApexUrl },
  jumpFall: { key: 'divu-v2-jump-fall', url: divuJumpFallUrl },
  landing: { key: 'divu-v2-landing-compress', url: divuLandingCompressUrl },
  hit: { key: 'divu-v2-hit-stagger', url: divuHitStaggerUrl },
  finishAwakened: { key: 'divu-v2-finish-awakened', url: divuFinishAwakenedUrl }
};

/**
 * Registry of characters. `heroProfile` / `devilzProfiles` stay the source of
 * truth for their numbers; this wraps them behind a shared shape so the scene
 * can drive pose switching, run animation, scale and preload from one place.
 */
export const playableCharacters: Record<PlayableCharacterId, PlayableCharacter> = {
  devi: {
    id: 'devi',
    displayName: devilzProfiles.devi.displayName,
    poses: deviPoses,
    artMetrics: {
      sourceWidth: 512,
      sourceHeight: 512,
      portrait: { left: 73, top: 61, right: 444, bottom: 430 },
      groundedBaselineRow: 424
    },
    mobileScale: devilzProfiles.devi.mobileScale
  },

  lovu: {
    id: 'lovu',
    displayName: devilzProfiles.lovu.displayName,
    poses: lovuPoses,
    artMetrics: {
      sourceWidth: 512,
      sourceHeight: 512,
      portrait: { left: 76, top: 57, right: 450, bottom: 433 },
      groundedBaselineRow: 424
    },
    mobileScale: devilzProfiles.lovu.mobileScale
  },

  divu: {
    id: 'divu',
    displayName: devilzProfiles.divu.displayName,
    poses: divuPoses,
    artMetrics: {
      sourceWidth: 512,
      sourceHeight: 512,
      portrait: { left: 65, top: 60, right: 468, bottom: 437 },
      groundedBaselineRow: 425
    },
    mobileScale: devilzProfiles.divu.mobileScale
  },

  // Alfredito is the shared reserve form, never a fourth carousel choice.
  // Boot keeps only the resting pose; reserveArt loads the existing jump, hit
  // and finish poses lazily with JourneyScene.
  hero: {
    id: 'hero',
    displayName: 'Alfredito',
    poses: {
      main: { key: heroProfile.textureKey, url: heroMainUrl }
    },
    // Alfredito's art is cropped tight to its canvas (512x458, no padding), which
    // is precisely why footing worked for him and broke for pack v2.
    artMetrics: {
      sourceWidth: 512,
      sourceHeight: 458,
      portrait: { left: 0, top: 0, right: 511, bottom: 457 },
      groundedBaselineRow: 457
    },
    mobileScale: heroProfile.mobileScale
  }
};

/**
 * On-screen scale for gameplay. Deliberately still measured against the source
 * canvas height, NOT the visible height: changing it would resize every
 * character in play, which is a gameplay-readability decision (the hitbox is
 * fixed at 62x96) and is not part of the footing fix.
 */
export const getGameplayScale = (character: PlayableCharacter) =>
  character.mobileScale.preferredPx / character.artMetrics.sourceHeight;

/**
 * How far below the sprite's anchor the character's feet are drawn, in on-screen
 * pixels, for the grounded frames.
 */
export const getFootOffsetPx = (character: PlayableCharacter, renderOriginY: number) => {
  const metrics = character.artMetrics;
  const anchorRow = renderOriginY * metrics.sourceHeight;

  return (metrics.groundedBaselineRow - anchorRow) * getGameplayScale(character);
};

/** The only three characters a player can choose. Carousel order. */
export const SELECTABLE_ORDER: readonly PlayableCharacterId[] = ['devi', 'lovu', 'divu'];

export const isPlayableCharacterId = (value: unknown): value is PlayableCharacterId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(playableCharacters, value);

export const isSelectableCharacterId = (value: unknown): value is PlayableCharacterId =>
  typeof value === 'string' && SELECTABLE_ORDER.includes(value as PlayableCharacterId);

/** Always resolves to a real character — an unknown id falls back to the default. */
export const getCharacter = (id: string | undefined): PlayableCharacter =>
  isPlayableCharacterId(id) ? playableCharacters[id] : playableCharacters[DEFAULT_CHARACTER_ID];

/**
 * Safe migration for saved preferences: anything that is not one of the three
 * Devilz (including the retired `hero`, and corrupt values) resolves to the
 * default Devilz. Never throws, never clears anything.
 */
export const resolveSelectableCharacterId = (id: string | undefined): PlayableCharacterId =>
  isSelectableCharacterId(id) ? id : DEFAULT_CHARACTER_ID;

export const listSelectableCharacters = (): PlayableCharacter[] =>
  SELECTABLE_ORDER.map((id) => playableCharacters[id]);

export const getSupportCharacter = (): PlayableCharacter => playableCharacters[SUPPORT_CHARACTER_ID];

/** Boot loads the three Devilz and Alfredito's rest pose; runner loads his other poses. */
export const listRuntimeCharacterPoses = (): CharacterPose[] => [
  ...listSelectableCharacters().flatMap((character) =>
    Object.values(character.poses).filter((pose): pose is CharacterPose => Boolean(pose))
  ),
  getSupportCharacter().poses.main
];
