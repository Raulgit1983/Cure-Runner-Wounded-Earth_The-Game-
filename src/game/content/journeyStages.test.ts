import { describe, expect, it } from 'vitest';

import { journeyStages, type JourneyStageKey } from './journeyStages';
import { STAGE_OVERLAY_COPY } from './overlayText';

/**
 * Guards the stage chain and the per-stage traits that replaced the old
 * `backdropKind === 'moonlight-mountain'` binaries. The point of these is that a
 * fourth world cannot be added by copy-paste and silently inherit Wounded
 * Planet's palette, ingredient or copy through an implicit `else`.
 */
describe('journey stage chain', () => {
  it('keeps the three runner stages, with a separate Chomper destination after the forest', () => {
    expect(journeyStages['wounded-planet'].nextStage).toBe('moonlight-mountain');
    expect(journeyStages['moonlight-mountain'].nextStage).toBe('black-forest');
    expect(journeyStages['black-forest'].nextStage).toBeNull();
    expect(journeyStages['black-forest'].nextEncounter).toBe('chomper');
    expect(journeyStages['wounded-planet'].nextEncounter).toBeUndefined();
    expect(journeyStages['moonlight-mountain'].nextEncounter).toBeUndefined();
  });

  it('has exactly one final stage', () => {
    const finals = Object.values(journeyStages).filter((stage) => stage.nextStage === null);

    expect(finals).toHaveLength(1);
    expect(finals[0]!.key).toBe('black-forest');
  });

  it('never points a stage at itself or at a missing stage', () => {
    Object.values(journeyStages).forEach((stage) => {
      if (stage.nextStage === null) {
        return;
      }

      expect(stage.nextStage).not.toBe(stage.key);
      expect(journeyStages[stage.nextStage]).toBeDefined();
    });
  });

  it('reaches every stage by walking the chain from the first one', () => {
    const seen = new Set<JourneyStageKey>();
    let cursor: JourneyStageKey | null = 'wounded-planet';

    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      cursor = journeyStages[cursor].nextStage;
    }

    expect(seen.size).toBe(Object.keys(journeyStages).length);
  });

  it('gives every stage its own key, backdrop and traits', () => {
    Object.entries(journeyStages).forEach(([key, stage]) => {
      expect(stage.key).toBe(key);
      expect(stage.backdropKind).toBe(key);
      expect(stage.traits).toBeDefined();
    });
  });

  it('uses the complete colour illustration on the Black Forest entry screen', () => {
    expect(journeyStages['black-forest'].entry.art.imageUrl).toContain(
      'black-forest-color-entry-v4'
    );
  });

  it('gives every stage its own overlay copy rather than a shared default', () => {
    const titles = Object.values(journeyStages).map(
      (stage) => STAGE_OVERLAY_COPY[stage.key].finishTitle
    );

    expect(new Set(titles).size).toBe(titles.length);

    Object.values(journeyStages).forEach((stage) => {
      const copy = STAGE_OVERLAY_COPY[stage.key];

      expect(copy.failTitle.length).toBeGreaterThan(0);
      expect(copy.failBody.length).toBeGreaterThan(0);
      expect(copy.finishLabel.length).toBeGreaterThan(0);
    });
  });

  it('gives every stage its own finish ingredient', () => {
    const ingredients = Object.values(journeyStages).map((stage) => stage.traits.ingredient);

    expect(new Set(ingredients).size).toBe(ingredients.length);
    // Black Forest's is an explicit placeholder, not Wounded Planet's Nota Sol.
    expect(journeyStages['black-forest'].traits.ingredient).toBe('pending-neutral');
  });

  it('keeps the moonlight second chance opt-in', () => {
    expect(journeyStages['moonlight-mountain'].traits.offersSecondChance).toBe(true);
    expect(journeyStages['wounded-planet'].traits.offersSecondChance).toBe(false);
    // Not inherited: enabling it for a new world is a difficulty decision.
    expect(journeyStages['black-forest'].traits.offersSecondChance).toBe(false);
  });

  it('only uses the phrase-driven shark intro where such a phrase exists', () => {
    Object.values(journeyStages).forEach((stage) => {
      if (stage.traits.sharkIntro !== 'phrase') {
        return;
      }

      expect(Object.keys(stage.runner.phrases)).toContain('onboarding_shark');
    });
  });
});
