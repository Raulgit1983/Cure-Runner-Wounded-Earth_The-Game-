---
tags: [cure-runner, mateo-game, memory, design, level-03]
updated: 2026-08-09
---

# Level 3 — The Black Forest (built)

> To see this in Obsidian, the repo/`docs` folder must be opened or mirrored into the Obsidian vault. There is no assumed external sync; `docs/memory/` is the stable layer.

## Current decision (2026-08-09) — supersedes the 2026-06-21 gate below
**Level 3 is The Black Forest, and it is built.** Raúl's decision replaced the
earlier "do not build yet" gate and the "Pulse Canyon" placeholder. Landed in
`feat(stage): add The Black Forest vertical slice`.

Stage chain: `wounded-planet → moonlight-mountain → black-forest → end`
(`moonlight-mountain.nextStage` changed from `null` to `black-forest`).

### What is actually playable
- Entry screen as "Nivel 3 — The Black Forest", lazily loading its own art.
- Image backdrop from Mateo's `BG 2` sheet: **`bg-plate`** as a slow-drifting
  mid-plane, carrying the moving eye and mouth as children (see item 4 below),
  and `bg-layer-front` as a foreground pine band. Both are drawn through
  `setTintFill`, so the alpha matte reads light-on-dark with every stroke it
  carries intact. `bg-main` — the same sheet uncut, eye and mouth still baked
  in — is no longer the mid-plane; it is the level-entry illustration only.
- Full run loop: run, jump, double jump, landing, hit, i-frames, reserve,
  pause, retry, finish panel (final-stage variant: Repetir + Inicio).
- Phrase data reusing ONLY verified verbs (grounded shard = jump, overhead
  mirror/crown = duck, ledge = platform route). No new mechanic was invented.
  `phraseFairness.test.ts` covers it at moonlight's stricter floors.

### Open — [PENDIENTE DE RAÚL], do not invent
1. **Ingredient.** Ships as `traits.ingredient: 'pending-neutral'`, a deliberately
   neutral light. It is NOT the Nota Sol and must not be left as the final answer.
2. **Closing message + title.** Currently neutral and factual
   ("Bosque cruzado" / "Llegaste al final."), not a designed ending.
3. **Chomper boss.** Drawn (`Imagenes/Chomper.jpg`) but not designed in. The
   handoff notes the trunk mouth and Chomper's heads are the same drawing.
4. ~~**The eye and the mouth are NOT animated.**~~ — **RESOLVED (2026-08-09,
   local only, not committed).** Both of Mateo's annotated behaviours are wired.
   Historical diagnosis kept below because it explains the constraints the
   integration still has to respect.

   *(historical)* Both were implemented once and removed after testing on a
   phone viewport. Two reasons, both in the assets:
   - the cut-outs carried their own scanner paper wash (~77% of
     `world-02-eye.webp` is partial-alpha paper, not ink), so drawn over
     `bg-main` they doubled up and read as a hard rectangular block;
   - they were extracted at a higher resolution and were not registered to the
     flattened sheet, and the offset was not derivable from the files.

   The fix was an asset step, and Raúl authorised it. `bg-main` was split into
   a **plate** with the eye and mouth lifted out, a **re-cut eye**, and **three
   mouth phases** on one shared 165x183 canvas and anchor. Gameplay now draws
   `black-forest-bg-plate.webp`; `black-forest-bg-main.webp` stays the complete
   level-entry illustration, so the entry screen still shows the baked eye and
   open mouth and has no holes.

   Constraints that came with it, and must not be quietly dropped:
   - **Rest is exactly the authored registration**, eye offset (0,0) — the only
     place the sprite recomposes the plate with alpha RMSE 0. A conserved,
     deliberately unfilled gap in the right eyelid at the eye/canopy junction
     is visible only while the eye is away from rest.
   - Eye travel is capped at **±7 px horizontal / ±3.5 px vertical in source
     coordinates**; that is the margin the art pass reserved, not a taste
     setting. Past it, Mateo's line clips.
   - Rest phase of the mouth is **closed** (Raúl's decision). The three phases
     are swapped as textures and never scaled or deformed; the trunk lives in
     the plate and never moves.
   - Yawn timings (5-9 s gap, 0.26/0.72/0.34 s phases) are technical tuning,
     not canonical text from the drawing.
5. ~~**A faint rectangular seam** is visible in the upper-left of `bg-main`~~ —
   **RESOLVED (2026-08-09, local only).** It was a masked annotation region from
   the original scan, present in the source asset and never introduced by code.
   The approved washed-floor treatment (`alpha = level(6%,92%)`), which shipped
   as part of the same art pass, pushes that faint paper wash to zero while
   leaving the ink. Measured on the upper-left quadrant of the runtime file
   against the untouched `Imagenes/files/world-02-bg-main.webp`: pixels above 1%
   alpha fell from 112,881 to 24,558 and mean alpha from 0.0470 to 0.0286, while
   the standard deviation held (0.1106 → 0.1132) — the wash went, the drawing
   stayed.

## Superseded gate (2026-06-21) — kept for history
**Do not start Level 3 until the current flow + moonlight (stage 2) fairness are stable and verified on a real phone.** Two playable stages exist (`wounded-planet`, `moonlight-mountain`); the active work is entry-flow correctness, mobile responsiveness, and stage-2 fairness — not new content.

Stabilize first (all must be true before Level 3):
1. Entry start is CTA-only on both the DOM cover and `LevelEntryScene` (a tap on art/empty space never starts; help opens help only; help-open never starts).
2. Technical loader (`BootScene`) is a neutral dark handoff — no narrative, no confusing flash.
3. Entry cover fills the phone viewport, respects safe-areas, "Ayuda breve" stays inside the usable area.
4. Moonlight stage 2 feels fair (see [runner reachability rules below](#fairness-rules-of-thumb)) and is confirmed playable by Mateo.
5. Final-note arrival stays a clean glide (no pre-contact hop) and the stray finish button stays gone.

Items 1-3 and 5 are code-complete. Item 4 (**real-phone pass**) is still
outstanding and is now the single largest untested risk across all three stages.

## Direction kept for a future world
- **Rhythm-forward.** Geometry-Dash-*inspired* clarity: readable timing, obstacle cadence tied to the procedural music, immediate retry, music-feel interactions.
- **Original identity, no cloning.** Do NOT copy Geometry Dash UI, art, branding, exact mechanics, level structure, or fail feel. Keep the warm father-son, Wounded Planet / healing / notes / light identity. Emotion is felt through rhythm, light, recovery, clarity, and small choices — not heavy text.
- **Gameplay first.** A new readable mechanic verb (beyond jump-over / duck-under / ledge), introduced via an onboarding phrase before it appears in tension phrases. Black Forest deliberately did NOT introduce one.

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
