# Production stack orchestration

Current authority updated: 2026-09-05

## Active stack — supersedes the historical routing below

Raúl's instruction: “Encárgate de la implementación tú que ya no tenemos a
Claude sino Astra”. **Codex/Astra owns implementation, art, integration and QA.**
Do not spend calls checking Claude or fall back to an API/paid tier. Re-enable
Claude only on a new explicit request from Raúl. One writer in the main checkout;
preserve the existing isolated worktrees and their WIP.

During the handover, the already-launched Claude attempt ended before inference
with no edits (2026-09-05). Its new worktree
`.claude/worktrees/opus5-september-polish` remains at `e1480b0` with only its task
brief; it served as a read-only comparison baseline. It is not an active worker.

Human creative/product decisions, purchases, commit gates, push, deploy and
destructive actions retain their existing boundaries. Art candidates stay in
`art-lab/` until approved. See [project-current-state.md](project-current-state.md)
for verified implementation status and [polish-2026-09-05.md](polish-2026-09-05.md)
for this slice's evidence.

## Historical stack — verified 2026-08-09, currently inactive

This is the shared operational memory for Raúl, Codex, and Claude Code. Read it
before delegating, generating art, or implementing an art-integration slice.

## Verified model and cost boundary

These are different products and their version numbers must never be conflated:

- **Antigravity IDE:** 2.1.1; VSCode OSS 1.107.0; commit
  `e0b7a2bcf575cfba10528c4e7c10bd3ce2d7769a`; Darwin arm64.
- **Claude Code extension installed inside Antigravity:** 2.1.226.
- **Older standalone Claude CLI:** 2.1.204.

The Claude Code extension's bundled binary exposes the exact model identifier
`claude-opus-5`; its Antigravity panel displays it as **Opus 5**. Raúl has
selected and used this model through his current Claude Pro subscription.

The same model picker and local Claude cache describe Fable as **Fable 5** and
state that it **requires usage credits** on this account. The public Claude Help
Center also states that Fable 5 on Pro runs on pay-as-you-go usage credits.

Operational rules:

- difficult implementation: `claude-opus-5` through the bundled 2.1.226 binary;
- mechanical or tightly specified checking: `claude-sonnet-5`;
- forbidden without new paid authorization: `claude-fable-5`;
- forbidden: API keys, Console billing, usage-credit activation, paid upgrades,
  or silent fallback to a paid model;
- every Claude report records model ID, effort, date, and whether it edited.

The older standalone binary `/Users/raulcapote/.local/bin/claude` was 2.1.204 on
the verification date. It did not expose Opus 5 and its `opus` alias resolved to
an older backend, which caused the earlier false diagnosis. Do not use it for
this production loop.

## Roles

- **Raúl:** final creative/product authority and the only person who can approve
  subjective art, new gameplay meaning, payment, commit gates, push, or deploy.
- **Codex:** supervisor, art director, image generation/editing owner, main-tree
  integrator, and final QA owner.
- **Claude Opus 5:** difficult code implementation, architecture, debugging,
  renderer/performance work, tests, and technical review of asset integration.

Codex decides whether an image respects Mateo's drawing. Claude decides nothing
subjective about Mateo's intent; it implements accepted requirements and reports
ambiguity.

## Checkout and communication contract

One writer per checkout. Codex retains the main checkout. Claude edits only in
a task-specific worktree created from the exact verified local HEAD. The
`same-dir` Remote Control mode shown in Antigravity must not be used while Codex
and Claude are both capable of writing.

There is no recursive Codex -> Claude -> Codex invocation. During a Codex-led
run, Claude cannot call Codex MCP. If implementation needs image work, Claude
writes a bounded art request containing:

- scene and runtime purpose;
- source drawing that is artistic authority;
- exact dimensions, alpha/layering, anchor, and mobile scale;
- states or frame sequence required;
- integration path and loading constraints;
- acceptance test and unknowns.

Codex produces versioned candidates in `art-lab/`, visually reviews them, and
hands only an accepted candidate or explicit correction back to Claude. This
artifact handshake replaces recursive agent calls and remains auditable.

## Production loop

1. Codex confirms cwd, Git root, branch, HEAD, WIP, and forbidden scope.
2. Codex audits the current runtime and Mateo's source drawing at mobile scale.
3. Codex defines one bounded slice with acceptance criteria and creates the
   isolated worktree.
4. Claude Opus 5 implements the code-heavy slice without commit, push, deploy,
   installs, destructive Git, external network, or nested agents.
5. Codex inspects every changed file and runs the validation gates independently.
6. Codex returns concrete defects to the same Claude session. Claude corrects
   them until the gate passes or a genuinely human decision is required.
7. Codex integrates only accepted work into the main checkout and re-runs the
   full gate there. Commit, push, and deploy remain separate human gates.

## Art direction invariant

The source drawing is Mateo's composition and identity, not a disposable sketch.
The art pass may add colour, material, texture, depth, separation, animation
layers, and mobile readability in the spirit of the approved Devilz treatment.
It must preserve the original silhouettes, proportions, asymmetries, marks, and
specific ideas. Remove annotation arrows or note fragments from runtime art;
implement their meaning as behaviour where approved.

No art slice may silently change physics, collision, hitboxes, difficulty,
ingredient, ending, boss mechanics, or narrative meaning.

## Required validation

- `npm run check`
- `npm test`
- `npm run build`
- `git diff --check`
- mobile visual pass at 360x640 plus a physical-device pass before release
- console/network smoke check for missing or eagerly bundled assets

Claude output is evidence to review, never final approval. Codex image output is
a candidate until visual selection or existing explicit approval is recorded.
