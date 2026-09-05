---
tags: [cure-runner, mateo-game, memory, architecture]
updated: 2026-09-05
---

# Project Current State

Compact, high-signal snapshot. Source of truth for agents. Update when a slice lands.

## Current verified snapshot — 2026-09-05

### Latest continuation — Chomper puppet candidate

- Preflight verified clean at `bc8ed3178684dad65952e8dcd57f8f7b0380f036`
  on `visual/world-01-carlitos-drive`. The earlier polish was already committed.
- Raúl explicitly approved the arena finish and authorized the best extraction
  method in response to conventional masks. Six true-alpha pieces now retain
  the approved source RGB; the empty plate uses generated inpainting only around
  the removed figure. Original/source/runtime-approved bytes remain untouched.
- Raúl physically viewed the first motion pass and rejected it as basic,
  discreet and stiff-bodied. He then requested a lunging bite and corrected two
  interim choices: the upper red head must refuse/open/close, and the hazard
  must not fall almost vertically over the hero. Optional DEV route
  `/?encounter=chomper&chomperArt=rig` now runs motion v4. The red head has three
  articulated jaws, shakes twice in warning, descends at the far-left edge,
  sweeps the ground lane left-to-right, closes at contact and exits below/left.
  The encounter collider and puppet use the same path. A localized backlight
  plus a thin moving rim separates the silhouette without changing source RGB.
- Review UI: `/art-lab/2026-09-05-chomper-rig/`; 7 candidate WebPs, 438720 bytes,
  local ignored art-lab assets. Original preview remains available without rig
  downloads. Production still excludes Chomper and every art-lab URL.
- `check`, `build`, `test` (**216/216 in 19 files**) pass. Emulated Chrome checks
  confirm 12 main poses plus 9 bite-path samples, pause, reduced motion, contrast,
  6-note/3-life victory by jumping, retry, route and gesture-unlocked audio.
  Bite warning and impact are distinct. Raúl then viewed v4 on his phone,
  answered «Muy bien» and asked to save it before a new editorial/art pass.
- Changes are saved as the local checkpoint at the current Git HEAD; verify its
  exact hash on entry. No push, deploy, install, payment or Claude call.
  See [Chomper rig continuation](chomper-rig-2026-09-05.md) and CONTINUE_HERE.

### Previous September polish snapshot

- Branch `visual/world-01-carlitos-drive`. Clean preflight base:
  `e1480b0105edd6217fd0016d624f7851ab3c1216`; the September polish is saved in
  one local commit after that base. It has not been pushed or deployed. Remote state
  has not been checked this turn; do not reuse the old ahead/behind counts.
- **Codex/Astra now implements directly. Claude delegation is inactive**, by
  Raúl's latest instruction. See the production-stack contract.
- All three stages are image-backed. Wounded Planet and Moonlight Mountain use
  `ImageBackdropRenderer`; Black Forest uses its colour-v4 plate, iris and three
  mouth states, with no tint-fill recolouring. Original/source assets unchanged.
- Forest compositing: fully opaque art assembly, then one sky-coloured veil.
  Container alpha is NOT group opacity in Phaser: it faded each patch separately
  and exposed the plate underneath. The new veil preserves registration and
  avoids this tonal mismatch without an offscreen buffer or new runtime asset.
- `PauseFlow` now disposes its owned tweens/UI synchronously and idempotently;
  no shutdown tween or resume call. Key repeat is ignored. Pause/help panels
  contain their full button rows.
- **199 tests in 17 files**, including 9 PauseFlow lifecycle/input tests, 6
  forest renderer tests, 17 Chomper rules tests and 7 auxiliary-art contracts.
  Baseline: 160 tests excluding worktrees. `vitest.config.ts`
  now restricts discovery to `src/**/*.test.ts`; the old 280 total is not a
  current unique-test count. Three selected regressions fail against base HEAD.
- `check`, `test`, `build`, `git diff --check` pass. Chrome smoke at **360×640,
  DPR 2 (emulated)**: all three stages, key repeat, restart from pause/help/closing,
  no page errors or HTTP failures, no forest image requests at initial entry.
  This is NOT a physical-device or human playability pass. The two existing
  reward-contact sequences were rendered in-browser using a completion fixture.
- Notes/platforms now use retained, code-native artwork: connected musical
  silhouettes and a clear flat support edge. The two existing rewards are a
  drawn clef medallion and engraved lunar shard, without a symbol-font dependency.
- **Chomper was explicitly authorized as a fourth scene** by Raúl this turn.
  Its isolated fixed-step model implements three rotating telegraphed attacks,
  jumps, three lives, six recovery notes, pause, retry, home and neutral victory.
  These are provisional tuning choices, not inferred notes from Mateo's drawing.
- The scene is a **DEV-only playable preview**: Black Forest's Seguir reaches it;
  `/?encounter=chomper` is a direct QA entry. Production retains its prior final
  stage until art/encounter review. Boss art loads from art-lab only in DEV.
  Browser integration reached victory with 6 notes / 3 lives, defeat, retry,
  paused clock and the forest-to-boss route, with no reported errors.
- After a temporary tool usage block, the full browser pass was repeated:
  emission paths and normal guarded continuation render/run without errors;
  2 low + 2 high + 2 bite warning events, 6 pickup events and 1 victory event were counted,
  all gesture-unlocked. This does not replace listening on real hardware.
- Production build contains no Chomper scene chunk or art-lab URL. The boss is
  not silently enabled or shipped with an unavailable local image.
- Forest-floor texture is a candidate only, not loaded by normal gameplay.
  Chomper's corrected arena matte is a candidate used by the DEV preview only.
  Both await subjective selection; do not promote rejected fake-alpha outputs.
- Existing three-stage physics, hitboxes, collisions and difficulty are unchanged.
  AST comparison: all 66 unaffected runner members identical to HEAD; only four
  art methods changed and one unused painting helper removed. Existing runtime
  image bytes and Mateo's source images are unchanged. No new ingredient/ending.
- Next: before any deploy, audit every text surface, typography, palette,
  composition and chapter ending; reframe Moonlight Mountain around its centred
  moon and title, integrate the Black Forest floor, and redesign the final as a
  full-screen invitation for players to send ideas and build the game together.

Evidence and paths: [September polish](polish-2026-09-05.md).

## Historical snapshot — 2026-08-09 (superseded, retained for provenance)

**Everything below is historical, not a claim about the current checkout.**
Old HEADs, uncommitted counts, texture names, test totals and hardware results
must not override the verified snapshot above. Some later August work was
already committed before the September preflight.

### Batch `da731e0..` on `visual/world-01-carlitos-drive`
**The branch is five commits ahead of the remote and none of them are pushed:** the four-commit functional batch below, plus the documentation commit `03382fc`, which is `HEAD`.

The functional batch is four commits. All of `npm run check` / `npm run build` / `npm test` (**93 tests at the time**; 114 now, after the eye/yawn slice) green at each one.

1. **`da731e0` `feat(assets): add Devilz animation pack v2`** — 46 files. Ten poses per character as 512x512 RGBA WebP, plus pose sheets and `previews/` (QA only, never loaded). The v1 `src/assets/devilz/*.webp` line art is untouched on disk.
2. **`c256b85` `feat(character): animate Devilz and refine mobile selection`** — see the playable-characters section below.
3. **`1eb0033` `fix(companion): prevent one-frame shark flashes`** — see the Tiburoncín section below.
4. **`bf900b1` `feat(stage): add The Black Forest vertical slice`** — third playable world; see the Black Forest section below.

### Playable characters (`c256b85`)
- **Only devi/lovu/divu are selectable.** Carlitos is now `SUPPORT_CHARACTER_ID` — kept in the registry so an old saved `hero` preference resolves without throwing, and so his `main` texture is available for "El Latido de Carlitos" (the visual form of the existing reserve: a warm presence while one is held, a brief protective light on the existing `reserve_spent` cue — no button, meter, charge rule, collision or balance change).
- Only his `main` pose is imported; the other four hero WebPs stay on disk but out of the bundle (~370 kB saved).
- The character is a **`Sprite`**, so `Phaser.Animations` runs the authored cycle (`contact → pass → push → pass`, 10 fps). [CharacterAnimator.ts](../../src/game/systems/character/CharacterAnimator.ts) + Phaser-free [characterPoseState.ts](../../src/game/systems/character/characterPoseState.ts) resolve one strict priority: **finish → hit → landing → jump → run**. The landing moment is the **rising edge of the runner's own `landingBurst`** — deliberately not a second detector.
- **Animations advance on the animation manager, not from `Scene.update()`.** The cycle is therefore explicitly frozen while paused and whenever the runner stops covering ground; otherwise the character ran on the spot behind every overlay. This is a real trap for anyone touching the update loop.
- **Floating-Devilz fix.** Pack v2 pads a 512x512 canvas with ~85 px of transparency below the character, while Carlitos' canvas is cropped tight (512x458, full bleed). Sizing/footing from `texture.height` therefore left the Devilz **18–26 px above the floor** and drew the selector silhouette at only ~81–95 px. `CharacterArtMetrics` now records measured alpha bounds, and the correction is derived from them plus the runner's own `groundLineY - runY` support offset — **no per-character magic number**. A grounded clamp (`GROUNDED_FOOT_TOLERANCE_PX = 3`) keeps the visible feet on the ground or platform. Measured in-browser: all three characters now stay within ±3 px during run and landing.
- **Gameplay scale was NOT changed** — `getGameplayScale()` still divides by the source canvas height on purpose. Switching it to visible height would resize every character in play (the hitbox is fixed at 62x96) and is a separate, unauthorised decision.
- Entry picker replaced by a **swipe carousel**: 26 px threshold, vertical-dominant gestures rejected, 46 px arrow targets, side-portrait taps, name, dots and the exact string `Desliza para elegir`. Portraits are fitted and centred on the **drawing's alpha bounds**, not its canvas. The CTA is still the only way to start.
- **Ovals:** the hero aura lost its two steady terms (`auraAlpha * 0.22`, `surfaceProgress * 0.05`) which never reached zero, so the character carried a permanent ellipse for the whole run. It is now purely transient and hidden at rest. The carousel's persistent plate behind the portraits was deleted. **`heroShadow` (ground contact) was kept.**
- Physics untouched: `RunnerLoopSystem`, `runnerConfig` and `heroProfile` have an empty diff.

### Tiburoncín one-frame flash (`1eb0033`)
- **Root cause, reproduced in-browser:** `updateSharkEvent()` called `setVisible(true)` on the spawn frame and then `return`ed **before any `setPosition()`**. The container still held the transform from its previous fly-by — left there by `haltSharkEvent()` (pause/fail/victory) or by the contact hide — so the first visible frame drew the shark at that stale spot, often next to the player. Measured: halted mid-flight at `x=259.8`, next appearance's first visible frame at `x=259.8` on screen, then a **170.9 px jump**. After the fix: first frame at `x=434` (off-screen entry), max step **3.1 px**.
- A discovery beat made it worse: `updateSharkEvent()` is skipped while a beat owns the screen, so a beat triggered on the spawn frame left the shark parked on screen for the whole freeze.
- Replaced the `sharkActive`/`sharkTagged` pair with an explicit lifecycle **`hidden → flying → exiting → hidden`**. `placeShark()` is the single writer of the transform and runs **before** the container is shown; `hideShark()` is the single exit (kills the tween, clears the phase, resets alpha, parks off-screen at `x=-180`) and every path routes through it. Contact now fades over 260 ms (120 ms under reduced motion) instead of blinking out.
- **Rescue behaviour unchanged**: air restored, grace timing, cooldown ranges, burst sizes, discovery beats and guidance lines are all identical.

### The Black Forest (`bf900b1`)
- Third playable stage. Chain is now `wounded-planet → moonlight-mountain → black-forest → end`; **`moonlight-mountain.nextStage` changed from `null` to `black-forest`**.
- Runtime art copied to `src/assets/worlds/black-forest/runtime/` as `black-forest-*`; the originals in `Imagenes/files/` are untouched. Loaded lazily by `JourneyScene.preload()` when that stage starts — boot is unchanged for a player who never reaches it.
- [BlackForestBackdropRenderer.ts](../../src/game/systems/backdrop/BlackForestBackdropRenderer.ts) is delegated to via a new [StageBackdrop.ts](../../src/game/systems/backdrop/StageBackdrop.ts) interface, rather than growing the Graphics-only `BackdropRenderer`. Mateo's sheet is a **pure alpha matte** (every pixel black, graphite encoded as alpha), so it renders through `setTintFill` — colour replaced, alpha untouched, every stroke and all shading intact.
- The foreground pine band sits **entirely below the ground line** (top edge y=572 vs floor y=548), so it can never cover the hero, a hazard or a collectible.
- **Every `backdropKind === 'moonlight-mountain'` binary is gone**, replaced by explicit `JourneyStageTraits` (`paletteVariant`, `sharkIntro`, `offersSecondChance`, `ingredient`). A fourth world must now state what it wants instead of inheriting Wounded Planet through an implicit `else`.
- Overlay copy is keyed per stage, and finish body/closing follow `nextStage`. This fixed a latent bug: moonlight's finish text said "no hay más niveles todavía", which became false the moment it gained a successor.
- Phrase data reuses **only verified verbs** (grounded shard = jump, overhead mirror/crown = duck, ledge = platform). `phraseFairness.test.ts` covers the stage at moonlight's stricter floors and **caught two real spacing defects during authoring**.

### The eye and the mouth (2026-08-09, local only — NOT committed, NOT pushed)
Mateo's two annotations on the sheet, "Follows The Player" and "Yawns Randomly", are wired. This supersedes the earlier note that they were deliberately left inert; the blocker was the assets, and an approved art pass cleared it.

- **Asset split.** `bg-main` became a **plate** (eye and mouth lifted out) plus a **re-cut eye** (177x91) and **three mouth phases** (165x183, one shared canvas and anchor). Verified by the art pass to recompose the original at alpha RMSE 0. Runtime draws `black-forest-bg-plate.webp`; **`black-forest-bg-main.webp` is now the level-entry illustration only** and keeps the eye and mouth baked in, which is what stops the entry screen showing holes. It was also replaced with the approved washed-floor treatment. The `Imagenes/files/` originals are untouched.
- **One container.** Plate, eye and mouth are children of the same `midPlane`, with the same scale, `setTintFill`, alpha, drift and parallax. Nothing can separate from the drawing. Container children are drawn in list order, so the order is plate → eye → mouth.
- **Eye.** Offset = the player's displacement from where the same player is drawn while simply running, eased with `1 - exp(-dt * k)`, clamped to **±7 px horizontal / ±3.5 px vertical in source coordinates** — the margin the art pass reserved, not a taste setting. Rest is exactly (0,0), because that is the only registration where the sprite recomposes the plate perfectly and because a conserved unfilled gap in the right eyelid shows only when the eye is off-rest. Reduced motion pins it neutral.
- **Mouth.** Texture swap only, never a procedural scale. Rest phase **closed** (Raúl's decision). Cycle closed → mid → open → mid → closed, with a random 5-9 s gap between yawns.
- **New generic contract.** `BackdropFrameTargets` gained `heroX/heroY/heroRestX/heroRestY`. `JourneyScene` fills them for every stage with **no stage branch**; `BackdropRenderer` ignores them. The rest pair is passed rather than assumed because a grounded character's rendered anchor is **not** `runnerConfig.hero.runY` — each character's footing correction moves it (Devi rests at y=516.24, measured).
- **[YawnClock](../../src/game/systems/backdrop/blackForestYawn.ts) is Phaser-free and unit-tested (21 tests, of a 114-test suite).** Injectable RNG; the default is a self-contained mulberry32 seeded from the clock, deliberately **not** `Math.random()`, so a decorative mouth cannot shift the global random stream that Tiburoncín's cooldowns draw from. A huge delta (backgrounded tab) is caught by a transition guard that settles the mouth closed instead of replaying hundreds of invisible yawns.
- **Pause vs reduced motion are different on purpose.** Pause is a hard freeze — `JourneyScene.update()` early-returns before the backdrop, so the yawn resumes on the exact phase and remainder it stopped at (measured: identical to 9 decimal places across a 5 s pause, frozen mid-yawn). Reduced motion instead holds the mouth closed and cancels a yawn in flight.
- **`vite.config.ts` now opts `src/assets/worlds/black-forest/runtime/` out of asset inlining** (`build.assetsInlineLimit` as a callback: `false` for that directory, `undefined` everywhere else). The re-cut eye (3.5 kB) and closed mouth (2.8 kB) sit under Vite's 4 kB default and were being emitted as base64 inside the JourneyScene chunk, shipping to players who never reach the third world. Do not "simplify" it back to a number, and do not pad the WebPs to clear the limit — that would mean altering Mateo's art to suit a bundler.
- Physics untouched: `RunnerLoopSystem`, `runnerConfig` and `heroProfile` have an empty diff.

## What exists (Fact)
- Stack: Phaser `3.80`, TypeScript `5.7` (strict), Vite `5.4`. Logical canvas `360x640`, `Scale.FIT`.
- Module layout: `game/{scenes,systems,services,content,state}` + `ui/`. Alias `@/ -> src/`.
- Data-driven core already present:
  - Tuning: [runnerConfig.ts](../../src/game/content/runnerConfig.ts)
  - Level "phrases" (x/y obstacle/collectible chunks): [runnerPhrases.ts](../../src/game/content/runnerPhrases.ts), assembled per stage in [journeyStages.ts](../../src/game/content/journeyStages.ts)
  - Run state pub/sub store (no Phaser coupling): [sessionState.ts](../../src/game/state/sessionState.ts)
  - Pure mood interpolation: [EmotionController.ts](../../src/game/systems/emotion/EmotionController.ts)
- Playable content today: **three** continuous distance-based stages — `wounded-planet`, `moonlight-mountain` and `black-forest`. **No discrete level 4-10 content.**
- Playable-character registry: [playableCharacters.ts](../../src/game/content/playableCharacters.ts). Four registered, **three selectable** (`devi`, `lovu`, `divu`); `hero` is support-only. Default is `devi`. Art is animation pack v2 (`src/assets/devilz/animation-pack-v2/`); the v1 12-webp set from `4072b60` is still on disk but unreferenced.
- Audio: procedural WebAudio via [audioCueBus.ts](../../src/game/services/audio/audioCueBus.ts) + [reactiveAudioLayer.ts](../../src/game/services/audio/reactiveAudioLayer.ts). Zero audio asset files.
- Persistence: [localProgressStore.ts](../../src/game/services/persistence/localProgressStore.ts) — localStorage key `mateo.spark-journey.progress.v1`, stores only `awakeningLevel` + `collectedSparks`.
- Deploy: GitHub Pages via [deploy-pages.yml](../../.github/workflows/deploy-pages.yml) on push to `main`.
- Dev server: port `5174`, `strictPort: true` in both `vite.config.ts` and the `dev`/`preview` npm scripts.

## What was just changed (Fact — PauseFlow batch 2026-07-02/03 `833b8aa..f40c1fe`; DiscoveryFlow/FailFlow slice 2026-07-11 `e5db723..68bf6c1`; FinishFlow slice 2026-08-08 `34808f4`)
All of the below is now in `HEAD`. The PauseFlow batch was verified by isolating each commit (`git stash` where other uncommitted work existed, otherwise a clean-tree rebuild) and re-running `npm run build` + `npm test` before moving to the next. The DiscoveryFlow/FailFlow slice was verified at full-tree `HEAD` only — `tsc --noEmit` clean, `vite build` succeeds, `vitest run` 57/57 green — browser smoke test still pending. The FinishFlow slice (last bullet) was verified the same way, **plus a manual browser/mobile smoke test of the finish sequence** (reached the end of `wounded-planet`, confirmed the note contact and victory panel render cleanly).

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
- **`DiscoveryFlow` + `FailFlow` extracted** (`68bf6c1`, roadmap priority 4, second overlay slice — the docs-only `e5db723` is the CLAUDE.md operating-protocol section, unrelated): [DiscoveryFlow.ts](../../src/game/systems/overlays/DiscoveryFlow.ts) (338 LOC — one-time discovery beats as either a transient HUD hint routed through the host, or a run-freezing panel rendered here; id→beat resolution, session dedup and queue-while-active move in, trigger call sites stay in the scene) and [FailFlow.ts](../../src/game/systems/overlays/FailFlow.ts) (265 LOC — the retry scrim/panel, resolved+restart-queued state, pointer-debounced restart; `begin()` is the single place that stops every other in-flight system before showing retry, so its host surface is the widest of the three). Both follow the `PauseFlowHost` pattern (a `*FlowHost` callback interface keeps scene-owned decisions — can-show/can-fail guards, freeze/resume, restart — in `JourneyScene`), and both expose a dual-role `hasSeenBeat`/`isResolved()` read that ~15 unrelated systems gate on, exactly like `GuidanceDirector`'s keys and `PauseFlow.isOpen()`. Extracted alongside: [discoverySessionCache.ts](../../src/game/systems/overlays/discoverySessionCache.ts) (87 LOC, **Phaser-free and unit-tested**, sessionStorage key `cure-runner.discovery-beats.v1` — session-scoped, deliberately unlike `GuidanceDirector`'s per-run reset) and the shared `DISCOVERY_BEATS` table + fail copy (both stages) now in [overlayText.ts](../../src/game/content/overlayText.ts). `JourneyScene.ts` is now **1841 LOC** (down from 2418). Only the **finish** overlay remains inline.
- **`FinishFlow` extracted** (`34808f4`, slice 4c — roadmap priority 4 complete, last overlay out of the scene): [FinishFlow.ts](../../src/game/systems/overlays/FinishFlow.ts) (808 LOC) takes the four pieces that always moved together — the note-contact sequence, `finishReward`, `finishMessage` and `continueStage` — plus the finish scrim/glow and the two stage-variant ingredient factories (`createWoundedIngredient`/`createMoonlightIngredient`, ~230 LOC of art that existed only to build finish's two containers; same precedent as `BackdropRenderer` owning both stage painters). Follows the `*FlowHost` pattern: the scene keeps the `victoryFrozen` latch, the return-home latch, the shark, the hit reaction, the light-mote emitter and every scene transition (continue/replay/home); `FinishFlow` keeps the finish objects, the 0→1 sequence clock, the contact beat and the panels. **The per-frame hero read contract is preserved intact and is the reason this slice was left for last**: the sequence is a scene-clock ramp, not a tween, so `JourneyScene.update()` still drives and samples it in the same order via three calls — `advance(deltaSeconds)` (old advance site), `decayPulse(deltaSeconds)` (feedback-decay block; the pulse also feeds the hero aura, so it decays even when finish never resolves), and `update(time, loopSnapshot, failResolved)` at the old `updateFinishObjects()` site, which must stay *ahead* of the hero block because that call is where `beginVictoryBeat()` fires. The hero block then pulls `isResolved()` + `getSequence()` and does its own easing exactly as before — converting that pull into an event is explicitly future work, not this slice. `requestReplay()` is public because the pause panel's Repetir routed through the same scene method before extraction and keeps sharing its `continueResolved` double-tap guard. Finish + continuation copy moved to [overlayText.ts](../../src/game/content/overlayText.ts), matching fail/discovery. The pending note-absorption redesign from [gameplay-fairness-rules.md](gameplay-fairness-rules.md) § 6 is carried verbatim into the `FinishFlow` class doc-comment. `JourneyScene.ts` is now **1221 LOC** (down from 1841). **No overlay remains inline.**

- **Playable characters: the three Devilz are wired and playable** (`0ef5c57`, 2026-08-08, on top of `4072b60` which added the art). Adding a character is now additive data, not scene surgery.
  - [playableCharacters.ts](../../src/game/content/playableCharacters.ts) (96 LOC): `PlayableCharacter` = id + displayName + `CharacterPoseSet` + `mobileScale`. Each pose carries `{ key, url }` so preload can walk the registry. `CHARACTER_RENDER_ORIGIN` is a **shared** constant sourced from `heroProfile.renderOrigin` — deliberately not per-character, since pose art is authored against one anchor. `heroProfile.ts` is untouched and stays the source of truth for the hero's numbers.
  - [localPreferenceStore.ts](../../src/game/services/persistence/localPreferenceStore.ts) (60 LOC): key `mateo.spark-journey.preferences.v1`, **separate from** `localProgressStore`'s progress key by design — `restartRun()` rebuilds run state and "Inicio" calls `localProgressStore.clear()`, either of which would silently discard a choice stored in `PersistentProgress`. Returns a valid default on unknown/corrupt input and never throws.
  - `JourneyScene.resolveHeroTextureKey()` **generalized, not duplicated** — one switcher reading the active character's pose keys. Priority order, the `-32 / +32 / 12` thresholds and the `0.15s` hit lock stay module constants shared by every character. `HeroTextureKey` widened from a union of hardcoded hero keys to `string`. `BootScene.preload()` now loops `listAllCharacterPoses()` (16 textures) instead of one `load.image` per file. `JourneyScene.ts`: 1221 → 1249 LOC.
  - Picker in [LevelEntryScene.ts](../../src/game/scenes/LevelEntryScene.ts) — a single row of four portraits at logical y=428, in the band between the entry art (ends ~y412) and the copy card (starts y444). **No new scene.** Visual portraits are 30px but each hit box is 46px, decoupled so the target stays tappable for a child (same trick as the CTA's oversized hit area). Selecting writes the preference immediately; `JourneyScene.create()` re-reads it, so it survives retries and stage changes.
  - (historical — superseded by pack v2, which ships `finish-awakened` for all three) **The Devilz have no `finish-awakened` art.** `devilzProfiles.ts` names a `finish` key for each, but no such file exists — so `finishAwakened` is deliberately left **unset** in the registry rather than pointing at a URL that cannot resolve. The switcher's `textures.exists()` guard then falls through to that character's own `main`. Verified it never leaks `hero-finish-awakened`, which *is* loaded in the texture manager.
  - **Jump physics untouched**: `RunnerLoopSystem.ts`, `runnerConfig.ts` and `heroProfile.ts` have an empty diff. The registry carries no jump/gravity/velocity/timing field; `mobileScale` (on-screen size) is its only gameplay-adjacent value.
  - **`catchRadiusPx` is NOT wired per character.** `devilzProfiles.ts` declares differing values (devi 56, lovu 48, divu 40), but nothing reads them — see the dead-config note below. All four characters share `runnerConfig.rewards.collectRadius` (40). Honouring the per-character values would be a difficulty change requiring `RunnerLoopSystem` surgery, and was explicitly ruled out.

## What is verified (Fact)
- `tsc --noEmit` exits 0, `vite build` succeeds, `npm test` is **114/114 green on the current working tree** (48 → 57 when the DiscoveryFlow/FailFlow slice added 9 `discoverySessionCache` tests → 93 after the 2026-08-09 batch → 114 once the eye/yawn slice added 21 `blackForestYawn` tests). The PauseFlow batch was confirmed both at the full tree and isolated per-commit; the DiscoveryFlow/FailFlow slice was confirmed at full-tree `HEAD` (not per-commit).
- The moonlight fairness data invariants (5 tests) only pass once `c509948` (the phrase redesign) is present — expected: they encode the redesigned data, not the pre-redesign phrases. No longer a caveat now that `c509948` is committed.
- Browser smoke test (Chrome, pre-`dc933f5`, same bytes as committed): entry cover → CTA starts run → backdrop/hero/collectibles render, "Notas."/"Golpe." discovery beats fire once each and don't re-trigger, Repetir resets per-run guidance, moonlight backdrop (sky/moon/mountain/crystal layers, parallax) renders correctly through `BackdropRenderer`, pause hard-freeze works, zero console errors throughout.
- Browser smoke test (Chrome, post-`f40c1fe`, this exact `HEAD`): PAUSA button opens the pause panel through `PauseFlow` with a hard freeze behind it, Ayuda swaps to the help panel and Volver swaps back, Continuar resumes and unfreezes, keyboard P opens / Escape closes, both keys correctly no-op while a discovery beat owns the screen, zero console errors.
- `getFirstLevel().stageKey === 'wounded-planet'` — same stage reference as before the level-registry slice.
- **The DiscoveryFlow/FailFlow slice has NOT had a browser smoke test yet.** It's typecheck- + build- + unit-test-verified, and the extraction is described as verbatim moves, but nobody has confirmed in Chrome that discovery beats still fire/dedup and that fail→retry still resolves through the new modules.
- **Devilz browser verification (2026-08-08, headless Chromium at iPhone-13 viewport, `wounded-planet`):** entry picker renders four portraits with Carlitos selected by default; tapping Devi moves the selection ring and dims Carlitos; entering the level renders Devi at the correct position/scale; jumping switches Devi to its air pose; a long run survives hits, reserve fill and discovery beats with **zero page errors**. Two gaps: the run did **not** reach the finish sequence (two attempts, 110s and 260s — a blind-jumping driver eventually dies, and a tap on the retry scrim restarts the stage, so distance keeps resetting; this is a limitation of the automation, not of the code), and **Lovu/Divu were not driven individually** — they share the exact same code path as Devi, but that is inference, not observation.
- The **missing-finish-pose fallback** is verified by an isolated replication of the switcher's branch logic (6/6 cases), including the case that matters: with `hero-finish-awakened` present in the texture manager, a Devilz still resolves to its own `main` and never leaks the hero texture. It is **not** yet verified by playing the finish sequence to completion.
- **The FinishFlow slice has a partial manual smoke test only.** Confirmed on a real phone, `wounded-planet` stage: reaching the note, the contact beat, and the victory panel render cleanly (no snap/hop, no console-visible breakage reported). **Not yet confirmed**: `moonlight-mountain`'s final-stage panel (Repetir+Inicio instead of Seguir, and that Repetir restarts cleanly), fail-before-finish (retry panel hides the finish preview), and pause→Repetir (still debounced, no double restart). Finish is still the **highest-risk** overlay of the three to leave partially unverified, because the finish sequence is the one overlay the hero-position update reads every frame.

## What is NOT implemented (Fact)
- Firebase: [firebaseGateway.ts](../../src/game/services/backend/firebaseGateway.ts) is a **no-op stub, imported by nobody**, no SDK in `package.json`. Do not describe as implemented.
- No `LevelDefinition` consumption beyond resolving the initial stage. No level select, no unlock/progress-per-level state.
- Levels 4-10: not authored.
- No PWA manifest / service worker.
- Tests cover pure state/data only — scenes and the runner loop itself are still untested (Phaser-coupled), including `PauseFlow`/`DiscoveryFlow`/`FailFlow`/`FinishFlow` (Phaser-coupled end to end; verified by browser smoke test instead). The one exception is `discoverySessionCache`, extracted Phaser-free alongside `DiscoveryFlow` specifically so it could be unit-tested (9 tests).
- `HelpFlow` does **not** exist and is not planned — quick help is a nested panel owned by `PauseFlow`, not a separate module. Do not invent it.
- **There is no `docs/devilz-motion-phase1-handoff.md`.** It has been referenced in task prompts but does not exist. The similarly-named [hero-motion-phase1-handoff.md](../hero-motion-phase1-handoff.md) is the *original hero's* pose handoff — a different document. `devilzProfiles.ts`'s header comment is the closest thing to a Devilz contract.
- ~~**⚠️ Color-fill for the Devilz has NOT landed yet**~~ — **RESOLVED**: animation pack v2 ships fully coloured art. Historical note follows.
- (historical, 2026-08-08) All 12 files in `src/assets/devilz/` are still byte-identical to `4072b60` (line art, e.g. `devi-main.webp` = 15648 bytes, not the ~38KB a filled version would be). Searched the whole remote container's disk for the filled files by name — not present anywhere outside the repo's own (unchanged) copies. Each Claude Code session here runs in a **fresh, disposable remote container** with no access to Raúl's local machine — a file only reaches this repo via `git push` to `visual/world-01-carlitos-drive`, same as the original 12 files did. Putting colored files on the local Mac alone does not update this repo.
- ~~**⚠️ The three Devilz are line art with no fill**~~ — **RESOLVED** by animation pack v2. Historical note follows.
- (historical, 2026-08-08) They are black outline sketches on transparency; the game's backdrop is near-black (`#0b1017`), so on screen they read as faint scribbles — confirmed in a browser pass on `wounded-planet` (see verification below). The hero is fully coloured and shaded by comparison. **This is an art-content gap, not a code bug** — the switcher, scale and origin all behave correctly. Per CLAUDE.md's Creative DNA, this is reported rather than "fixed": adding fill, recolouring, or bolting on a glow/outline would be altering Mateo's drawings, which is the developer's call, not an agent's. Options if it needs solving: colour/fill the source art (preferred — stays Mateo's hand), or introduce a readability treatment applied equally to every character.
- `heroProfile.collision.catchRadiusPx` (48) is **dead config — nothing reads it.** The real pickup radius is `runnerConfig.rewards.collectRadius` (40), squared once at module scope in [RunnerLoopSystem.ts](../../src/game/systems/runner/RunnerLoopSystem.ts) (`collectRadiusSquared`), so it is not per-instance today. Making catch radius vary per character would be a **difficulty change** requiring gameplay surgery, and was explicitly ruled out of the character work: all characters share radius 40.
- **Real-phone verification of the fairness/entry-flow pass has not happened.** Everything above is code-committed and Chrome-verified, but nobody has played it on an actual mid-range Android device yet.

## Immediate next priorities (Next action — in order)
1. **Real-phone pass. This is now the single largest untested risk.** Everything below was verified with headless Chromium at an iPhone-13 viewport with touch emulation — never on a physical device. Three stages, three characters, and a new image backdrop are all unvalidated on real hardware.
2. **Decide the Black Forest creative gaps** — ingredient, closing message, Chomper boss. All three ship as explicit `[PENDIENTE DE RAÚL]` placeholders and must not be left as the answer. See [level-03-direction.md](level-03-direction.md).
3. ~~Decide whether to re-export Mateo's `world-02` cut-outs~~ — **DONE (2026-08-09).** Raúl approved the art pass and the local integration; the eye tracks and the mouth yawns. See the Black Forest section above. Still uncommitted.
4. Expand `LevelDefinition` (tuning overrides, phrase pools, mechanic flags) — still metadata-only.
5. Then author further levels as data.

## Known risks (Risk)
- [JourneyScene.ts](../../src/game/scenes/JourneyScene.ts) is ~1413 LOC (3255 → 2418 → 1841 → 1221 → 1381 after the character/shark/stage work → 1413 after the eye/yawn slice). Pose resolution moved out to `CharacterAnimator`; what is left is the shark director, guidance moments, hit reaction, debug overlay and the window-event plumbing — decompose those only if a concrete need appears, one system per commit.
- **`FinishFlow`'s per-frame contract is the sharpest remaining edge.** Three ordered calls per frame (`advance` → `decayPulse` → `update`, the last strictly before the hero block) encode behavior that a plain "tidy up `update()`" refactor would silently break, because `beginVictoryBeat()` fires inside `update()` and the hero block reads the result in the same frame. Do not reorder those calls without a browser smoke test of the finish sequence.
- Runner entities are created per spawn with no pooling → GC churn on mobile (perf, not correctness).
- Mobile FPS / input latency on real mid-range Android: **Needs verification** (no device pass on record). Level 3 was built on Raúl's decision without it, so this is now an outstanding risk across three stages rather than a gate.
- GitHub Pages "source = GitHub Actions" setting: **Needs verification** in repo settings.

## Strict "do not assume" list
- Do **not** assume anything in the 2026-08-09 batch was tested on a physical phone — none of it was. Headless Chromium at a phone viewport is not a device pass.
- Do **not** assume The Black Forest is creatively finished — its ingredient, closing message and boss are explicit placeholders.
- Do **not** assume the forest's eye or mouth are still unwired — that was true until 2026-08-09 and is now stale. Both animate; the constraints they carry (neutral rest, ±7/±3.5 source-px cap, closed rest phase, texture swap never a deform) are in `BlackForestBackdropRenderer`'s class doc and in [level-03-direction.md](level-03-direction.md).
- Do **not** assume gameplay draws `black-forest-bg-main.webp` — it draws `black-forest-bg-plate.webp`. `bg-main` is the level-entry illustration only, and it must keep the eye and mouth baked in or the entry screen gets holes.
- Do **not** re-add a `backdropKind === '<stage>'` binary. Add a field to `JourneyStageTraits` instead, or a fourth world will silently inherit Wounded Planet.
- Do **not** move the character's pose/animation work back into `Scene.update()` without re-checking the pause freeze: animations run on the animation manager, not on the scene update.
- Do **not** assume Firebase works — it is a stub.
- Do **not** assume levels 2-10 exist or that `LevelDefinition` is consumed in gameplay.
- Do **not** assume all overlay modules exist — `BackdropRenderer`, `GuidanceDirector`, `PauseFlow` (pause/help), `DiscoveryFlow`, `FailFlow` and `FinishFlow` do. There is no `HelpFlow`.
- Do **not** assume scene/runner-loop/overlay behavior is test-covered — only pure state/data is (114 Vitest tests). `PauseFlow`/`DiscoveryFlow`/`FailFlow`/`FinishFlow` are Phaser-coupled and verified by browser smoke test only; `discoverySessionCache` is the exception (Phaser-free, unit-tested).
- Do **not** assume the FinishFlow slice is fully browser-verified — `wounded-planet`'s finish sequence has a real-phone pass, but `moonlight-mountain`'s finish, fail-before-finish, and pause→Repetir do not yet.
- Do **not** assume the untracked image drafts are deleted — they are on disk, only untracked.
- Do **not** assume the fairness/entry-flow pass has been verified on a real phone — it hasn't.
- Do **not** assume an external Obsidian vault is available; `docs/memory/` is the stable layer.
