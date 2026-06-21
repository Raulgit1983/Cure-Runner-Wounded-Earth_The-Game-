---
tags: [cure-runner, mateo-game, memory, ai-agent]
updated: 2026-06-21
---

# Next Agent Brief

Read this before touching the repo. Pair with [project-current-state.md](project-current-state.md).

## Status assumptions
- Repo compiles: `tsc --noEmit` and `vite build` are green as of 2026-06-21.
- Active work line: foundation for a future 10-level expansion. Last slice = minimal level registry.
- `dist/` is gitignored; do not commit build output.

## Architecture facts (do not re-derive)
- Scenes orchestrate; rules live in `systems/`; values in `content/`; persistence behind `services/`.
- Level layer exists but is **metadata only**: one level `w1-l1` wrapping `journeyStages['wounded-planet']` by reference. Not consumed in gameplay beyond initial-stage resolution in [BootScene.ts](../../src/game/scenes/BootScene.ts).
- [JourneyScene.ts](../../src/game/scenes/JourneyScene.ts) is a ~3255 LOC god-object pending incremental decomposition.
- Firebase = no-op stub, unimported. Audio = procedural. No tests. No PWA.

## Highest-priority next slice
- **Extract `BackdropRenderer` from JourneyScene** (behavior-preserving move). Inputs: `(theme, distance, surfaceProgress, mood)`. No visual change.
- Do this as ONE commit. Next slices after it: `GuidanceDirector`, then overlays, then expand `LevelDefinition`, then author levels 1-10 as data.

## Validation commands (run before closing any slice)
```
npm run check   # tsc --noEmit
npm run build   # tsc --noEmit && vite build
```
Plus a local sanity pass on `0.0.0.0:4321` if behavior could change.

## Forbidden changes
- No broad rewrite. No editing physics/movement/collision in [RunnerLoopSystem.ts](../../src/game/systems/runner/RunnerLoopSystem.ts).
- No tuning/copy/visual changes unless that IS the slice's scope.
- No Firebase implementation, no new deps, no deploy/workflow edits, no asset changes, unless explicitly the task.
- Do not author levels 2-10 until the extractions + expanded `LevelDefinition` are done.
- Do not invent systems that do not exist. Mark uncertain claims **Needs verification**.

## Expected output format
- Change summary (what + why).
- Files created / modified / untracked.
- Confirmation runtime behavior is unchanged (or what changed and why).
- Validation results (`check`, `build`).
- Residual risk + suggested commit message.
