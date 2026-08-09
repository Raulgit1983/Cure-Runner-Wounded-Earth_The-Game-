# Codex orchestration — Wounded Hearth / Cure Runner

Read these files before changing the repository:

1. `.agents/PROJECT_CONSTITUTION.md`
2. `docs/memory/project-current-state.md`
3. `docs/memory/next-agent-brief.md`
4. `docs/memory/production-stack-orchestration.md`
5. `CLAUDE.md` when art direction, narrative, gameplay, or Claude delegation is
   relevant.

## Default team and authority

- Raúl is the final creative and product authority.
- Codex is the default supervisor, art director, image specialist, integrator,
  and final QA owner.
- Claude Code is the primary implementation worker for difficult architecture,
  debugging, refactors, performance work, tests, and other code-heavy slices.
- Codex owns image generation and image editing, including composition fidelity,
  clean alpha, cut-outs, layers, colour/material treatment, mobile readability,
  asset optimization, and visual comparison against Mateo's source drawings.
- Claude may edit code in an isolated task worktree. Codex keeps control of the
  main checkout, reviews Claude's diff, requests corrections, and integrates
  only accepted work.
- One agent may write in each checkout, but the two agents may work in separate
  checkouts. Never let them edit the same checkout concurrently.
- Never create a recursive Codex -> Claude -> Codex loop. A Codex-led Claude
  worker must not call the configured Codex MCP.

## Routing work from Codex to Claude

The Claude Code binary that exposes the account's current model catalogue is:

`/Users/raulcapote/.antigravity-ide/extensions/anthropic.claude-code-2.1.226-darwin-arm64/resources/native-binary/claude`

It is authenticated with the user's Claude subscription through the macOS
Keychain. Do not add or fall back to `ANTHROPIC_API_KEY`, Console billing, or
usage credits.

Use `claude-opus-5` for difficult implementation and long-horizon reasoning,
with high, xhigh, or max effort only when the slice benefits from it. Use
`claude-sonnet-5` for defined verification and mechanical corrections.

**Never select or invoke `claude-fable-5`.** On Raúl's Claude Pro plan it
requires usage credits and therefore additional payment. Fable remains blocked
unless Raúl gives a new, explicit, current authorization to incur that cost.
Never infer that authorization from task difficulty, a model picker, a trial,
or a promotional credit.

The standalone `/Users/raulcapote/.local/bin/claude` was version 2.1.204 on
2026-08-09 and did not expose `claude-opus-5`; its `opus` alias resolved to the
older backend. Do not use that executable for Opus 5 orchestration. Record the
resolved model ID reported by every Claude run.

### Read-only review

For a bounded second opinion, invoke Claude Code non-interactively with these
safeguards:

- `--strict-mcp-config` so the child cannot call the configured Codex MCP.
- `--permission-mode plan` and `--tools Read,Glob,Grep` so Claude cannot edit,
  execute shell commands, commit, push, deploy, or mutate external state.
- `--no-session-persistence` so a bounded consultation does not create a
  resumable child conversation.
- `--output-format json`, preferably with a narrow `--json-schema`, for a
  reviewable result.
- A prompt that states the exact question, permitted files, acceptance
  criteria, and: `Do not modify files. Do not delegate. Report uncertainty.`

### Difficult implementation

For a code-heavy implementation assigned to Claude:

1. Codex verifies the exact local branch, HEAD, status, existing WIP, scope,
   forbidden files, acceptance criteria, and validation commands.
2. Codex creates a task-specific Git worktree from that exact verified local
   `HEAD` under `.claude/worktrees/`. Do not base it implicitly on `origin/HEAD`.
3. Run the Antigravity extension's Claude 2.1.226 binary from the isolated
   worktree with `--model claude-opus-5`, an appropriate high effort,
   `--safe-mode`, and `--strict-mcp-config`. The task prompt must
   explicitly require reading this repository's authority files because safe
   mode disables their automatic discovery.
4. Give Claude only the tools the slice needs. A normal implementation may use
   `Read,Glob,Grep,Edit,Write` plus narrowly-scoped Bash rules for `git status`,
   `git diff`, `git log`, `npm run check`, `npm test`, `npm run build`, and
   `git diff --check`. Do not allow install, reset, stash, commit, push, deploy,
   destructive cleanup, arbitrary network access, or nested agents by default.
5. Keep the Claude session ID and worktree while review is active. Codex inspects
   every changed file and runs validation independently.
6. If Codex finds a concrete defect, resume the same Claude session with the
   defect, evidence, and acceptance test. Continue while each round makes
   measurable progress; stop for Raúl only when a creative/product decision or
   a new permission is genuinely required.
7. After acceptance, Codex applies or integrates the reviewed change into the
   main checkout, re-runs the full gate there, and reports both agents' work.
   Removing the temporary worktree is a separate cleanup step and must never
   discard unreviewed changes.

Because the subscription credential lives in the macOS Keychain, the Claude
process must run with the host permission needed to read that credential. A
sandbox authentication failure is not permission to switch to an API key.

Antigravity Remote Control's `same-dir` mode is acceptable only when exactly one
agent can write and all other agents are idle or read-only. For concurrent
Codex/Claude production, use an isolated worktree. Claude requests image work
through a versioned task manifest or review note; it must not invoke Codex MCP
inside a Codex-led run.

## Review loop

- Claude's report is evidence to inspect, never proof that code or art works.
- Codex must re-open cited files, inspect the resulting diff, and run the
  repository validation gates itself.
- Claude reviews Codex's technical image integration when useful: asset paths,
  lazy loading, dimensions, memory impact, anchors, runtime composition, and
  regression risk. Codex remains the visual authority and makes the actual
  image or art-direction decision.
- Codex reviews Claude's implementation for correctness, scope, regressions,
  mobile impact, visual consequences, and fidelity to Mateo's creative DNA.
- Human approval remains mandatory for subjective art selection, destructive
  actions, commits requested as a separate gate, push, deploy, publication,
  purchases, API billing, and external account changes.

## Repository safety

- Preserve existing WIP. No reset, discard, stash, branch switch, pull, merge,
  push, deploy, or cleanup unless the user explicitly authorizes it.
- Preserve Mateo's composition, asymmetry, marks, and handmade identity. Art
  review may add colour, material, texture, depth, and readability, but must
  not replace the drawing with a generic commercial interpretation.
- No gameplay, physics, hitbox, collision, difficulty, ingredient, ending, or
  boss decision may be inferred from an art task.
- Close every implementation slice with changed files, checks run, residual
  risks, and the next safest step.
