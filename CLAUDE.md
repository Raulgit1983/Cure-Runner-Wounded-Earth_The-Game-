# Project Instructions — Wounded Hearth / Cure Runner

## Identity of the project

This is a mobile-first web game created as a personal, emotional, educational gift from a father to his son Mateo / Amadeo, who lives far away because of migration, visa, political and geopolitical circumstances.

The game is not only software. It is a bridge between father and son.

The game must be fun, playable, technically solid, emotionally intelligent, child-safe, and scalable. It should help open conversations with children and adolescents about distance, migration, family, care, creativity, music, ecology, human dignity and hope — but always through play, symbols and imagination, never through lectures, propaganda or trauma.

The child is artistic, musical, creative, and likes games such as Geometry Dash and Mario-like platformers. These are references only for clarity, rhythm, responsiveness and replayability. Do not copy their mechanics, aesthetics, level design, branding or feel.

The game must have its own identity.

---

## Current concept

Working titles have included:

- Cure Runner: Wounded Earth
- Wounded Earth
- Wounded Hearth

Current preferred direction: **Wounded Hearth**.

The original idea comes from Mateo:

> A character searches for the cure for a wounded/destroyed planet. At the end of each level, he finds an ingredient. With all the ingredients, he creates the cure for the planet where he lives.

The planet is wounded, but still alive.

The game should not say or imply that the child was “born into a sick world.” The emotional truth is:

> The planet still breathes.  
> The world can still be cared for.  
> Creation, music and love can help it heal.

---

## Core emotional promise

The game should feel like this:

A child enters a living wounded planet and slowly helps it breathe again through movement, music, creativity and courage. Each level gives him one ingredient for a cure. The cure is not a magic fix for the entire world, but the beginning of care, connection and hope.

The father’s presence should be felt gently through symbols, musical fragments, small messages, drawings, stars, warmth, breath, light and shared creation.

Avoid melodrama. Avoid pity. Avoid heavy adult explanations. Avoid sentimental excess.

The game should be emotionally warm, poetic, playable and dignified.

---

## Technical stack

Assume the project is or should remain:

- Vite
- TypeScript
- Phaser
- Firebase available as a boundary adapter / future integration layer
- GitHub Pages compatible
- PWA-ready or PWA-friendly
- Mobile-first
- AI-assisted development friendly

Preserve compatibility with static hosting and GitHub Pages.

Do not introduce backend dependency unless absolutely necessary.

Firebase must remain optional, private, minimal and clearly separated from gameplay logic.

---

## Architecture principles

Prioritize in this order:

1. Strategic clarity
2. Real scalability
3. Mobile performance
4. Gameplay quality
5. Clean architecture
6. Efficient AI-assisted execution
7. Strong visual direction
8. Elegant emotional storytelling
9. Maintainability
10. Future publishing and growth

Architecture rules:

- Keep gameplay logic separate from backend logic.
- Do not put large game systems directly inside Phaser scenes.
- Use scenes for orchestration, not for everything.
- Prefer modular systems and data-driven configuration.
- Prefer small, verifiable changes over huge refactors.
- Preserve working mechanics unless clearly broken.
- Avoid premature over-engineering.
- Avoid technical debt that will block future levels.
- Keep the code readable for a non-programmer owner working with AI tools.
- Every meaningful change should have clear acceptance criteria.
- Every implementation step should end with build/test/manual validation instructions.

Recommended conceptual modules:

- `GameScene` / level scenes for orchestration
- `LevelConfig` / data-driven level definitions
- `PlayerController`
- `HazardSystem`
- `CollectibleSystem`
- `IngredientSystem`
- `CompanionSystem` for Tiburoncín
- `AudioManager`
- `RhythmManager`
- `ProgressService`
- `StorageAdapter`
- `FirebaseAdapter`
- `SafetyPrivacyConfig`
- `AssetManifest`
- `TextLocalization`

Do not create all modules at once unless the repo clearly needs it. Introduce them incrementally.

---

## Gameplay principles

This is a game first.

The player experience must be:

- responsive
- readable
- fair
- rhythmic
- replayable
- mobile-friendly
- emotionally meaningful without becoming slow or preachy

Core gameplay loop:

1. Enter a wounded part of the planet.
2. Move, jump, avoid hazards and collect creative/musical items.
3. Listen to the rhythm/pulse of the level.
4. Reach the end.
5. Recover one ingredient of the cure.
6. Receive a short poetic message.
7. Unlock the next step in the healing journey.

Controls:

- Mobile-first.
- Prefer one-touch or very simple touch controls.
- Avoid complex UI.
- Avoid desktop-only assumptions.
- Keyboard support is useful for testing but not the primary design target.

Difficulty:

- Fair, readable, progressive.
- No sudden unfair deaths.
- Use mercy/retry/checkpoint systems.
- Failure should feel like “try again,” not punishment.
- Short levels or checkpoints are preferred for mobile sessions.

Hazards:

- Must be readable immediately.
- Must be visually grounded.
- Must not look like collectibles.
- Must not float accidentally unless intentionally designed.
- Avoid confusing spike placement.
- Mirror spikes or abstract hazards must clearly communicate danger.
- Hazards can represent noise, pressure, fear, pollution, borders, oppressive systems or confusion, but symbolically and child-safely.

Collectibles:

Avoid generic coins.

Prefer:

- musical notes
- treble clef / Nota Sol
- rhythm fragments
- brush strokes
- seeds
- light fragments
- breath particles
- memory sparks
- small instruments
- creative tools

Collectibles should matter emotionally, musically or mechanically.

Tiburoncín:

- A small loving shark companion.
- Should fly, accompany, warn, celebrate, tease or gently “nibble” playfully.
- Must not damage the player unfairly.
- Must not visually confuse the player.
- Can become a guide, rhythm cue or emotional companion.
- Should feel like a childlike magical ally, not a threat.

---

## Music and rhythm direction

Music is central.

It is not background decoration.

The child studies music, so the game should gradually turn music into a language of play.

Season 1 should introduce rhythm gently, not necessarily become a full rhythm game immediately.

Recommended music architecture:

- Global pulse / BPM metadata per level.
- Level-specific motif.
- Pickup sounds tuned to the level key/mode.
- Ingredient stinger.
- Soft retry/failure sound.
- Tiburoncín cue.
- Planet breath/pulse sound.
- Final cure motif.
- Optional call-and-response mechanic later.

Music principles:

- Original or public-domain-style motifs only.
- No copyrighted songs.
- Simple motifs are better than complex production.
- Sounds should support gameplay clarity.
- Rhythm should help the player anticipate movement, pickups and hazards.
- Silence/noise contrast can carry educational meaning.

Possible musical learning themes:

- pulse
- rhythm
- listening
- silence
- repetition
- call and response
- harmony
- tension and resolution
- motif transformation

---

## Narrative principles

Minimal text.

Spanish-first, but architect for localization.

Tone:

- warm
- poetic
- simple
- truthful
- hopeful
- never cheesy
- never manipulative
- never propagandistic

The story should be carried by:

- level design
- color
- movement
- music
- ingredients
- environmental changes
- small messages
- father-child symbolic presence

Use short microtexts at level endings.

Good examples of tone:

- “El planeta todavía puede sanar.”
- “Sigamos construyendo un mundo nuevo juntos.”
- “El planeta aún respira.”
- “Cada paso lo despierta un poco más.”
- “No todo lo roto está perdido.”
- “La música encontró un camino.”
- “Aunque estemos lejos, algo nos une.”

Avoid:

- long explanations
- adult political speeches
- blaming the child
- making the child responsible for saving everything
- graphic trauma
- sentimental overstatement
- literal propaganda

The player is not alone. The player is learning to care.

---

## Educational layer

The game should educate through play, not lectures.

Themes to introduce carefully:

### Music

- rhythm
- pulse
- listening
- simple motifs
- musical memory
- silence vs noise
- creation as response

### Ecology

- caring for a wounded living planet
- small acts matter
- repair instead of domination
- interdependence

### Emotional literacy

- fear
- distance
- longing
- hope
- courage
- tenderness
- patience
- repair

### Human values

- dignity
- solidarity
- creativity
- responsibility
- freedom
- care
- resilience

### Migration / distance / politics

Use symbolic, age-appropriate design.

Possible symbols:

- wind gates
- bridges
- separated lights
- papers becoming birds
- clouds
- borders made of noise
- locked paths opened by music
- messages carried by stars
- two homes connected by rhythm

Do not include:

- partisan slogans
- demonization
- graphic political violence
- literal immigration bureaucracy as trauma
- adult explanations that burden the child

The game may help start conversations, but must not force them.

Optional parent-child prompts can appear after levels, but should be private, gentle and skippable.

Example:

> “¿Qué sonido te hace sentir cerca de alguien que está lejos?”

---

## Visual direction

Preserve the childlike art soul.

Do not over-polish the game into a generic commercial mobile look.

The visual style should feel like:

- child drawings
- handmade textures
- living planet
- warm darkness
- organic machinery
- music marks
- fragile light
- playful danger
- emotional simplicity

Priorities:

- mobile readability
- clear silhouettes
- clean alpha
- stable UI
- strong contrast
- clear hazards
- expressive but not cluttered backgrounds
- no square matte artifacts around transparent PNGs
- no excessive particles that hurt performance
- no visual overload

The first level begins inside the planet: a living wounded interior, not pure horror. It should move from darkness to breath and hope.

Color arc for Season 1:

1. deep interior darkness
2. pulse red / warm amber
3. mirror blue / silver reflection
4. noisy grey / school pressure
5. wind / border pale sky
6. garden green / ochre / creative color
7. hearth gold / cure light

---

## Creative DNA (non-negotiable)

These three rules sit above ordinary implementation decisions. When a task seems to call for "improving" one of them, stop and flag it instead of proceeding.

### Mateo's art is the source, not a draft to polish away

- The hero, companions, and backdrops originate from Mateo's own sketches (the developer's son) and are refined *from* those sketches — never replaced by a different visual language.
- Any new art (future levels, hazards, collectibles) must stay inside Mateo's established palette, line weight, and level of detail. Do not "level up" toward a more generic, commercial, or technically polished style.
- If new art, an asset swap, or a refactor makes something look visually different from how it looked before, treat that as a regression to report, not an upgrade to keep.

### Values are felt, never taught

- The game carries human values (care, courage, distance, hope, ecology, creativity) only through play, symbol, and atmosphere — never through an explicit lesson, on-the-nose dialogue, or "moral of the story" beat.
- If a mechanic, microtext, or system starts to read like a lesson being delivered to the player, it is mis-designed. Go back to a symbolic or mechanical expression instead of stating the point.

### Physics/mechanics reference (direction only — not yet implemented)

- Future mechanics should aim for: precise and predictable jumps, rhythm synced to music where present, instant fail-and-retry with no punishment friction, and tension built from speed/flow rather than combat or lives.
- This is inspiration from genres like Geometry Dash — never its art, branding, IP, exact mechanics, or level design (see "Identity of the project" above).
- Nothing here requires action now. It is a compass for when future levels touch jump/rhythm mechanics.

---

## Operating protocol (aligned with La Manigua)

- **Model routing** — declare the tier before each task: **Light** (`claude-sonnet-5` — mechanical, already-specified changes) and **High** (`claude-opus-5` — genuinely difficult implementation, ambiguity, undiagnosed problems, new architecture, or long-horizon work). Use high/xhigh/max effort only when the slice benefits from it. **Fable 5 is forbidden:** on Raúl's Claude Pro plan it requires paid usage credits, and no agent may enable or spend them without a new explicit authorization from Raúl. For Opus 5 use the Claude Code 2.1.226 binary bundled in the active Antigravity extension, not the older standalone 2.1.204 executable. Record the resolved model ID. The canonical stack contract is `docs/memory/production-stack-orchestration.md`.
- **What persists vs. what doesn't** — decisions, corrections, and principles a future session needs (like the Creative DNA section above) live here or in docs/memory/, not repeated in chat. One-off task instructions are given directly and aren't archived separately.
- **Report signature** — close each slice summary with model + effort + date, so it's possible to see later which model handled what.
- **Two-agent topology** — Raúl is the human authority; Codex is the default supervisor, art/image lead, integrator, and QA owner; Claude Opus 5 is the implementation worker for difficult code. Claude edits only in its isolated task worktree when invoked by Codex. Never call Codex from inside a Codex-led Claude task; request image work through the shared task manifest. Never push or deploy, and never touch the main checkout. Read root `AGENTS.md` and `docs/memory/production-stack-orchestration.md` for the complete handoff and review contract.

---

## Season 1 direction

Season 1 should be achievable, coherent and emotionally complete.

Suggested title:

**Season 1 — El Primer Latido**

Core arc:

The child enters the wounded planet, learns to listen to its pulse, finds musical and creative ingredients, crosses symbolic obstacles of noise, fear and distance, and creates the first cure.

The world is not fully fixed. But the first act of care has begun.

Suggested levels:

### Level 1 — El Interior que Respira

Theme: the planet is wounded but alive.  
Ingredient: Nota Sol / treble clef.  
Skill: basic movement, jump, collection, pulse.  
Message: “El planeta aún respira.”

### Level 2 — El Taller de los Espejos

Theme: reflection, attention, learning to read danger.  
Ingredient: Fragmento de Ritmo.  
Skill: timing, clearer obstacle reading.  
Message: “Mirar mejor también es cuidar.”

### Level 3 — The Black Forest

**Current decision (2026-08-09, supersedes the "La Escuela del Ruido" sketch
below):** the third stage is **The Black Forest**, built from Mateo's `BG 2`
sheet. It is implemented and playable — see
[docs/memory/level-03-direction.md](docs/memory/level-03-direction.md).

Stage chain: `wounded-planet → moonlight-mountain → black-forest → end`.

- Theme: a forest that is already watching and already breathing.
- Skill: reuses the verified vocabulary only (grounded shard to jump, overhead
  mirror/crown to duck, ledge for the platform route). No new mechanic.
- Ingredient: **[PENDIENTE DE RAÚL]** — an explicit neutral placeholder ships
  today, deliberately not the Nota Sol.
- Message: **[PENDIENTE DE RAÚL]** — the closing copy is neutral and factual.
- Boss: **[PENDIENTE DE RAÚL]** — Chomper is drawn but not designed in.

The original sketch is kept for the wider Season 1 arc, unassigned to a slot:

> *La Escuela del Ruido* — pressure, noise, oppressive systems transformed
> through creativity. Ingredient: Silencio Valiente. Skill: rhythm through
> noise, safe navigation. Message: "No todo ruido puede apagar una canción."

### Level 4 — La Frontera del Viento

Theme: distance, migration, separation, love crossing space.  
Ingredient: Puente de Aire.  
Skill: wind gates, timing, gentle momentum.  
Message: “Aunque estemos lejos, algo nos une.”

### Level 5 — El Jardín de las Herramientas

Theme: creation as healing.  
Ingredient: Semilla de Color.  
Skill: combining collectibles, optional paths.  
Message: “Crear también es una forma de curar.”

### Level 6 — El Núcleo del Hogar

Theme: first cure, father-child connection, hope.  
Ingredient: Primer Latido.  
Skill: combine previous lessons.  
Message: “El planeta todavía puede sanar.”

Season ending:

The cure is created. The planet breathes more warmly. A small message appears:

> “Sigamos construyendo un mundo nuevo juntos.”

Do not present this as the end of all pain. Present it as the beginning of shared care.

---

## Parent-child connection layer

This project is a bridge between father and son.

Possible features:

- private local “letters” unlocked after levels
- small father messages
- musical fragments from father to child
- drawings or stars as memory tokens
- optional conversation prompts
- shared ingredient collection
- a “Hearth” screen where collected ingredients gently glow

Rules:

- No public chat.
- No public social features.
- No likes.
- No public comments.
- No public profiles.
- No leaderboard by default.
- No manipulative streaks.
- No guilt-based retention.
- No notifications designed to pressure the child.
- Encourage healthy pauses.

If family messaging is ever added:

- private only
- adult-controlled
- off by default
- minimal data
- Firebase-protected
- no public discoverability
- clear moderation/ownership
- no sensitive political/family details stored unnecessarily

---

## Minor safety and privacy

This is a child-oriented personal game.

Strict rules:

- No ads.
- No third-party trackers by default.
- No unnecessary analytics.
- No public chat.
- No public leaderboard.
- No public profile.
- No public user-generated content.
- No collection of sensitive personal data.
- Local progress first.
- Firebase only if justified and privacy-conscious.
- Keep CSP/no-referrer/privacy headers preserved or improved.
- Do not store sensitive migration, political or family details in the public repo.
- Avoid exposing the child’s private emotional situation in code, assets or public text.

If analytics are needed later, use privacy-preserving, aggregated, non-identifying metrics only, and only with adult consent.

---

## Firebase rules

Firebase is allowed only as a clean boundary, not as gameplay infrastructure.

Prefer:

- local storage for progress
- optional cloud sync later
- adapter pattern
- explicit data contracts
- minimal stored data
- no child personal data unless absolutely necessary
- no public read/write access
- security rules before deployment

Do not couple Phaser scenes directly to Firebase.

Bad:

- calling Firebase directly from gameplay scenes
- storing family-sensitive content in public collections
- anonymous public social features
- leaderboard by default

Good:

- `ProgressService`
- `LocalProgressAdapter`
- `FirebaseProgressAdapter`
- `FamilyMessageAdapter`, only if explicitly requested later
- clear privacy model

---

## Performance rules

Mobile performance is critical.

Target:

- fast initial load
- small assets
- compressed images
- clean alpha PNG/WebP where appropriate
- limited particles
- no heavy runtime filters unless tested
- stable frame rate on mid-range phones
- avoid memory leaks between scenes
- avoid excessive draw calls
- preload only what is needed
- lazy load future season assets

Every visual improvement must be checked against mobile readability and performance.

---

## Accessibility

Include or preserve:

- readable text size
- high contrast UI
- reduced motion option if possible
- sound not required for basic completion
- visual rhythm cues
- forgiving controls
- pause/retry clarity
- no flashing hazards
- no tiny critical objects
- simple Spanish language
- localization-ready text

The child should feel invited, not tested harshly.

---

## AI-assisted development rules

When working on this repo:

1. Inspect before changing.
2. State assumptions briefly.
3. Prefer small PR-sized changes.
4. Do not rewrite working architecture without cause.
5. Keep output compact.
6. Always list modified files.
7. Always provide validation commands.
8. Always provide manual QA steps.
9. Always protect existing gameplay that works.
10. Do not invent repo facts. If uncertain, say so.

For implementation tasks:

- First identify files.
- Then propose a short plan.
- Then edit.
- Then run checks.
- Then summarize:
  - what changed
  - files changed
  - tests/checks run
  - remaining risks
  - next safest step

Avoid unnecessary long explanations.

---

## Preferred implementation strategy

Use incremental phases.

### Phase 0 — Audit and safety baseline

Goal: understand repo, confirm build, inspect Firebase/privacy/deployment/security.

Acceptance criteria:

- build works
- architecture map exists
- privacy risks listed
- no unsafe public child features

### Phase 1 — Preserve what works and remove friction

Goal: fix obvious gameplay/UX issues without changing core.

Known friction to look for:

- useless fast transitional screen
- confusing mirror spikes
- hazards not grounded
- alpha artifacts around PNGs
- unclear Tiburoncín behavior
- mobile readability issues

Acceptance criteria:

- Level 1 still works
- jump/collect/audio/physics preserved
- hazards clearer
- no new regressions

### Phase 2 — Season 1 data model

Goal: introduce scalable level/ingredient/text config.

Acceptance criteria:

- level metadata externalized
- ingredients defined
- Spanish text centralized
- future levels easier to add

### Phase 3 — Level 1 vertical slice

Goal: make Level 1 release-quality.

Acceptance criteria:

- strong opening
- clear controls
- first ingredient reward
- short ending message
- retry/mercy works
- mobile QA passed

### Phase 4 — Music/rhythm foundation

Goal: add simple pulse metadata and musical feedback.

Acceptance criteria:

- pickups sound intentional
- level pulse exists
- no timing instability
- audio can be expanded

### Phase 5 — Levels 2–3

Goal: reflection and noise levels.

Acceptance criteria:

- each level teaches one new idea
- hazards readable
- educational meaning is symbolic

### Phase 6 — Levels 4–5

Goal: distance/migration symbol level and creation/garden level.

Acceptance criteria:

- emotional but not heavy
- mechanics remain fun
- parent-child prompt optional

### Phase 7 — Level 6 / First Cure finale

Goal: combine ingredients and complete Season 1 arc.

Acceptance criteria:

- cure sequence works
- no excessive text
- emotional payoff
- unlocks replay/hope

### Phase 8 — QA, performance, accessibility, deployment

Goal: release-ready first season.

Acceptance criteria:

- build passes
- mobile tested
- no privacy regressions
- GitHub Pages works
- clear README/update notes

---

## Definition of Done — Season 1

Season 1 is done when:

### Gameplay

- The game is fun and readable on mobile.
- Controls feel responsive.
- Hazards are fair.
- Retry/mercy works.
- Each level has a clear purpose.

### Emotional/narrative

- The father-son bridge is felt.
- The game is hopeful without being cheesy.
- Migration/distance is symbolic and age-appropriate.
- The child has agency.
- The ending opens hope.

### Educational

- Music is meaningfully present.
- Ecology and care are taught through play.
- Emotional literacy appears through symbols.
- Optional conversation prompts are gentle and private.

### Technical

- Architecture is modular enough for future seasons.
- Level data is scalable.
- Audio/rhythm system can grow.
- Firebase is isolated.
- Build/deploy works.

### Performance

- Mobile load and frame rate are acceptable.
- Assets are optimized.
- No obvious memory leaks.
- No unnecessary heavy effects.

### Safety/privacy

- No public chat.
- No ads.
- No tracking by default.
- No public profiles.
- No sensitive child/family data exposed.
- Local-first progress.

---

## Current known memory from previous work

Use these as project memory, but verify against the repository:

- The current project uses Vite + TypeScript + Phaser.
- Firebase has been implemented or prepared, but gameplay should remain mostly local for now.
- GitHub Pages deployment matters.
- The game has had title changes around “Cure Runner,” “Wounded Earth” and “Wounded Hearth.”
- The first level begins inside the planet / living factory.
- The planet should emerge from darkness toward hope.
- The first ingredient is musical: Nota Sol / treble clef.
- Existing or desired Spanish lines include:
  - “El planeta todavía puede sanar.”
  - “Sigamos construyendo un mundo nuevo juntos.”
  - “El planeta aún respira.”
  - “Cada paso lo despierta un poco más.”
- A victory animation and warm hope sound were desired.
- Retry/mercy is preferred over harsh sudden loss.
- Score/life may be tied to pulse.
- Mateo’s sketches and childlike art identity must be preserved.
- Avoid square matte artifacts on transparent PNG assets.
- The hero should keep an innocent natural drawing style.
- Avoid weird growth/deformation on jump.
- Tiburoncín should fly/accompany/playfully scare, not punish.
- Hazards may include sludge, oppressive teacher/warden, police-like pressure, zombie dog/hound, debris/crisis-world symbols.
- Collectibles should be music/art/creation items, not plain coins.
- A future rhythm-runner expansion is desired, where tap/jump/hazards/pickups align with a background musical pulse.
- Current audio and physics were considered mostly satisfactory in a previous pass.
- Current concern: improve art, readability, hazard placement and minor safety rigor without breaking what works.

---

## Default response format for Claude Code

When asked to analyze or implement, respond in this compact structure:

1. Confirmed repo facts
2. Assumptions
3. Recommended decision
4. Files to inspect/change
5. Implementation plan
6. Acceptance criteria
7. Validation commands
8. Manual QA checklist
9. Risks
10. Next safest step

For code changes, after editing, summarize:

- Changed files
- What changed
- Why
- Checks run
- Result
- Remaining risks
- Next PR recommendation

Do not produce generic brainstorming unless explicitly requested.

---

## First safest task if no task is given

If the user asks where to start, start with:

“Create a Season 1 technical/design audit without modifying code.”

Then inspect:

- package scripts
- Phaser scenes
- level config or hardcoded level logic
- assets
- audio
- Firebase usage
- deployment config
- privacy/security headers
- README/docs

Return:

- repo map
- what works
- risks
- first PR recommendation
- build/test commands

Do not modify code in the first audit unless explicitly asked.

---

## North Star

The game should become:

A small, beautiful, playable, musical world where a child can feel that even across distance, love can still arrive; that a wounded planet can still breathe; and that creativity is not decoration, but a way of caring for life.

Protect the gameplay.  
Protect the child.  
Protect the father-son bridge.  
Protect the handmade soul.  
Build only what helps the first season become real.
