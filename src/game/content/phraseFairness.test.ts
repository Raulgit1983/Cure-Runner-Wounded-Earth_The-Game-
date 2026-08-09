import { describe, expect, it } from 'vitest';

import {
  journeyStages,
  type JourneyStageDefinition,
  type JourneyStageKey
} from '@/game/content/journeyStages';
import { runnerConfig } from '@/game/content/runnerConfig';
import type {
  CollectiblePhraseItem,
  HazardPhraseItem,
  PlatformPhraseItem,
  RunnerPhrase
} from '@/game/content/runnerPhrases';
import { hazardDefinitions } from '@/game/systems/runner/entityCatalog';

/**
 * Data-invariant tests that encode docs/memory/gameplay-fairness-rules.md.
 * They run against the REAL phrase data, hitboxes and jump physics, so any
 * future phrase authoring that breaks a fairness rule fails here instead of
 * on Mateo's phone.
 *
 * Screen-y convention: lower y = higher on screen. `item.y` is height above
 * the ground line (`runnerConfig.visual.groundLineY`).
 */

const heroTop = runnerConfig.hero.runY - runnerConfig.hero.hitbox.topOffset;
const heroBottom = runnerConfig.hero.runY + runnerConfig.hero.hitbox.bottomOffset;

// Mirrors RunnerLoopSystem.updateHeroPhysics + tryStartJump for a single
// ground jump with the button held the whole time (the player's best case).
const simulateMaxSingleJumpRise = () => {
  const { jump } = runnerConfig;
  const step = 1 / 240;
  let velocityY: number = -jump.velocity;
  let holdSeconds: number = jump.holdMaxSeconds;
  let y = -2; // ground-jump start nudge (heroY -= 2 in tryStartJump)
  let highest = y;

  for (let elapsed = 0; elapsed < 2 && velocityY < 0; elapsed += step) {
    let gravity = jump.riseGravity;

    if (holdSeconds > 0) {
      gravity *= jump.holdGravityMultiplier;
      holdSeconds = Math.max(0, holdSeconds - step);
    }

    velocityY = Math.min(jump.maxFallSpeed, velocityY + gravity * step);
    y += velocityY * step;
    highest = Math.min(highest, y);
  }

  return -highest;
};

const maxSingleJumpRise = simulateMaxSingleJumpRise();
// Where the hero's feet (hitbox bottom) are at the apex of a full single jump.
const singleJumpFeetApexY =
  runnerConfig.hero.runY - maxSingleJumpRise + runnerConfig.hero.hitbox.bottomOffset;

const hazardScreenBounds = (item: HazardPhraseItem) => {
  const definition = hazardDefinitions[item.variant];
  const baseY = runnerConfig.visual.groundLineY - item.y;
  const top = baseY + definition.offsetY - definition.height / 2;

  return { top, bottom: top + definition.height };
};

const overlapsStandingHero = (item: HazardPhraseItem) => {
  const bounds = hazardScreenBounds(item);

  return bounds.bottom > heroTop && bounds.top < heroBottom;
};

const hazardsOf = (phrase: RunnerPhrase) =>
  phrase.items.filter((item): item is HazardPhraseItem => item.kind === 'hazard');
const collectiblesOf = (phrase: RunnerPhrase) =>
  phrase.items.filter((item): item is CollectiblePhraseItem => item.kind === 'collectible');
const platformsOf = (phrase: RunnerPhrase) =>
  phrase.items.filter((item): item is PlatformPhraseItem => item.kind === 'platform');

// Fairness thresholds per stage. Moonlight values come straight from the
// fairness doc; wounded-planet keeps looser legacy floors so the QA'd Level 1
// data stays untouched while still guarding against regressions.
const stageRules: Record<
  JourneyStageKey,
  { hazardGapMin: number; duckClearanceMin: number }
> = {
  'wounded-planet': { hazardGapMin: 118, duckClearanceMin: 5 },
  'moonlight-mountain': { hazardGapMin: 130, duckClearanceMin: 20 },
  // Black Forest reuses the moonlight vocabulary, so it is held to the same
  // fairness floors rather than the looser legacy Level 1 ones.
  'black-forest': { hazardGapMin: 130, duckClearanceMin: 20 }
};

const stages = Object.values(journeyStages) as JourneyStageDefinition[];

describe.each(stages.map((stage) => [stage.key, stage] as const))(
  'stage %s',
  (stageKey, stage) => {
    const rules = stageRules[stageKey];
    const phrases = Object.values(stage.runner.phrases);

    it('references only phrases that exist', () => {
      const ids = new Set(Object.keys(stage.runner.phrases));
      const referenced = [
        stage.runner.initialPhraseId,
        ...stage.runner.onboardingSequence,
        ...stage.runner.rotation,
        ...stage.runner.recoverySequence
      ];

      for (const id of referenced) {
        expect(ids.has(id), `phrase "${id}" is referenced but not defined`).toBe(true);
      }

      for (const [key, phrase] of Object.entries(stage.runner.phrases)) {
        expect(phrase.id).toBe(key);
      }
    });

    it('has a sane level distance profile', () => {
      const level = stage.runner.level;

      expect(level.surfaceStartDistance).toBeGreaterThan(0);
      expect(level.finishRevealDistance).toBeGreaterThan(level.surfaceStartDistance);
      expect(level.endDistance).toBeGreaterThan(level.finishRevealDistance);
      expect(level.finishSlowdownDistance).toBeGreaterThan(0);
      expect(level.exitCoastDistance).toBeGreaterThanOrEqual(0);
    });

    it('keeps recovery phrases hazard-free breathers', () => {
      for (const id of stage.runner.recoverySequence) {
        const phrase = stage.runner.phrases[id]!;

        expect(phrase.family).toBe('recovery');
        expect(
          hazardsOf(phrase).length,
          `recovery phrase "${id}" must not contain hazards`
        ).toBe(0);
      }
    });

    it('never places a hazard in the unfair trap band', () => {
      // A trap hazard clips a standing hero AND cannot be cleared with a full
      // single jump — the forbidden y~104-128 band, derived from real physics.
      for (const phrase of phrases) {
        for (const hazard of hazardsOf(phrase)) {
          const bounds = hazardScreenBounds(hazard);
          const where = `${phrase.id} ${hazard.variant}@x${hazard.x},y${hazard.y}`;

          if (overlapsStandingHero(hazard)) {
            // Jump-over hazard: a single held jump must clear it with margin.
            expect(
              bounds.top,
              `${where} blocks a standing hero but a single jump cannot clear it`
            ).toBeGreaterThanOrEqual(singleJumpFeetApexY + 6);
          } else {
            // Duck-under hazard: running under must leave head clearance.
            expect(
              heroTop - bounds.bottom,
              `${where} leaves too little head clearance to run under`
            ).toBeGreaterThanOrEqual(rules.duckClearanceMin);
          }
        }
      }
    });

    it(`spaces consecutive hazards >= ${rules.hazardGapMin}px inside each phrase`, () => {
      for (const phrase of phrases) {
        const xs = hazardsOf(phrase)
          .map((hazard) => hazard.x)
          .sort((a, b) => a - b);

        for (let index = 1; index < xs.length; index += 1) {
          expect(
            xs[index]! - xs[index - 1]!,
            `phrase "${phrase.id}" hazards at x${xs[index - 1]} and x${xs[index]} are too close`
          ).toBeGreaterThanOrEqual(rules.hazardGapMin);
        }
      }
    });

    it('keeps hazard cadence readable across any phrase boundary', () => {
      // Conservative: any phrase may follow any other within a stage.
      for (const first of phrases) {
        const firstHazards = hazardsOf(first);

        if (firstHazards.length === 0) {
          continue;
        }

        const lastHazardX = Math.max(...firstHazards.map((hazard) => hazard.x));

        for (const second of phrases) {
          const secondHazards = hazardsOf(second);

          if (secondHazards.length === 0) {
            continue;
          }

          const firstHazardX = Math.min(...secondHazards.map((hazard) => hazard.x));
          const gap = first.spacingAfter - lastHazardX + firstHazardX;

          expect(
            gap,
            `"${first.id}" -> "${second.id}" cross-phrase hazard gap ${gap}px is too tight`
          ).toBeGreaterThanOrEqual(rules.hazardGapMin);
        }
      }
    });

    it('never lets a phrase spill past its own spacing', () => {
      for (const phrase of phrases) {
        const maxX = Math.max(...phrase.items.map((item) => item.x));

        expect(
          phrase.spacingAfter,
          `phrase "${phrase.id}" spacingAfter must cover its own items`
        ).toBeGreaterThanOrEqual(maxX);
      }
    });

    it('keeps every collectible inside reachable, non-buried heights', () => {
      for (const phrase of phrases) {
        for (const item of collectiblesOf(phrase)) {
          const where = `${phrase.id} ${item.variant}@x${item.x}`;

          expect(item.y, `${where} sits inside the floor`).toBeGreaterThanOrEqual(40);
          expect(item.y, `${where} is above any fair reach`).toBeLessThanOrEqual(240);
        }
      }
    });

    it('never puts a duck-under hazard right after a ledge drop', () => {
      for (const phrase of phrases) {
        for (const platform of platformsOf(phrase)) {
          const rightEdge = platform.x + platform.width / 2;

          for (const hazard of hazardsOf(phrase)) {
            if (overlapsStandingHero(hazard)) {
              continue; // grounded jump-over hazards are fine after a drop
            }

            const pastEdge = hazard.x - rightEdge;
            const inDropWindow = pastEdge > 0 && pastEdge < 170;

            expect(
              inDropWindow,
              `phrase "${phrase.id}" ${hazard.variant}@x${hazard.x} sits in the drop arc after the ledge`
            ).toBe(false);
          }
        }
      }
    });
  }
);

describe('moonlight visual vocabulary (the two verbs never share a sprite)', () => {
  const stage = journeyStages['moonlight-mountain'];
  const phrases = Object.values(stage.runner.phrases);

  it('uses only shard / mirror / crown hazards at their canonical heights', () => {
    for (const phrase of phrases) {
      for (const hazard of hazardsOf(phrase)) {
        const where = `${phrase.id} ${hazard.variant}@x${hazard.x},y${hazard.y}`;

        expect(
          ['shard', 'mirror', 'crown'].includes(hazard.variant),
          `${where} is not part of the moonlight vocabulary`
        ).toBe(true);

        if (hazard.variant === 'shard') {
          // JUMP OVER: always a grounded crystal on the ground line.
          expect(hazard.y, `${where} shards must sit on the ground (y:18)`).toBe(18);
        } else {
          // RUN UNDER: mirrors/crowns are overhead only — low mirrors banned.
          expect(hazard.y, `${where} must be clearly overhead (y>=168)`).toBeGreaterThanOrEqual(168);
        }
      }
    }
  });

  it('keeps collectibles near hazards grounded so notes never bait a jump', () => {
    for (const phrase of phrases) {
      const hazards = hazardsOf(phrase);

      for (const item of collectiblesOf(phrase)) {
        for (const hazard of hazards) {
          if (Math.abs(item.x - hazard.x) <= 70) {
            expect(
              item.y,
              `${phrase.id} ${item.variant}@x${item.x},y${item.y} baits the player near ${hazard.variant}@x${hazard.x}`
            ).toBeLessThanOrEqual(112);
          }
        }
      }
    }
  });
});

describe('jump physics assumptions', () => {
  it('single-jump rise stays near the documented ~113px fairness math', () => {
    // gameplay-fairness-rules.md derives its bands from a ~113px max rise.
    // If tuning changes this materially, the phrase data must be re-audited.
    expect(maxSingleJumpRise).toBeGreaterThanOrEqual(105);
    expect(maxSingleJumpRise).toBeLessThanOrEqual(125);
  });
});
