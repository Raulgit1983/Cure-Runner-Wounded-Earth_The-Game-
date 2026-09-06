---
tags: [cure-runner, mateo-game, memory, ai-agent]
updated: 2026-09-06
---

# Next Agent Brief

Read this before touching the repo. Pair with [project-current-state.md](project-current-state.md).

## Estado vigente — cierre y publicación, 2026-09-06

Raúl autorizó terminar, guardar y publicar para Mateo. Está confirmado el correo
`lamanigua.ca@gmail.com`: el usuario aportó la recepción del mensaje técnico.
Los formularios se envían dentro del juego y siguen al capítulo que corresponde;
Inicio desde pausa pide confirmación. El final permite empezar desde el primer
mundo. Se han afinado las preguntas y el tono; luna completa y cristales según
la referencia elegida, con brillo vinculado al sonido real. Chomper v4 aprobado
se incorpora a la secuencia pública mediante carga diferida.

Base: `b6be6472a0ff0fbc0e4efc1f3587c06aaf1612af`; rama de trabajo
`visual/world-01-carlitos-drive`. Se preserva el pase anterior completo.
232 pruebas / 22 archivos, check y build correctos; 210 capturas en 5 formatos.
Estado de publicación y recibo exacto: [release-2026-09-06.md](release-2026-09-06.md).
Código publicado: `18a4e1f489fa4b40188d5685f5f911edd1adbd39`; build y deploy
de GitHub Actions 34019527754 correctos. Los 11 archivos públicos HTML/JS/CSS
coinciden con el build comprobado. QA público del recorrido y formulario PASS;
un envío real desde el juego recibió HTTP 200/success=true. Este checkpoint
documental posterior permanece
en la rama de trabajo; main conserva la versión publicada. URL:
https://raulgit1983.github.io/Cure-Runner-Wounded-Planet/

Codex/Astra continúa como único escritor. No activar Claude, reiniciar el pase,
limpiar originales/art-lab ni modificar el lockfile por rutina. La revisión real
de Mateo sigue pendiente; las pruebas emuladas no equivalen a Safari físico.

## Histórico — pase editorial inicial, 2026-09-05

Base comprobada antes de editar: rama `visual/world-01-carlitos-drive`, HEAD
`b6be6472a0ff0fbc0e4efc1f3587c06aaf1612af`, árbol limpio. El pase actual es
**trabajo local sin commit**, posterior al checkpoint Chomper v4 aprobado.

- Tipografía nativa del navegador sincronizada con Phaser, cuerpos y controles
  mayores, paneles recompuestos y HUD oculto durante cierres/ayudas.
- Cierres propios de cada capítulo e invitaciones opcionales a imaginar sonido,
  gesto y voz. La historia y el ingrediente del bosque siguen abiertos.
- Moonlight conserva escala uniforme, luna centrada durante todo el recorrido y
  «Shine to the beat» centrado. Terreno auxiliar independiente del dibujo.
- Suelo candidato del bosque integrado localmente para revisión, sin modificar
  la composición original del ojo y la boca. Es una propuesta, no aprobación física.
- Galería de cinco dibujos originales completos desde portada y cartel final.
  Invitación a compartir las creaciones tal como estén, cualquiera que sea su acabado.
- Cartel final de pantalla completa, borrador opcional de mensaje y copia manual.
  No hay un servicio de envío ni se transmiten creaciones automáticamente.
- **Alfredito** sustituye el nombre anterior en el juego. Cualquiera de los tres
  Devilz adopta su figura completa con borde de luz mientras queden reservas;
  al consumir la última vuelve al personaje elegido. No se añade duración,
  ventaja, botón, colisión ni regla de obtención.
- `check`, `build`, **220 tests / 20 archivos** y `diff --check` correctos.
  QA móvil y límites detallados en [informe del pase](editorial-mobile-2026-09-05.md).
- Sigue pendiente la revisión física de Raúl de este pase. Chomper continúa
  sólo en DEV, con su v4 previamente aprobada. Sin commit, push ni deploy.

Revisión local: `http://192.168.1.138:5174/?chomperArt=rig`.
Capturas: `http://192.168.1.138:5174/art-lab/2026-09-05-editorial-mobile/`.
Build servido localmente: `http://192.168.1.138:4321/` (termina en el bosque).
Los servidores dependen de esta máquina; comprobar que siguen activos al reanudar.

Dirección educativa: [criterios de Raúl](editorial-direction-2026-09-05.md).
La investigación de maestría/doctorado está abierta; los propósitos del diseño
no son efectos educativos demostrados.

### Próximo paso

Presentar el juego y las capturas para revisión física en móvil. Atender sus
observaciones antes de cualquier publicación. Preservar este WIP y los
materiales ignorados en `art-lab/`; no repetir el pase desde cero.

## Historical status assumptions — consult the current pass above first
- **Latest continuation:** start from `CONTINUE_HERE.md`. Preflight base
  `bc8ed3178684dad65952e8dcd57f8f7b0380f036`; new rig changes are WIP.
  Arena finish explicitly approved. Raúl rejected the first motion pass as too
  basic/discreet with a stiff body, then requested a lunging bite. He corrected
  the interim gold/vertical version: the red upper head must refuse, open and
  close, and the bite must be avoidable without falling onto a jumping hero.
  Raúl viewed motion v4 on his phone, answered «Muy bien» and asked to save it
  before opening a clean task for the next visual/editorial pass.
  Use `/?encounter=chomper&chomperArt=rig` or the interactive comparison at
  `/art-lab/2026-09-05-chomper-rig/`. The upper red head has three articulated
  jaws and a two-beat refusal. The body enters down the far left, sweeps the
  ground left-to-right and exits below/left. A localized backlight and thin rim
  separate Chomper from the forest. 216 tests / 19 files pass.
  Candidate WebPs have real alpha; do not reuse the rejected RGB checkerboard.
  Chomper remains DEV-only. See [rig report](chomper-rig-2026-09-05.md).
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
  current motion v4 has a 360x640 / DPR 2 Chrome pass, including nine path
  checkpoints and a no-hit victory bot. The earlier rigs received physical
  criticism; v4 received a positive physical review, but its audio has not had
  a documented perceptual listening pass.
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
3. **Do not size or foot a sprite from `texture.height`.** Animation pack v2 pads its canvas; Alfredito's does not. Read `CharacterArtMetrics` (measured alpha bounds) instead. Getting this wrong is what made the Devilz float 18-26 px above the floor.
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
1. **Mobile-first editorial and visual audit before deploy.** Review every text,
   panel, button, hint, warning and chapter ending. Replace the blurred-looking
   typography system with a crisp, legible family and disciplined sizing,
   spacing, hierarchy, composition and palette. Inspect every resulting screen
   at mobile size, including long and short copy.
2. **Reframe Moonlight Mountain.** The current art feels stretched and hides the
   moon. Keep the moon visible and centred, centre `Shine to the beat`, preserve
   Mateo's focal drawing and compose/extend the playable terrain around it as a
   versioned candidate rather than deforming the source.
3. **Integrate the Black Forest floor.** The current play lane reads as a black
   strip. Use or improve the existing material candidate so the ground belongs
   to Mateo's forest, then verify contrast against characters and hazards. The
   plate occupies y 87..383 of a 640-tall canvas, leaving the play band as flat
   sky. The versioned candidate and review live in
   `art-lab/2026-09-05-forest-polish/`; see
   [polish-2026-09-05.md](polish-2026-09-05.md).
4. **Rewrite the final as a full-screen poster.** Keep useful current content,
   add a warm invitation to Mateo/players to send a message describing what
   they would add, change or imagine, and frame it as continuing to build the
   game together. Do not call the message a prompt or use technical language.
5. **Chomper candidate/encounter review.** Raúl authorized building the boss
   after the three stages. Rules and a DEV-only scene now exist, with six-note
   victory, three attacks (low wave, high burst, lunging bite) and pause/retry.
   Do not restart the work or call it
   production-ready: runtime promotion and final balance review remain. Black
   Forest ingredient and narrative closing are still undecided.
6. ~~Eye / mouth re-export decision~~ — **done 2026-08-09.** Both behaviours are wired off an approved art pass. Do not "fix" them back: the eye rests at offset (0,0), bounded by `IRIS_GAZE_MAX_X/Y` (currently ±8/±4 source px), and the mouth's rest phase is closed. See `blackForestArt.ts`.
7. Expand `LevelDefinition` so it actually drives tuning, phrase pools and mechanic flags.

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
