# Repository Agent Instructions

For **Sunny Acres 3D** work under `farm3d/`, the canonical coordination files are:

1. `farm3d/AI_RELAY.md`
2. `farm3d/AI_RELAY_STATE.json`

Read both before planning, editing, testing, reviewing, or merging Sunny Acres work.

They define current phase, protected systems, evidence requirements, handoff format, and merge gates. When they conflict with older project handoff text or agent memory, the relay files take precedence for current state.

GitHub `main` is the source of truth. Do not code from a stale local/imported copy. Work on a dedicated branch/worktree, preserve frozen evidence, run required tests, and update the relay state in the same phase PR.

For non-Sunny-Acres areas of this repository, do not assume the Sunny Acres rules apply.

## Bot team (Sunny Acres)

Austin approved dot taking over Sunny Acres coordination and the version registry, while retaining explicit owner approval before every PR merge. This supersedes Robin's current coordination role; references to prior approvals remain historical evidence. No new amendment/cache number, merge, publication, runtime change or destructive cleanup is authorized by this preparation.

Owner approval recorded 2026-11-06: Austin replied “Sounds good!” to the coordination/registry takeover request that explicitly retained approval before each PR merge.

| Bot | Role | Primary area |
|---|---|---|
| dot | Coordinator and version-registry maintainer; assigns work and reviews | *; merge only after Austin explicitly approves that specific PR |
| Sunny Acres: Pens | Animal pens (layout, editing, care routing) | animal-pen-*.js, pen tests; game.js/index.html/sw.js only under a numbered amendment |
| Performance | Lag and frame-time work | perf.js, render/raycast hot paths, index.html (protected: needs a numbered amendment) |
| QA | Testing, regressions, bug reports | farm3d/tests/**, CI workflows (coordinate with dot) |
| Fence & Pasture | Cow fence and pasture | animal-pen-pasture.js, cow yard/pasture modules, index.html and sw.js (protected: need a numbered amendment) |
| Sound | SFX and music | audio code in game.js and index.html (both protected: need a numbered amendment) |
| Art | Models and visuals | 3D models/characters; cow3d.js is locked under A3 and the reviewed-bytes registries (animal-pen-authorized-adapters.json, remaining-care-integration guard), so any edit needs a numbered amendment and registry update |
| Features | New features and content | new gameplay modules (scoped per PR); protected files only under a numbered amendment |
| Docs & Cleanup | Docs, coordination files, stale PR cleanup | *.md, AI_RELAY*, OWNER.lock, PROGRAM_STATUS.md |

Team rules:
- Owner: Austin Pederson (final authority on visuals, product, scope, destructive ops, merges).
- No real money: no purchases, paid plans, or paid services.
- No autonomous merges. dot must obtain Austin's explicit approval before every specific PR merge.
- No closing PRs or deleting branches without Austin's OK.
- Protected files still require an owner-approved numbered amendment and exact scope receipt/test. Verified merged assignments: A42/v81 (#107), A43/v82 (#109, superseding closed-unmerged #105), A44/v83 (#103), A45/v84 (#104), A46/v85 (#110). Reserved assignments remain A47/v86, A48/v87 (Austin confirmation pending), and A49/v88.
- dot maintains the unique amendment/cache registry for owner-approved scope. Implementers must not self-assign or reuse numbers; this patch allocates none.
- One branch/worktree per task, starting from current `main`; bump the `sw.js` cache when runtime files change (current `sa3d-v85`).

## Coordination snapshot - 2026-11-06

- Integrated GitHub main: `1d427a91f99804ca91b6cfa5d592f360430313bd` (PR #110); source cache `sa3d-v85`. This records repository source, not a fresh device or deployment qualification.
- PR inventory checked 2026-11-06: 110 total, 104 merged, 6 closed without merge (#34, #37, #54, #60, #68, #105), 0 open. Closed work is not merge ancestry; the audit distinguishes superseded changes from useful unique tests.
- B11 correction `dec9275b983155c442ac939fdee0e03f867443c2` is local and unmerged. It is separate from this documentation correction and from pasture work; no release or owner visual acceptance is implied.
- Historical failures, evidence and ownership/amendment reservations remain in force. This snapshot grants no merge, deletion, workflow-disable or publication authority.
- Current gate and historical diagnostic definitions are catalogued in `farm3d/CI_WORKFLOW_CATALOG.md`; their presence does not authorize reruns or removal.

### Superseded coordination wording (2026-10-30, retained)

The following lines describe the previous assignment, not current authority:

> | Robin | Coordinator; assigns work, reviews, and is the only bot that handles merges (only with owner approval) | *; only bot that merges, with Austin's explicit approval for each PR |
> | QA | Testing, regressions, bug reports | farm3d/tests/**, CI workflows (coordinate with Robin) |
> - Bots never merge on their own. Only Robin merges, and only after Austin approves the specific PR.
> - Protected files (game.js, index.html, sw.js, cow3d.js, lib/** and the rest listed in `farm3d/OWNER.lock`) need a numbered amendment. A-numbers and cache versions come from the OWNER.lock registry (reserved: A42 fence v81, A43 #105 v82, A44 Sound v83, A45 Art v84, A46 Perf v85, A47 Features v86, A48 Pens v87 pending Austin, A49 Art world v88).
