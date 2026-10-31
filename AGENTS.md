# Repository Agent Instructions

For **Sunny Acres 3D** work under `farm3d/`, the canonical coordination files are:

1. `farm3d/AI_RELAY.md`
2. `farm3d/AI_RELAY_STATE.json`

Read both before planning, editing, testing, reviewing, or merging Sunny Acres work.

They define current phase, protected systems, evidence requirements, handoff format, and merge gates. When they conflict with older project handoff text or agent memory, the relay files take precedence for current state.

GitHub `main` is the source of truth. Do not code from a stale local/imported copy. Work on a dedicated branch/worktree, preserve frozen evidence, run required tests, and update the relay state in the same phase PR.

For non-Sunny-Acres areas of this repository, do not assume the Sunny Acres rules apply.

## Bot team (Sunny Acres)

| Bot | Role | Primary area |
|---|---|---|
| Robin | Coordinator; assigns work, reviews, and is the only bot that handles merges (only with owner approval) | *; only bot that merges, with Austin's explicit approval for each PR |
| Sunny Acres: Pens | Animal pens (layout, editing, care routing) | animal-pen-*.js, pen tests; game.js/index.html/sw.js only under a numbered amendment |
| Performance | Lag and frame-time work | perf.js, render/raycast hot paths, index.html (protected: needs a numbered amendment) |
| QA | Testing, regressions, bug reports | farm3d/tests/**, CI workflows (coordinate with Robin) |
| Fence & Pasture | Cow fence and pasture | animal-pen-pasture.js, cow yard/pasture modules, index.html and sw.js (protected: need a numbered amendment) |
| Sound | SFX and music | audio code in game.js and index.html (both protected: need a numbered amendment) |
| Art | Models and visuals | 3D models/characters; cow3d.js is locked under A3 and the reviewed-bytes registries (animal-pen-authorized-adapters.json, remaining-care-integration guard), so any edit needs a numbered amendment and registry update |
| Features | New features and content | new gameplay modules (scoped per PR); protected files only under a numbered amendment |
| Docs & Cleanup | Docs, coordination files, stale PR cleanup | *.md, AI_RELAY*, OWNER.lock, PROGRAM_STATUS.md |

Team rules:
- Owner: Austin Pederson (final authority on visuals, product, scope, destructive ops, merges).
- No real money: no purchases, paid plans, or paid services.
- Bots never merge on their own. Only Robin merges, and only after Austin approves the specific PR.
- No closing PRs or deleting branches without Austin's OK.
- Protected files (game.js, index.html, sw.js, cow3d.js, lib/** and the rest listed in `farm3d/OWNER.lock`) need a numbered amendment. A-numbers and cache versions come from the OWNER.lock registry (reserved: A42 fence v81, A43 #105 v82, A44 Sound v83, A45 Art v84, A46 Perf v85, A47 Features v86, A48 Pens v87 pending Austin, A49 Art world v88).
- One branch/worktree per task, starting from current `main`; bump the `sw.js` cache when runtime files change (current `sa3d-v80`).
