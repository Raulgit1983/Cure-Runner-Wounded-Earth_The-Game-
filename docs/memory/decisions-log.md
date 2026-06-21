---
tags: [cure-runner, mateo-game, memory, decision]
updated: 2026-06-21
---

# Decisions Log

Concise, append-only. One decision per entry. Newest first.

## 2026-06-21 — Foundation slice landed
- **Decision:** Untrack unused image drafts (keep on disk) and add a minimal level registry wrapping the existing stage as `w1-l1`. No gameplay change.
- **Why:** Create a safe seam for the 10-level expansion without refactoring [JourneyScene.ts](../../src/game/scenes/JourneyScene.ts) yet.
- **Status:** Done, validated (`check` + `build` green).

## 2026-06-21 — Memory layer is repo-local
- **Decision:** `docs/memory/`, `docs/architecture/`, `docs/ai-agents/` are the canonical agent memory. Obsidian/Graphify is mirror/support, **not** a runtime or agent dependency.
- **Why:** No Obsidian vault exists in the workspace; agents must rely on committed files only.

## Standing decisions (undated / foundational)
- **Decision:** Mobile-first Phaser + TypeScript, logical `360x640`, `Scale.FIT`. — *Why:* target is a child playing on a phone.
- **Decision:** Emotional layer must **enhance** the gameplay loop, never interrupt it (no exposition walls; emotion via color/pulse/posture/audio/encounter). — *Why:* per [PROJECT_CONSTITUTION.md](../../.agents/PROJECT_CONSTITUTION.md).
- **Decision:** Levels become **data-driven** (`LevelDefinition` + phrase pools + tuning), not hardcoded scene branches. — *Why:* scale to 10 levels without duplicating logic.
- **Decision:** Firebase stays **decoupled** behind `CloudProgressGateway`; gameplay runs fully offline. It is a stub today and stays unimported until cloud sync is genuinely needed. — *Why:* backend boundary rule; local-first.
- **Decision:** **No broad rewrite.** Preserve `RunnerLoopSystem`, `sessionState`, `EmotionController`, audio bus, deploy pipeline, hero identity.
- **Decision:** **One system extraction per commit** (BackdropRenderer → GuidanceDirector → overlays). — *Why:* small, reviewable, validated slices.
- **Decision:** Obsidian/Graphify is memory support, not a runtime dependency. External notes must be copied/summarized into repo docs before agents rely on them.
