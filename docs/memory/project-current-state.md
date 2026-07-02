---
tags: [cure-runner, mateo-game, memory, architecture]
updated: 2026-07-02
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
- Dev server: port `5174`, `strictPort: true` in both `vite.config.ts` and the `dev`/`preview` npm scripts.

## What was just changed (Fact — 11 commits landed 2026-07-02/03, `833b8aa..f40c1fe`)
All of the below is now in `HEAD`, not just the working tree. Verified by isolating each commit (`git stash` where other uncommitted work existed, otherwise a clean-tree rebuild) and re-running `npm run build` + `npm test` before moving to the next.

- **Vitest infrastructure** (`ffd5bee`): `npm test` / `npm run test:watch`, 40 Phaser-free tests (`sessionState`, `phraseFairness` — encodes [gameplay-fairness-rules.md](gameplay-fairness-rules.md) as data invariants over both stages, `localProgressStore`, `levelRegistry`). Extracted [entityCatalog.ts](../../src/game/systems/runner/entityCatalog.ts) out of `RunnerLoopSystem` so tests read real hitbox numbers.
- **Dev server port 4321 → 5174** (`58300e9`), `strictPort` kept on both `vite.config.ts` and the `dev` npm script (the script's CLI flag overrides the config file — both had to move).
- **`BackdropRenderer`** (`68d3ef9` adds the module, `dc933f5` wires it in): [BackdropRenderer.ts](../../src/game/systems/backdrop/BackdropRenderer.ts), 538 LOC, owns the Graphics layer, follow smoothing, redraw throttle and both stage painters. `JourneyScene` no longer has any inline backdrop code.
- **`GuidanceDirector`** (`6dc65bc` adds the module, `dc933f5` wires it in): [GuidanceDirector.ts](../../src/game/systems/guidance/GuidanceDirector.ts), 75 LOC, data table of 13 one-time guidance keys (`hasShown`/`markShown`/`showOnce`/`reset`). Replaces the 13 `*GuidanceShown` booleans that used to live in `JourneyScene`. 3 keys double as game-state read by the shark director (`hazard_intro`, `shark_sighting`, `shark_catch`); `finishAwakeningBeatShown` stays a scene-local boolean by decision (it's part of the finish sequence, not player guidance).
- **`CLAUDE.md` committed** (`71f344a`) — first time this file enters git history. Includes a new "Creative DNA (non-negotiable)" section: Mateo's sketches are the art source (never polish toward a generic style), values are felt through play/symbol never taught explicitly, and a Geometry-Dash-inspired physics direction (precise jumps, rhythm sync, instant retry, speed tension) for future mechanics — direction only, nothing implemented yet.
- **Entry-flow correctness pass** (`5f9e917`): DOM cover and `LevelEntryScene` both start on an explicit CTA only (card is a plain container, not a giant button — a stray tap never starts the level); `BootScene` is a true neutral loader (DOM cover stays up until the first Phaser screen announces itself via `mateo:ui-screen`); shared [phaserTextStyle.ts](../../src/ui/phaserTextStyle.ts) keeps loading/entry text crisp on hi-DPI phones; `global.css` gained safe-area-aware full-bleed cover styling and reduced-motion coverage.
- **Gameplay-fairness pass** (`c509948`): `journeyStages.ts` moonlight (stage 2) phrases redesigned around one visual vocabulary (grounded shard = jump over, overhead mirror/crown = run under, never the same sprite for both verbs), plus a `0.92` speed multiplier for stage-2 reaction time. `runnerConfig.ts` + `RunnerLoopSystem.ts`: post-hit invulnerability raised `0.82s → 1.1s`, new `grantGrace()` API, `+0.35s` bonus grace on a reserve save.
- **`JourneyScene.ts` wiring + carried-forward WIP, one wide commit** (`dc933f5`) — deliberately NOT split further; see that commit's message for the full disclosure of what's bundled. On top of the BackdropRenderer/GuidanceDirector wiring, it also carries: pause as a hard freeze (halts the shark too), the i-frame hero blink, deferred/subdued shark rescue grace, victory pre-contact hop removed + celebration float eases in from zero, and two stray orphaned panel buttons now destroyed instead of left stranded.
- **Docs** (`d2e6976`): [gameplay-fairness-rules.md](gameplay-fairness-rules.md) (authoritative reachability/i-frame/pause/shark/final-note rules) and [level-03-direction.md](level-03-direction.md) (Level 3 readiness gate + future direction) committed.
- **`PauseFlow` extracted** (`f40c1fe`, roadmap priority 3, first overlay pair): [PauseFlow.ts](../../src/game/systems/overlays/PauseFlow.ts), 436 LOC — owns the pause scrim, the pause + nested quick-help panels, their swap/open/close tweens, and the window-level triggers (`mateo:pause-request`, Escape/P). A `PauseFlowHost` callback interface keeps scene-owned decisions (can we pause, should the run resume on close) in `JourneyScene`, same pattern as `GuidanceDirector`'s dual-role keys. Two small shared pieces came out alongside it: [panelButton.ts](../../src/ui/panelButton.ts) (`createPanelButton`, used by every overlay) and [overlayText.ts](../../src/game/content/overlayText.ts) (shared button labels + pause copy). Fail/finish/discovery overlays are NOT part of this — still inline in `JourneyScene.ts`, planned as one or two more slices (see priorities below). `JourneyScene.ts` is now **2418 LOC** (down from ~3255 before any of this session's work landed).

## What is verified (Fact)
- `tsc --noEmit` exits 0, `vite build` succeeds, `npm test` is **48/48 green at `HEAD`** — confirmed both at the full tree and isolated per-commit at every checkpoint above.
- The moonlight fairness data invariants (5 tests) only pass once `c509948` (the phrase redesign) is present — expected: they encode the redesigned data, not the pre-redesign phrases. No longer a caveat now that `c509948` is committed.
- Browser smoke test (Chrome, pre-`dc933f5`, same bytes as committed): entry cover → CTA starts run → backdrop/hero/collectibles render, "Notas."/"Golpe." discovery beats fire once each and don't re-trigger, Repetir resets per-run guidance, moonlight backdrop (sky/moon/mountain/crystal layers, parallax) renders correctly through `BackdropRenderer`, pause hard-freeze works, zero console errors throughout.
- Browser smoke test (Chrome, post-`f40c1fe`, this exact `HEAD`): PAUSA button opens the pause panel through `PauseFlow` with a hard freeze behind it, Ayuda swaps to the help panel and Volver swaps back, Continuar resumes and unfreezes, keyboard P opens / Escape closes, both keys correctly no-op while a discovery beat owns the screen, zero console errors.
- `getFirstLevel().stageKey === 'wounded-planet'` — same stage reference as before the level-registry slice.

## What is NOT implemented (Fact)
- Firebase: [firebaseGateway.ts](../../src/game/services/backend/firebaseGateway.ts) is a **no-op stub, imported by nobody**, no SDK in `package.json`. Do not describe as implemented.
- No `LevelDefinition` consumption beyond resolving the initial stage. No level select, no unlock/progress-per-level state.
- Levels 2-10: not authored.
- No PWA manifest / service worker.
- Fail, finish and discovery overlays: **still inline in `JourneyScene.ts`**, not extracted modules. `PauseFlow` (pause + help) is the only overlay pair extracted so far.
- Tests cover pure state/data only — scenes and the runner loop itself are still untested (Phaser-coupled), including `PauseFlow` (Phaser-coupled end to end; verified by browser smoke test instead).
- **Real-phone verification of the fairness/entry-flow pass has not happened.** Everything above is code-committed and Chrome-verified, but nobody has played it on an actual mid-range Android device yet.

## Immediate next priorities (Next action — in order)
1. **Real-phone pass before authoring Level 3.** All four prerequisites from the former "stabilize" gate are now code-complete and committed: entry is CTA-only, `BootScene` is a neutral loader, the cover is safe-area-aware, and moonlight hazards follow the shard-jump/mirror-crown-duck convention in [gameplay-fairness-rules.md](gameplay-fairness-rules.md). The one remaining blocker is verification on a real phone (see [level-03-direction.md](level-03-direction.md)) — do not author Level 3 until that pass happens.
2. ~~Extract `BackdropRenderer`~~ — **DONE**, wired into `JourneyScene` (2026-07-02).
3. ~~Extract `GuidanceDirector`~~ — **DONE**, wired into `JourneyScene` (2026-07-02).
4. Extract overlays (pause/help/fail/finish/discovery) into modules — **in progress**: ~~pause/help~~ **DONE** (`f40c1fe`, 2026-07-03). Recommended split for the rest: **fail + discovery** next (fail is small and self-contained; discovery already has its state in `GuidanceDirector`) — then **finish alone, last** (most entangled: `finishSequence` is read every frame by the hero-position update, plus a pending note-absorption rework noted in `gameplay-fairness-rules.md`).
5. Expand `LevelDefinition` (tuning overrides, phrase pools, mechanic flags).
6. Then author levels 1-10 as data.

## Known risks (Risk)
- [JourneyScene.ts](../../src/game/scenes/JourneyScene.ts) still 2418 LOC after the backdrop/guidance/pause extractions — keep decomposing incrementally, one system per commit (next: fail + discovery overlays).
- Runner entities are created per spawn with no pooling → GC churn on mobile (perf, not correctness).
- Mobile FPS / input latency on real mid-range Android: **Needs verification** (no device pass on record) — this is now the single gate blocking Level 3.
- GitHub Pages "source = GitHub Actions" setting: **Needs verification** in repo settings.

## Strict "do not assume" list
- Do **not** assume Firebase works — it is a stub.
- Do **not** assume levels 2-10 exist or that `LevelDefinition` is consumed in gameplay.
- Do **not** assume all overlay modules exist — `BackdropRenderer`, `GuidanceDirector` and `PauseFlow` (pause/help) do; fail/finish/discovery are still inline in `JourneyScene`.
- Do **not** assume scene/runner-loop/overlay behavior is test-covered — only pure state/data is (48 Vitest tests). `PauseFlow` is Phaser-coupled and verified by browser smoke test only.
- Do **not** assume the untracked image drafts are deleted — they are on disk, only untracked.
- Do **not** assume the fairness/entry-flow pass has been verified on a real phone — it hasn't.
- Do **not** assume an external Obsidian vault is available; `docs/memory/` is the stable layer.
