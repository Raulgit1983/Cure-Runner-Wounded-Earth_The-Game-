---
tags: [cure-runner, mateo-game, memory, ai-agent]
updated: 2026-08-09
---

# Next Agent Brief

Read this before touching the repo. Pair with [project-current-state.md](project-current-state.md).

## Status assumptions
- Repo compiles: `npm run check`, `npm run build` and `npm test` (**114 tests**) are green as of 2026-08-09.
- **Uncommitted local work on top of `03382fc`:** the Black Forest eye + yawn integration (approved art pass, six runtime assets, `blackForestYawn.ts` + its tests, a generic hero-position field group on `BackdropFrameTargets`). Not committed, not pushed, by instruction.
- Active work line: three playable stages, three playable characters. The last batch was the Devilz animation pack, the Tiburoncín flash fix and The Black Forest.
- **Five commits are local only and have NOT been pushed**: the four-commit functional batch (`da731e0`, `c256b85`, `1eb0033`, `bf900b1`) plus the documentation commit `03382fc`, which is `HEAD`. Do not push without Raúl saying so.
- `dist/` is gitignored; do not commit build output.

## Architecture facts (do not re-derive)
- Scenes orchestrate; rules live in `systems/`; values in `content/`; persistence behind `services/`.
- Stage chain: `wounded-planet → moonlight-mountain → black-forest → end`. Level layer is still **metadata only** — `LevelDefinition` resolves the initial stage and nothing else.
- Backdrops implement [StageBackdrop](../../src/game/systems/backdrop/StageBackdrop.ts). `BackdropRenderer` paints stages 1-2 with Graphics; `BlackForestBackdropRenderer` composes Mateo's scanned sheet with parallax.
- Per-stage differences live in `JourneyStageTraits`, **not** in `backdropKind === '<stage>'` checks. Those were all removed on purpose.
- Character poses/animation live in `systems/character/`. `JourneyScene` owns position, origin, depth, alpha, scale and rotation; the animator only picks the frame.
- Firebase = no-op stub, unimported. Audio = procedural. No PWA.

## Traps that will bite you
1. **Phaser animations do not advance from `Scene.update()`.** They run on the animation manager. If you add an early return to `update()`, the run cycle keeps playing behind your overlay. `CharacterAnimator.setPaused()` exists for exactly this.
2. **Never make a game object visible before positioning it.** That was the Tiburoncín one-frame flash: `setVisible(true)` then `return`, leaving the previous fly-by's transform on screen for a frame. Every shark exit now routes through `hideShark()`, which parks it off-screen.
3. **Do not size or foot a sprite from `texture.height`.** Animation pack v2 pads its canvas; Carlitos' does not. Read `CharacterArtMetrics` (measured alpha bounds) instead. Getting this wrong is what made the Devilz float 18-26 px above the floor.
4. **`FinishFlow`'s per-frame contract** is still the sharpest edge: `advance` → `decayPulse` → `update`, the last strictly before the hero block. Do not reorder without a browser smoke test of the finish sequence.
5. Adding a stage means adding a `JourneyStageTraits` entry, a `STAGE_OVERLAY_COPY` entry and a `stageRules` entry in `phraseFairness.test.ts`. TypeScript will tell you; the fairness test will check your data.

## Highest-priority next slices
1. **Real-phone pass.** Everything so far was verified in headless Chromium at an iPhone-13 viewport. Three stages, three characters and an image backdrop have never run on real hardware. This is the biggest open risk.
2. **Black Forest creative decisions (Raúl's).** Ingredient, closing message and the Chomper boss all ship as explicit `[PENDIENTE DE RAÚL]` placeholders.
3. ~~Eye / mouth re-export decision~~ — **done 2026-08-09, local only.** Both behaviours are wired off an approved art pass. Do not "fix" them back: the eye must rest at offset (0,0) and stay inside ±7/±3.5 source px, and the mouth's rest phase is closed. See `BlackForestBackdropRenderer`'s class doc.
4. Expand `LevelDefinition` so it actually drives tuning, phrase pools and mechanic flags.

## Validation commands (run before closing any slice)
```
npm run check   # tsc --noEmit
npm run build   # tsc --noEmit && vite build
npm test        # vitest run
git diff --check
```
Plus a browser pass on `localhost:5174` at a 360x640 viewport if behaviour could change.

## Forbidden changes
- No push, deploy or remote change without explicit human permission.
- No broad rewrite. No editing physics/movement/collision in [RunnerLoopSystem.ts](../../src/game/systems/runner/RunnerLoopSystem.ts).
- No tuning/copy/visual changes unless that IS the slice's scope.
- Do not delete or overwrite old assets. The v1 Devilz art and `Imagenes/files/` originals stay.
- Do not invent an ingredient, boss, mechanic or ending that Raúl has not decided. Mark it `[PENDIENTE DE RAÚL]` instead.
- Do not invent systems that do not exist. Mark uncertain claims **Needs verification**.

## Expected output format
- Change summary (what + why).
- Files created / modified / untracked.
- Confirmation runtime behavior is unchanged (or what changed and why).
- Validation results (`check`, `build`, `test`).
- Residual risk + suggested commit message.
