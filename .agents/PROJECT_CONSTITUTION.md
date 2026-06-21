# Project Constitution

## Purpose
Build an original mobile-first web game for Mateo that feels hand-crafted, emotionally subtle, performant, and scalable.

## Non-Negotiables
- Originality: borrow no direct mechanics, pacing, level flow, or visual language from existing games.
- Mobile performance: optimize for real phones first; keep input responsive, frame work light, and asset sizes disciplined.
- Modular architecture: scenes orchestrate, systems own mechanics, content/config stays data-driven, persistence stays isolated.
- Emotional tone: express sadness-to-aliveness through play, rhythm, posture, responsiveness, color, and audio layers, not exposition.
- Visual identity: preserve the hero's asymmetry, innocence, readability, and hand-drawn character over generic polish.
- Backend boundary: gameplay must run without Firebase; all cloud work stays behind adapters/services.
- Low-waste AI usage: request the smallest useful slice, make the smallest reviewable change, validate before closing.
- Incremental delivery: prefer stable vertical slices over speculative frameworks.

## Current Foundation Status (2026-06-21)
- A level registry exists ([levels/](../src/game/content/levels/)) but only wraps the current `wounded-planet` stage as `w1-l1`. It is metadata, not yet consumed in gameplay.
- `JourneyScene.ts` is too large and must be decomposed incrementally (BackdropRenderer → GuidanceDirector → overlays), one extraction per commit.
- Firebase is currently a no-op stub, imported by nobody. Do not treat it as implemented.
- Do not author levels 2-10 until the extractions and an expanded `LevelDefinition` are in place.
- `docs/memory/` is the stable memory layer for agents. Read [project-current-state.md](../docs/memory/project-current-state.md) and [next-agent-brief.md](../docs/memory/next-agent-brief.md) before a slice.

## Slice Gate
- State the decision, scope, and files touched.
- Run validation before closure.
- Note any residual risk or deferred work.

## Validation Gate
- `npm run check`
- `npm run build`
- Local dev sanity on `0.0.0.0:4321`

## Forbidden
- Cloning known games.
- Large logic blobs inside scenes or UI components.
- Backend-coupled gameplay rules.
- Generic glossy art direction that weakens the hero's identity.
- Closing work without a runnable verification step.
