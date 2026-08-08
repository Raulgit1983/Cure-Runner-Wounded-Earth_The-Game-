---
tags: [cure-runner, mateo-game, memory, gameplay, fairness]
updated: 2026-06-21
---

# Gameplay Fairness & State Rules

> To see this in Obsidian, the repo/`docs` folder must be opened or mirrored into the vault. No external sync is assumed; `docs/memory/` is the stable layer.

Authoritative rules established during the gameplay-correctness pass (2026-06-21). Apply these to any future phrase authoring or state work. Geometry-Dash-*inspired* readability only — no cloning.

## 1. Stage / phrase readability + grounded-visual rule (data, in `journeyStages.ts`)
Every hazard sequence must communicate ONE clear action, and **the two verbs never share a sprite** (this was the key Stage-2 readability fix — low mirrors at `y:64` looked floating/ambiguous and are banned):
- shard `y:18` → **JUMP OVER**. A crystal that sits ON the ground line (its shadow lands at `groundLineY`), like Level 1 spikes. **All jump-over hazards are grounded shards.**
- mirror `y:172` → **RUN UNDER**. A reflective panel clearly overhead (>=25px head clearance).
- crown `y:198` → **RUN UNDER**. A jagged formation overhead.
- ledge → **platform route** (double-jump up, collect, drop).

**Grounded-visual rule:** a jump-over hazard must visually sit on / emerge from the ground line. Do NOT use low mirrors (`y:64`) as jump-overs — the sprite's body floats ~36px above the floor. If you want a jump-over, use a shard (`y:18`). Reserve mirrors/crowns for overhead duck-unders only.

Authoring rules of thumb:
- Consecutive hazards spaced **>=130px** (~0.75s) for readable cadence.
- Every collectible within ~70px of a hazard sits at **grounded height (`item.y <= 112`)**, so grabbing it never baits a jump into an overhead hazard nor a clip on a jump. Notes must never bait the player into a hazard.
- **No overhead hazard immediately after a ledge** — the drop arc clips it.
- Keep a grounded "recovery" note between dense beats; rely on `recovery` family phrases + `spacingAfter` gaps for breathers.
- Reachability math (screen-y, lower = higher): grounded hero hitbox `[420,516]`; single jump apex feet ~`y403` (max rise ~113px); shard hitbox top `525-y` (grounded, rise ~9px to clear); mirror hitbox top `518-y` bottom `562-y`. Trap band `y~104-128` is forbidden. Prefer data edits over physics. See `runner-hazard-reachability` (agent memory) for the full derivation.

## 2. Recovery / invulnerability (i-frames)
- Base grace after a hit: `runnerConfig.obstacle.invulnerabilitySeconds = 1.1s` (target band 0.9–1.4).
- **Reserve save** (last pulse spent to survive) → +0.35s (total ~1.45s); player is likely still in a cluster.
- **Moonlight fail-opportunity** recovery → existing `recoverFromFailure` sets `invuln + 0.3`.
- During grace, hazards deal no damage (`updateEntities` already gates on `invulnerabilitySeconds <= 0`) and the hero blinks (alpha 0.6–1.0) so the window is legible. `grantGrace()` only ever extends, never shortens. The window is exposed on `RunnerLoopSnapshot.invulnerabilitySeconds`.

### Shark/Tiburoncín rescue grace timing (nuanced — the gift is the air itself)
- **First rescue:** the `shark_catch` discovery beat freezes the run as a readable "rescue moment". Grace is **deferred** (`pendingSharkGrace = 0.8`) and applied in `dismissDiscoveryBeat()` at the unfreeze point, so it starts *after* resume, not while time is frozen.
- **Later rescues:** no grace and no big star burst **by default** — restored air is the reward. Grant a short grace **only if the hero is genuinely at risk**, i.e. already inside a post-hit i-frame window (`loopSnapshot.invulnerabilitySeconds > 0`, meaning recently hit / reserve used); then extend by ~+0.4s.
- Subsequent shark touches are also visually subdued (smaller burst/motes/feedback) vs the first.

## 3. Pause freeze
- Pause is a **hard freeze**: `JourneyScene.update()` returns immediately when `this.pauseOpen` is true, stopping runner, backdrop, shark, finish, and feedback together. Overlay tweens run on the tween manager, so the panel still animates; resume continues from the frozen frame.
- `openPauseStage()` also calls `haltSharkEvent()` so no shark sits/ghosts behind the overlay.

## 4. Tiburoncín (shark) state correctness
- The shark must be hidden/halted whenever an overlay owns the screen: **pause, fail, victory** all call `haltSharkEvent()` (fail/victory already did; pause added). Discovery beats intentionally keep it visible only for `shark_sighting` / `shark_catch`.
- It is a periodic helper — dropping one in-flight fly-by on a state change is fine; the next one re-triggers after cooldown.

## 5. BootScene = invisible technical handoff (NOT a screen)
- `BootScene` renders nothing but the page-dark background (`#0b1017`). No seed, progress bar, copy, animation, or fake delay.
- The DOM cover (`#entry-shell`) stays up in its loading state until the first Phaser screen announces itself via `mateo:ui-screen` (LevelEntry `chapter`/`loading`, Journey `playing`, or BootScene on load failure); `handleUiScreen()` then fades the cover out. `bootGame()` no longer hard-removes the cover at 220ms — only a 4s safety fallback remains. Net effect: cover → level entry, with no perceptible Boot flash.

## 6. Final-note contact
- The hero glides to the note (`finishReach`, Cubic.Out) and touches it before any celebration; `victoryBounce = 0` (no pre-contact hop). The post-contact celebration float is scaled by `finishFloatProgress` so it eases in from zero — no snap/pop at the contact beat.
- **Remaining (future animation polish, not done — do not risk the finish state machine):** the hero still *slides* horizontally to `FINISH_HERO_REACH_X` to meet the note. A more natural feel would be to move/absorb the **note into the hero** at the hero's running position instead of sliding the hero to a fixed point. This is a finish-flow rework (`FinishFlow.update()` in `src/game/systems/overlays/FinishFlow.ts` + the reach constants, same file) and should be a dedicated slice with its own validation.
