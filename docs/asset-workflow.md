# Asset Workflow — Cure Runner: Wounded Planet

This document is the single source of truth for how new visual assets enter the project. It is read-only context for code and docs; it does **not** describe a runtime behavior of the game.

---

## 1. Incoming asset repository

The official shared incoming asset repository for **Carlitos**, **John Gol Island**, and **Raúl** is the following Google Drive folder:

```
https://drive.google.com/drive/folders/1zzif7T1VNXvbnQyWsUUzrg16xn1DrZaF?usp=sharing
```

Treat this Drive folder as an **external creative source**, equivalent to a shared inbox.

**Rules:**

- The Drive folder is **not** a runtime dependency. The game must never fetch, embed, or proxy assets from Drive at runtime.
- No Google Drive API integration. No Drive credentials, tokens, or API keys live in this repository.
- No `fetch` / `XHR` to `drive.google.com` or `googleusercontent.com` from `src/`.
- The CSP in [index.html](../index.html) (`connect-src 'self'`) already blocks accidental network calls — keep it that way.
- Assets only become part of the build after they are **manually downloaded**, placed under `src/assets/`, and explicitly imported by TypeScript.

---

## 2. Local folder structure

The repository keeps three layers of asset state, separated by purpose:

```
src/assets/
├── incoming/                       # Temporary review staging — not imported
│   └── carlitos/                   # Per-author optional sub-folder
│       └── world-01-bg-main.png    # Raw upload as received, untouched
│
├── worlds/
│   └── world-01/
│       ├── source/                 # High-res / layered originals, archival
│       │   └── world-01-bg-main.png
│       └── runtime/                # Optimized assets actually imported
│           ├── world-01-bg-main.webp
│           ├── world-01-bg-layer-back.webp
│           ├── world-01-bg-layer-mid.webp
│           ├── world-01-bg-layer-front.webp
│           └── world-01-bg-preview.webp
│
├── hero/                           # (unchanged) hero pose webp set
├── creatures/                      # (unchanged) creatures
├── cover/                          # (unchanged) welcome cover art
├── entry/                          # (unchanged) chapter-entry art
└── planet/                         # (unchanged) planet art currently in use
```

**Layer purpose:**

| Folder | What goes there | Imported by TS? |
|---|---|---|
| `incoming/<author>/` | Raw uploads as they arrive from Drive, before any decision | No |
| `worlds/world-XX/source/` | High-res / source / layered files kept for archival, reference, or future re-export | No |
| `worlds/world-XX/runtime/` | Final optimized WebP files referenced by the game | Yes |

Only `runtime/` files are ever imported from TypeScript. `incoming/` and `source/` exist purely for human workflow and may be deleted from the deploy without affecting the game.

**Why three layers:** Vite only bundles assets it finds via `import` statements — so files in `incoming/` and `source/` do not bloat the production bundle, only the git repo. That trade is acceptable for preserving originals.

---

## 3. Naming convention

All runtime asset filenames must follow this convention:

- Lowercase only.
- ASCII only. No spaces, no accents (`ñ`, `é`, etc.).
- Words separated with single hyphens.
- Prefix runtime backgrounds with `world-XX-` where `XX` is a zero-padded world number.
- Layer suffixes: `-bg-main`, `-bg-layer-back`, `-bg-layer-mid`, `-bg-layer-front`, `-bg-preview`.
- Extensions: `.webp` for runtime art; `.png` or `.jpg` only inside `source/` or `incoming/`.

**Examples (good):**

```
world-01-bg-main.webp
world-01-bg-layer-back.webp
world-01-bg-layer-mid.webp
world-01-bg-layer-front.webp
world-01-bg-preview.webp
```

**Examples (bad — do not use):**

```
World 01 Background Final.png
mundo-1-fondo-versión-final.PNG
WorldOne_BG_v2_FINAL_FINAL.jpg
```

---

## 4. From Drive to runtime — workflow

Five-step process when Carlitos uploads a new asset to Drive:

1. **Download** the file from Drive to your local machine.
2. **Stage** the untouched original under `src/assets/incoming/carlitos/`, optionally renaming it to the target naming convention.
3. **Review** with the team. If accepted, copy the archival original into `src/assets/worlds/world-XX/source/` (preserve PNG/JPG, keep highest quality).
4. **Export** an optimized WebP into `src/assets/worlds/world-XX/runtime/`. Targets:
   - Width: ≤1080 px for full-screen backgrounds (game logical width is 360 px; ~2× DPR margin).
   - Quality: 80–88 (visual comparison required for childlike art).
   - Tools: `cwebp -q 84` or equivalent.
5. **Import** the runtime file from TypeScript exactly once, in the content file that owns that scene (see §5).

After the runtime import is wired and the game has been visually verified, the `incoming/` copy may be deleted. The `source/` copy is preserved.

---

## 5. Where backgrounds are actually loaded

Current background touchpoints for **World 01 — Wounded Planet** (the first world / first scene):

| Surface | Loaded from | Imported in | Used by |
|---|---|---|---|
| Welcome screen cover image | [src/assets/cover/portada-del-juego-v01.jpg](../src/assets/cover/portada-del-juego-v01.jpg) | [src/game/content/introFlow.ts:1](../src/game/content/introFlow.ts) | [src/main.ts](../src/main.ts) `<img class="entry-flow__cover">` |
| Level entry "chapter" art | [src/assets/planet/planet-home-cutout.webp](../src/assets/planet/planet-home-cutout.webp) | [src/game/content/journeyStages.ts:2](../src/game/content/journeyStages.ts) | [src/game/scenes/LevelEntryScene.ts](../src/game/scenes/LevelEntryScene.ts) (loaded into Phaser texture cache via `this.load.image(entry.art.textureKey, entry.art.imageUrl)`) |
| In-game runner backdrop (wounded variant) | **Procedural** — drawn via `Phaser.GameObjects.Graphics` | — | [src/game/scenes/JourneyScene.ts](../src/game/scenes/JourneyScene.ts) `renderBackdrop()` (no image file) |
| Unused legacy planet art | [src/assets/planet/planet-home.webp](../src/assets/planet/planet-home.webp) | (no import) | — |

The in-game backdrop is **drawn in code, not loaded as an image**. Replacing it with a painted background by Carlitos is a larger change than swapping the two image-based surfaces and is out of scope until a separate design decision is made.

---

## 6. Replacement plan when new World-01 backgrounds arrive

This plan covers the smallest safe replacement once Carlitos' assets are downloaded.

**Inputs expected from Drive:**

- At least one of:
  - `world-01-bg-main.png` (or `.jpg`) — full-scene background
  - `world-01-bg-preview.png` — welcome-screen cover variant

**Steps:**

1. Download each accepted file from Drive.
2. Place originals in `src/assets/worlds/world-01/source/` using the naming convention from §3.
3. Export optimized WebPs to `src/assets/worlds/world-01/runtime/`.
4. Wire imports:
   - To replace the **welcome cover**, change one import line in [src/game/content/introFlow.ts:1](../src/game/content/introFlow.ts):
     ```ts
     import welcomeCoverUrl from '@/assets/worlds/world-01/runtime/world-01-bg-preview.webp';
     ```
   - To replace the **level entry chapter art**, change one import line in [src/game/content/journeyStages.ts:2](../src/game/content/journeyStages.ts):
     ```ts
     import planetHomeCutoutUrl from '@/assets/worlds/world-01/runtime/world-01-bg-main.webp';
     ```
   - Optionally adjust `entry.art.maxWidth`, `maxHeight`, `y`, `rotation` in the same file if the new art's intrinsic dimensions differ enough to need re-framing.
5. Do **not** modify [src/game/scenes/LevelEntryScene.ts](../src/game/scenes/LevelEntryScene.ts) or [src/game/scenes/JourneyScene.ts](../src/game/scenes/JourneyScene.ts). Both already consume the assets via the content files above.
6. Run `npm run check` and `npm run build`. Smoke-test in dev (`npm run dev`).
7. Keep the previous `cover/portada-del-juego-v01.jpg` and `planet/planet-home-cutout.webp` files in place until the replacement is visually accepted. Remove them in a follow-up commit, never in the same commit as the swap.

**Out of scope for this swap:**

- Procedural in-game backdrop replacement (`JourneyScene.renderBackdrop`).
- Gameplay timing, layout, or hazard balance.
- Adding parallax layers (would require a small new system in `JourneyScene`, not free).

---

## 7. Hard rules — what NEVER changes via this workflow

- No runtime Drive fetch. Ever.
- No new dependency added "to handle assets."
- No new build step that calls out to Drive.
- No new env var, secret, or credentials file.
- No change to GitHub Pages deployment ([.github/workflows/deploy-pages.yml](../.github/workflows/deploy-pages.yml)).
- No change to ports (`4321`) or scripts in [package.json](../package.json).
- No edits to gameplay files (`JourneyScene.ts`, `RunnerLoopSystem.ts`) just to onboard a new background.
- CSP and referrer policy in [index.html](../index.html) stay strict.

Asset onboarding is a content-import operation, not a code refactor.
