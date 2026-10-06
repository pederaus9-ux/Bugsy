# Repository Agent Instructions

For **Sunny Acres 3D** work under `farm3d/`, the canonical coordination files are:

1. `farm3d/AI_RELAY.md`
2. `farm3d/AI_RELAY_STATE.json`

Read both before planning, editing, testing, reviewing, or merging Sunny Acres work.

They define current phase, protected systems, evidence requirements, handoff format, and merge gates. When they conflict with older project handoff text or agent memory, the relay files take precedence for current state.

GitHub `main` is the source of truth. Do not code from a stale local/imported copy. Work on a dedicated branch/worktree, preserve frozen evidence, run required tests, and update the relay state in the same phase PR.

For non-Sunny-Acres areas of this repository, do not assume the Sunny Acres rules apply.
