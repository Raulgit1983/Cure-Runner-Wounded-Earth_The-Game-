---
tags: [cure-runner, mateo-game, memory, architecture]
updated: 2026-06-21
---

# Project Current State

Compact, high-signal snapshot. Source of truth for agents. Update when a slice lands.

## What exists (Fact)
- Stack: Phaser `3.80`, TypeScript `5.7` (strict), Vite `5.4`. Logical canvas `360x640`, `Scale.FIT`.
- Module layout: `game/{scenes,systems,services,content,state}` + `ui/`. Alias `@/ -> src/`.
- Data-driven core already present:
  - Tuning: [runnerConfig.ts](../../src/game/content/runnerConfig.ts)
  - Level "phrases" (x/y obstacle/collectible chunks): [runnerPhrases.ts](../../src/game/content/runnerPhrases.ts), assembled per stage in [journeyStages.ts](../../src/game/content/journeyStages.ts)
  - Run state pub/sub store (no Phaser coupling): [sessionState.ts](../../src/game/state/sessionState.ts)
  - Pure mood interpolation: [EmotionController.ts](../../src/game/systems/emotion/EmotionController.ts)
- Playable content today: two continuous distance-based stages — `wounded-planet` and `moonlight-mountain`. **No discrete level 2-10 content.**
- Audio: procedural WebAudio via [audioCueBus.ts](../../src/game/services/audio/audioCueBus.ts) + [reactiveAudioLayer.ts](../../src/game/services/audio/reactiveAudioLayer.ts). Zero audio asset files.
- Persistence: [localProgressStore.ts](../../src/game/services/persistence/localProgressStore.ts) — localStorage key `mateo.spark-journey.progress.v1`, stores only `awakeningLevel` + `collectedSparks`.
- Deploy: GitHub Pages via [deploy-pages.yml](../../.github/workflows/deploy-pages.yml) on push to `main`.

## What was just changed (Fact — foundation slice)
- Untracked ~21 unused image drafts from git (`git rm --cached`); files **kept on disk**. `.gitignore` updated to prevent re-tracking (root drafts, `Imagenes/`, `src/assets/hero/phase1-png/`).
- Added minimal level layer:
  - [src/game/content/levels/types.ts](../../src/game/content/levels/types.ts) — `LevelDefinition` interface.
  - [src/game/content/levels/levelRegistry.ts](../../src/game/content/levels/levelRegistry.ts) — single level `w1-l1` wrapping `journeyStages['wounded-planet']` **by reference**.
- [BootScene.ts](../../src/game/scenes/BootScene.ts): `INITIAL_STAGE_KEY = getFirstLevel().stageKey` (value-identical to the old hardcoded `'wounded-planet'`).
- Behavior unchanged. `npm run check` + `npm run build` passed.

## What is verified (Fact)
- `tsc --noEmit` exits 0; `vite build` succeeds.
- Bundled runtime asset set unchanged by the level slice (9 imported assets only).
- `getFirstLevel().stageKey === 'wounded-planet'` — same stage reference as before.

## What is NOT implemented (Fact)
- Firebase: [firebaseGateway.ts](../../src/game/services/backend/firebaseGateway.ts) is a **no-op stub, imported by nobody**, no SDK in `package.json`. Do not describe as implemented.
- No `LevelDefinition` consumption beyond resolving the initial stage. No level select, no unlock/progress-per-level state.
- Levels 2-10: not authored.
- No automated tests (only `tsc` gate).
- No PWA manifest / service worker.
- `BackdropRenderer`, `GuidanceDirector`, overlay modules: **do not exist yet** (planned extractions).

## Immediate next priorities (Next action — in order)
1. Extract `BackdropRenderer` from [JourneyScene.ts](../../src/game/scenes/JourneyScene.ts) (behavior-preserving).
2. Extract `GuidanceDirector` (replace the ~40 `*GuidanceShown` booleans with a data table).
3. Extract overlays (pause/help/fail/finish/discovery) into modules.
4. Expand `LevelDefinition` (tuning overrides, phrase pools, mechanic flags).
5. Then author levels 1-10 as data.

## Known risks (Risk)
- [JourneyScene.ts](../../src/game/scenes/JourneyScene.ts) ~3255 LOC god-object — violates the constitution; raises AI-token cost and edit risk. Decompose incrementally, one system per commit.
- No tests → refactors are unguarded. Add Vitest for `sessionState` before/with the first extraction.
- Runner entities are created per spawn with no pooling → GC churn on mobile (perf, not correctness).
- Mobile FPS / input latency on real mid-range Android: **Needs verification** (no device pass on record).
- GitHub Pages "source = GitHub Actions" setting: **Needs verification** in repo settings.

## Strict "do not assume" list
- Do **not** assume Firebase works — it is a stub.
- Do **not** assume levels 2-10 exist or that `LevelDefinition` is consumed in gameplay.
- Do **not** assume `BackdropRenderer`/`GuidanceDirector`/overlay modules exist.
- Do **not** assume tests exist.
- Do **not** assume the untracked image drafts are deleted — they are on disk, only untracked.
- Do **not** assume an external Obsidian vault is available; `docs/memory/` is the stable layer.
