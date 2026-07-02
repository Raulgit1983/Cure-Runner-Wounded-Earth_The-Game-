---
tags: [cure-runner, mateo-game, memory, design, level-03]
updated: 2026-06-21
---

# Level 3 — Direction & Readiness (do not build yet)

> To see this in Obsidian, the repo/`docs` folder must be opened or mirrored into the Obsidian vault. There is no assumed external sync; `docs/memory/` is the stable layer.

## Decision (2026-06-21)
**Do not start Level 3 until the current flow + moonlight (stage 2) fairness are stable and verified on a real phone.** Two playable stages exist (`wounded-planet`, `moonlight-mountain`); the active work is entry-flow correctness, mobile responsiveness, and stage-2 fairness — not new content.

Stabilize first (all must be true before Level 3):
1. Entry start is CTA-only on both the DOM cover and `LevelEntryScene` (a tap on art/empty space never starts; help opens help only; help-open never starts).
2. Technical loader (`BootScene`) is a neutral dark handoff — no narrative, no confusing flash.
3. Entry cover fills the phone viewport, respects safe-areas, "Ayuda breve" stays inside the usable area.
4. Moonlight stage 2 feels fair (see [runner reachability rules below](#fairness-rules-of-thumb)) and is confirmed playable by Mateo.
5. Final-note arrival stays a clean glide (no pre-contact hop) and the stray finish button stays gone.

## Future Level 3 direction
- **Rhythm-forward.** Geometry-Dash-*inspired* clarity: readable timing, obstacle cadence tied to the procedural music, immediate retry, music-feel interactions.
- **Original identity, no cloning.** Do NOT copy Geometry Dash UI, art, branding, exact mechanics, level structure, or fail feel. Keep the warm father-son, Wounded Planet / healing / notes / light identity. Emotion is felt through rhythm, light, recovery, clarity, and small choices — not heavy text.
- **Gameplay first.** A new readable mechanic verb (beyond jump-over / duck-under / ledge), introduced via an onboarding phrase before it appears in tension phrases.
- Theme placeholder: a "Pulse Canyon" / "resonance" world where the path lights up on the beat — collecting notes briefly reveals the safe line. (Name TBD; keep it warm, not edgy.)

## What systems must be ready first (prereqs from project-current-state.md)
- Extract `BackdropRenderer` from the ~3.2k-LOC [JourneyScene.ts](../../src/game/scenes/JourneyScene.ts) (behavior-preserving).
- Extract `GuidanceDirector` (data table replacing the `*GuidanceShown` booleans).
- Extract overlays (pause/help/fail/finish/discovery) into modules.
- Expand `LevelDefinition` to actually drive tuning overrides, phrase pools, and mechanic flags (today it only resolves the initial stage).
- Add Vitest coverage for `sessionState` before the first extraction (refactors are currently unguarded).
- Only then author levels as data.

## Fairness rules of thumb (apply to any new phrase data)
- Mirrors (tall, h44): **y:64 = jump-over** (single jump clears, hero still overlaps so it's real) · **y≥168 = duck-under** (≥20px head clearance). Never the y≈104–128 trap band (clips a standing hero yet exceeds a single jump).
- A collectible within ~60px **before** a jump-over hazard must be grounded-grabbable (`item.y ≤ ~110`) so the player grabs it on the ground and clears with one clean jump — never a hop-then-double-jump.
- Keep stage 2 harder than stage 1 via density, jump height, ledges, and ceilings — not via unfair heights.
- Prefer phrase-data edits (x, y, spacing, rotation) over physics. Do not edit `RunnerLoopSystem.ts` without a proven logic bug.
