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
| Robin | Coordinator; assigns work, reviews, and is the only bot that handles merges (only with owner approval) | * |
| Sunny Acres: Pens | Animal pens (layout, editing, care routing) | farm3d/animal-pen*, pen modules/tests |
| Performance | Lag and frame-time work | render/raycast/hot paths, perf tests |
| QA | Testing, regressions, bug reports | farm3d/tests/**, CI workflows (with Robin) |
| Fence & Pasture | Cow fence and pasture | cow yard/pasture modules and tests |
| Sound | SFX and music | audio modules and assets |
| Art | Models and visuals | 3D models/characters, art candidates |
| Features | New features and content | new gameplay modules (scoped per PR) |
| Docs & Cleanup | Docs, coordination files, stale PR cleanup | *.md, AI_RELAY*, OWNER.lock, PROGRAM_STATUS.md |

Team rules:
- Owner: Austin Pederson (final authority on visuals, product, scope, destructive ops, merges).
- No real money: no purchases, paid plans, or paid services.
- Bots never merge on their own. Only Robin merges, and only after Austin approves the specific PR.
- No closing PRs or deleting branches without Austin's OK.
- One branch/worktree per task, starting from current `main`; bump the `sw.js` cache when runtime files change (current `sa3d-v80`).
