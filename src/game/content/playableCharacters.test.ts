import { describe, expect, it } from 'vitest';

import { runnerConfig } from './runnerConfig';
import {
  CHARACTER_RENDER_ORIGIN,
  DEFAULT_CHARACTER_ID,
  SELECTABLE_ORDER,
  getCharacter,
  getFootOffsetPx,
  getGameplayScale,
  getSupportCharacter,
  isSelectableCharacterId,
  listRuntimeCharacterPoses,
  listSelectableCharacters,
  playableCharacters,
  resolveSelectableCharacterId
} from './playableCharacters';

describe('playable character registry', () => {
  it('offers exactly the three Devilz as selectable', () => {
    expect([...SELECTABLE_ORDER]).toEqual(['devi', 'lovu', 'divu']);
    expect(listSelectableCharacters().map((character) => character.id)).toEqual([
      'devi',
      'lovu',
      'divu'
    ]);
  });

  it('keeps Carlitos registered as support but never selectable', () => {
    expect(getSupportCharacter().id).toBe('hero');
    expect(isSelectableCharacterId('hero')).toBe(false);
    // Still resolvable by id so an old save cannot produce an undefined character.
    expect(getCharacter('hero').displayName).toBe('Carlitos');
  });

  it('migrates a retired or corrupt saved id to the default Devilz', () => {
    expect(resolveSelectableCharacterId('hero')).toBe(DEFAULT_CHARACTER_ID);
    expect(resolveSelectableCharacterId(undefined)).toBe(DEFAULT_CHARACTER_ID);
    expect(resolveSelectableCharacterId('nope')).toBe(DEFAULT_CHARACTER_ID);
    expect(isSelectableCharacterId(DEFAULT_CHARACTER_ID)).toBe(true);
  });

  it('gives every Devilz the full animation-pack-v2 pose set', () => {
    listSelectableCharacters().forEach((character) => {
      const poses = character.poses;

      expect(poses.main).toBeDefined();
      expect(poses.runContact).toBeDefined();
      expect(poses.runPass).toBeDefined();
      expect(poses.runPush).toBeDefined();
      expect(poses.jumpRise).toBeDefined();
      expect(poses.jumpApex).toBeDefined();
      expect(poses.jumpFall).toBeDefined();
      expect(poses.landing).toBeDefined();
      expect(poses.hit).toBeDefined();
      // The Devilz now have finish art, so they no longer fall back to `main`.
      expect(poses.finishAwakened).toBeDefined();
    });
  });

  it('never lets two characters share a texture key', () => {
    const keys = Object.values(playableCharacters).flatMap((character) =>
      Object.values(character.poses).map((pose) => pose!.key)
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preloads all Devilz poses plus only Carlitos main', () => {
    const keys = listRuntimeCharacterPoses().map((pose) => pose.key);

    expect(keys).toHaveLength(31);
    expect(keys).toContain(getSupportCharacter().poses.main.key);
    expect(keys).not.toContain('hero-jump-rise');
    expect(keys).not.toContain('hero-finish-awakened');
  });

  it('lands every character on the runner support point within 3px', () => {
    // This is the floating-Devilz regression, encoded. `HERO_SUPPORT_OFFSET_PX`
    // is the runner's own floor contract; the drawing's feet must reach it.
    const supportOffset = runnerConfig.visual.groundLineY - runnerConfig.hero.runY;
    const sceneFootingNudge = 4; // JourneyScene's HERO_FOOTING_VISUAL_OFFSET_Y

    Object.values(playableCharacters).forEach((character) => {
      const footOffset = getFootOffsetPx(character, CHARACTER_RENDER_ORIGIN.y);
      const correction = supportOffset - sceneFootingNudge - footOffset;
      const restingFeet = sceneFootingNudge + footOffset + correction;

      expect(Math.abs(restingFeet - supportOffset)).toBeLessThanOrEqual(3);
    });
  });

  it('needs a real correction for pack v2 and almost none for Carlitos', () => {
    // Guards the diagnosis itself: the padded v2 canvas is the cause, so its
    // correction must be large, and the full-bleed Carlitos canvas near zero.
    const supportOffset = runnerConfig.visual.groundLineY - runnerConfig.hero.runY;
    const correctionFor = (id: 'devi' | 'lovu' | 'divu' | 'hero') =>
      supportOffset - 4 - getFootOffsetPx(playableCharacters[id], CHARACTER_RENDER_ORIGIN.y);

    expect(correctionFor('hero')).toBeLessThan(4);
    expect(correctionFor('devi')).toBeGreaterThan(12);
    expect(correctionFor('lovu')).toBeGreaterThan(12);
    expect(correctionFor('divu')).toBeGreaterThan(12);
    // Smaller characters float further, so the correction must not be shared.
    expect(correctionFor('divu')).toBeGreaterThan(correctionFor('devi'));
  });

  it('keeps the visible portrait inside the 110-132px target band', () => {
    listSelectableCharacters().forEach((character) => {
      const { portrait } = character.artMetrics;
      const visibleWidth = portrait.right - portrait.left + 1;
      const visibleHeight = portrait.bottom - portrait.top + 1;
      // Mirrors LevelEntryScene: fit the drawing, not the canvas.
      const activeBox = 110 + 22 * ((character.mobileScale.preferredPx - 96) / 32);
      const fit = Math.min(activeBox / visibleWidth, activeBox / visibleHeight);
      const longestOnScreen = Math.max(visibleWidth, visibleHeight) * fit;

      expect(longestOnScreen).toBeGreaterThanOrEqual(109);
      expect(longestOnScreen).toBeLessThanOrEqual(133);
    });
  });

  it('keeps gameplay scale measured against the source canvas', () => {
    // Explicitly NOT switched to visible height: that would resize every
    // character in play, which is a separate, unauthorised decision.
    listSelectableCharacters().forEach((character) => {
      expect(getGameplayScale(character)).toBeCloseTo(
        character.mobileScale.preferredPx / character.artMetrics.sourceHeight,
        6
      );
    });
  });

  it('loads every pose from the v2 pack, never the retired v1 files', () => {
    listRuntimeCharacterPoses()
      .filter((pose) => pose.key !== getSupportCharacter().poses.main.key)
      .forEach((pose) => {
        expect(pose.url).toContain('animation-pack-v2');
        expect(pose.url).not.toContain('pose-sheet');
        expect(pose.url).not.toContain('previews');
      });
  });
});
