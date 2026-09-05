---
tags: [cure-runner, mateo-game, memory, ai-agent]
updated: 2026-09-05
---

# Next Agent Brief

Read this before touching the repo. Pair with [project-current-state.md](project-current-state.md).

## Status assumptions
- Codex/Astra now owns implementation too; **do not invoke Claude** unless Raúl
  explicitly re-enables it. September polish was saved locally after base
  `e1480b0`; read the exact current HEAD rather than trusting an abbreviated hash.
- `npm run check`, `npm run build` and `npm test` (**199 tests / 17 files**) pass
  on the September working tree. Discovery is scoped to `src/`, excluding task
  worktrees. The old 280 figure was not a reliable unique-test count.
- **All three stages are now image-backed by Mateo's scanned drawings.** Wounded
  Planet and Moonlight Mountain share the plan-driven `ImageBackdropRenderer`;
  Black Forest keeps its own renderer for the eye, the yawn and the parallax.
  The Graphics-only `BackdropRenderer` survives ONLY as the not-loaded fallback.
- **Historical record:** deployed to GitHub Pages on 2026-08-09 on Raúl's explicit instruction, by
  merging `visual/world-01-carlitos-drive` into `main`. Before that the live
  site was 33 commits behind. Production is not reverified this turn. The
  September slice has a 360x640 / DPR 2 Chrome pass, **not a physical-device pass**.
- `dist/` is gitignored; do not commit build output. `art-lab/` is gitignored too
  (~106 MB of art working material, kept on disk like `Imagenes/`); the accepted
  output of an art pass is copied into `src/assets/worlds/` and committed there.

## Architecture facts (do not re-derive)
- Scenes orchestrate; rules live in `systems/`; values in `content/`; persistence behind `services/`.
- Runner stage chain: `wounded-planet → moonlight-mountain → black-forest`.
  In DEV only, forest's `nextEncounter: 'chomper'` opens a separate lazy scene;
  production still ends at forest pending candidate review. Chomper is not a
  fourth `JourneyStageKey` and does not inherit runner physics/phrase pools.
  Level layer is still **metadata only** — `LevelDefinition` resolves the initial stage.
- Backdrops implement [StageBackdrop](../../src/game/systems/backdrop/StageBackdrop.ts). `ImageBackdropRenderer` paints stages 1-2 with source art; the Graphics-only renderer is fallback. `BlackForestBackdropRenderer` composes the colour-v4 sheet with parallax.
- Per-stage differences live in `JourneyStageTraits`, **not** in `backdropKind === '<stage>'` checks. Those were all removed on purpose.
- Character poses/animation live in `systems/character/`. `JourneyScene` owns position, origin, depth, alpha, scale and rotation; the animator only picks the frame.
- Firebase = no-op stub, unimported. Audio = procedural. No PWA.

## Traps that will bite you
1. **Phaser animations do not advance from `Scene.update()`.** They run on the animation manager. If you add an early return to `update()`, the run cycle keeps playing behind your overlay. `CharacterAnimator.setPaused()` exists for exactly this.
2. **Never make a game object visible before positioning it.** That was the Tiburoncín one-frame flash: `setVisible(true)` then `return`, leaving the previous fly-by's transform on screen for a frame. Every shark exit now routes through `hideShark()`, which parks it off-screen.
3. **Do not size or foot a sprite from `texture.height`.** Animation pack v2 pads its canvas; Carlitos' does not. Read `CharacterArtMetrics` (measured alpha bounds) instead. Getting this wrong is what made the Devilz float 18-26 px above the floor.
4. **`FinishFlow`'s per-frame contract** is still the sharpest edge: `advance` → `decayPulse` → `update`, the last strictly before the hero block. Do not reorder without a browser smoke test of the finish sequence.
5. Adding a stage means adding a `JourneyStageTraits` entry, a `STAGE_OVERLAY_COPY` entry and a `stageRules` entry in `phraseFairness.test.ts`. TypeScript will tell you; the fairness test will check your data.
6. **Never regenerate `package-lock.json` casually — it cost three failed
   deploys on 2026-08-09.** The Pages workflow runs `npm ci` on Node 20, so:
   - Generate it with **npm 10** (`npx npm@10 install --package-lock-only`).
   This machine's npm 11 resolves vitest's optional peer chain
   (vite 8 -> rolldown) differently and omits `vitest/node_modules/esbuild`,
   which npm 10 on the runner then rejects as missing.
   - Generate it in a **pristine directory containing only `package.json`**.
   Run it inside this repo with `node_modules` present and npm prunes the
   optional platform binaries to your machine — 1 rollup binary instead of 25 —
   so `npm ci` passes on the runner and the BUILD dies on a missing
   `@rollup/rollup-linux-x64-gnu`.
   - Verify both ways before pushing:
   `npx npm@10 ci --dry-run --os=linux --cpu=x64` and `--os=darwin --cpu=arm64`.
   Expect 152 packages and no missing/invalid entries on both.
   - The push token has **no `workflow` scope**, so `.github/workflows/*`
   cannot be changed from a Claude session. Fix things in the lockfile, or ask
   Raúl to run `gh auth refresh -s workflow`.

## Backdrop treatment (added 2026-08-09, do not "fix" back)
- September correction: do not fade Black Forest's container. Phaser applies
  that alpha per child, exposing overlaps. Keep plate/iris/mouth fully opaque
  and put the atmospheric veil last inside the same container.
- The readability layer is a **vertical grade, not a flat veil**: weakest at the
  top of the screen, full strength across the play band. That is deliberate —
  the upper art wants to be left alone and the lane the player reads wants to be
  quiet. Net effect on Wounded Planet, measured: art region mean luminance
  127 -> 139 and RMS contrast 18.4 -> 22.3 (Mateo's pencils MORE present than
  under the old flat veil), play band mean 104 -> 97. Shape lives in
  `BACKDROP_GRADE_SHAPE`; per-stage strength is `plan.veil.restAlpha/litAlpha`,
  which now means the alpha at the STRONGEST stop, not a uniform alpha.
- Black Forest's plate is a band across the upper screen, so both its horizontal
  edges are feathered into the sky colour (`featherBands`). Without it the
  illustration ended on a cut line across the night.
- `BG_PARALLAX_LIMIT` is **derived from the framing**, never hand-set. A hand-set
  30 px against a 20 px right-hand bleed used to pull the plate off the right
  edge and leave a 10 px strip of bare sky beside the drawing for the whole
  second half of every run. `blackForestArt.test.ts` bounds it.

## Highest-priority next slices
1. **Real-phone pass.** September emulation is 360x640 / DPR 2. The temporary
   tool usage block was resolved on continuation; `qa-boss.mjs`, `qa-dev.mjs`
   and `qa-art.mjs` passed against the current tree. Boss warning/pickup/victory
   audio events are counted, but not a perceptual listening test. Never
   describe emulation as hardware acceptance.
2. **Black Forest floor candidate awaits selection.** The plate occupies y 87..383 of a 640
   tall canvas, so the whole play band is flat sky with no material, while
   stages 1-2 have Mateo's paper texture edge to edge. The feather softened the
   seams; it did not fill the void. Re-framing the band is an art-direction call
   and belongs to Codex/Raúl, not to a code slice. A versioned, low-contrast
   material candidate and in-game preview now live in
   `art-lab/2026-09-05-forest-polish/`; they are not runtime assets. See
   [polish-2026-09-05.md](polish-2026-09-05.md).
3. **Chomper candidate/encounter review.** Raúl authorized building the boss
   after the three stages. Rules and a DEV-only scene now exist, with six-note
   victory, two attacks and pause/retry. Do not restart the work or call it
   production-ready: candidate approval, full art rig and human balance review
   remain. Black Forest ingredient and narrative closing are still undecided.
4. ~~Eye / mouth re-export decision~~ — **done 2026-08-09.** Both behaviours are wired off an approved art pass. Do not "fix" them back: the eye rests at offset (0,0), bounded by `IRIS_GAZE_MAX_X/Y` (currently ±8/±4 source px), and the mouth's rest phase is closed. See `blackForestArt.ts`.
5. Expand `LevelDefinition` so it actually drives tuning, phrase pools and mechanic flags.

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
- No broad rewrite. Preserve physics/movement/collision in [RunnerLoopSystem.ts](../../src/game/systems/runner/RunnerLoopSystem.ts).
  Its note/platform drawing methods are within the explicitly authorized art pass.
- No tuning/copy/visual changes unless that IS the slice's scope.
- Do not delete or overwrite old assets. The v1 Devilz art and `Imagenes/files/` originals stay.
- Do not invent an ingredient or story ending. Chomper and its standalone
  attacks ARE authorized; current attack tuning is a prototype, not Mateo canon.
- Do not invent systems that do not exist. Mark uncertain claims **Needs verification**.

## Expected output format
- Change summary (what + why).
- Files created / modified / untracked.
- Confirmation runtime behavior is unchanged (or what changed and why).
- Validation results (`check`, `build`, `test`).
- Residual risk + suggested commit message.
