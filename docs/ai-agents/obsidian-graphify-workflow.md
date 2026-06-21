---
tags: [cure-runner, mateo-game, ai-agent, memory]
updated: 2026-06-21
---

# Obsidian / Graphify Workflow

How human memory tooling relates to the repo. No Obsidian vault currently exists in the workspace; these are the rules for when one is mirrored.

## Roles
- **Repo docs (`docs/memory/`, `docs/architecture/`, `docs/ai-agents/`) are the source of truth for agents.** Nothing else.
- **Obsidian** = human-readable project memory (browse, link, annotate). Optional.
- **Graphify / graph view** = visualize relationships between *decisions, systems, levels, assets, risks*. It is a lens, not a database agents read from.

## Hard rules (Decision)
- Agents (Claude / Antigravity / Codex / Gemini CLI) read **only committed repo docs**. They never depend on an external vault.
- External vault notes may inspire, but must be **copied or summarized into `docs/` and committed** before any agent relies on them.
- Obsidian/Graphify is **never** a runtime or build dependency. No plugin, fetch, or path in `src/` points at a vault.
- Keep every file **valid plain Markdown** so it works with or without Obsidian.

## Conventions for cross-linking
- Use relative Markdown links between repo docs (e.g. `[next-agent-brief](../memory/next-agent-brief.md)`); these double as Obsidian backlinks.
- Frontmatter `tags:` are present for Obsidian/Graphify grouping but are inert in the repo.

## Recommended tags
`#cure-runner` `#mateo-game` `#architecture` `#level-system` `#ai-agent` `#decision` `#risk` `#memory`

## Suggested graph relationships (for the human view)
- `decision` -> the `system`/`level` it constrains.
- `risk` -> the `system` or `file` it threatens (e.g. JourneyScene size -> AI-cost risk).
- `level` -> the `assets` and `phrases` it reuses.
- `architecture` note -> the `memory` note that summarizes its current status.

## Maintenance
- When a slice lands: update [project-current-state.md](../memory/project-current-state.md) and append to [decisions-log.md](../memory/decisions-log.md). Mirror into Obsidian afterward, never before.
