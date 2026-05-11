# World 01 — Runtime (optimized, bundled)

Optimized WebP exports for **World 01** that are imported by TypeScript and shipped in the Vite bundle.

## Naming convention

- `world-01-bg-main.webp` — primary background / level entry chapter art
- `world-01-bg-preview.webp` — welcome cover variant
- `world-01-bg-layer-back.webp` — optional far parallax layer
- `world-01-bg-layer-mid.webp` — optional mid parallax layer
- `world-01-bg-layer-front.webp` — optional near parallax layer

Lowercase, hyphenated, ASCII only. `.webp` only.

## Size targets

- welcome / preview ≤ 250 KB
- entry / main ≤ 200 KB
- individual parallax layers ≤ 180 KB

See [docs/asset-workflow.md](../../../../../docs/asset-workflow.md).
