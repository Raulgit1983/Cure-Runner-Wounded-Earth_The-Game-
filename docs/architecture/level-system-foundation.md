---
tags: [cure-runner, mateo-game, architecture, level-system]
updated: 2026-06-21
---

# Level System Foundation

Status of the minimal level layer added in the 2026-06-21 foundation slice.

## Files added (Fact)
- [src/game/content/levels/types.ts](../../src/game/content/levels/types.ts) — `LevelDefinition` interface + `WorldId` / `LevelId` / `LevelDifficulty` types.
- [src/game/content/levels/levelRegistry.ts](../../src/game/content/levels/levelRegistry.ts) — ordered `levelRegistry` + `getLevel` / `getFirstLevel` / `getNextLevel`.

## Shape (Fact)
`LevelDefinition = { id, world, index, displayName, stageKey, stage, nextLevelId, difficulty }`
- `stage` is a **reference** to `journeyStages[stageKey]`, not a copy.
- `displayName` reuses the existing stage `label` — no new player-facing copy introduced.

## Why it wraps journeyStages (Decision)
- All gameplay content (phrases, tuning, entry art, backdrop kind) already lives in [journeyStages.ts](../../src/game/content/journeyStages.ts) and [runnerConfig.ts](../../src/game/content/runnerConfig.ts).
- The registry adds **identity + progression metadata** (id/index/world/nextLevelId/difficulty) on top, keeping one source of truth. No data is moved or duplicated.

## Why only `w1-l1` exists now (Decision)
- Authoring levels 2-10 requires systems that do not exist yet (`BackdropRenderer`, `GuidanceDirector`, extracted overlays) and an expanded `LevelDefinition`.
- Shipping one wrapping level proves the data path with zero behavior change and zero risk.

## How levels 2-10 should be added later (Next action)
1. First complete: BackdropRenderer + GuidanceDirector + overlay extraction.
2. Expand `LevelDefinition` with: `tuning` overrides (speed, endDistance, hazardDensity), `phrases` pools (onboarding/rotation/recovery), `mechanics` flags (doubleJump, reserve, platforms, shark), `backdropTheme`, `emotionalBeat`.
3. Add each level as a **data object** in `levels/world-01/`, set `nextLevelId` to chain them, register in `levelRegistry`.
4. Curve target (from audit): L1-3 onboarding, L4-7 skill/rhythm, L8-10 combination + climax. Reuse the wounded-planet vocabulary; no new art required.

## What must NOT be duplicated (Risk)
- Do not copy phrase arrays, tuning values, or stage data into level files — reference them.
- Do not fork `runnerConfig` values per level; use override fields on `LevelDefinition`.
- Do not re-implement spawning/collision per level — one `RunnerLoopSystem` consumes the data.

## Needs verification
- Whether `LevelEntryScene` / HUD should display `displayName` and `index` — not wired yet.
