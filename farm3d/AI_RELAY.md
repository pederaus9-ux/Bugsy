# Sunny Acres AI Relay Protocol

**Canonical coordination document for all coding agents.**

This file exists so ChatGPT, Antigravity, Claude, Grok, Codex, Copilot/Cursor-style agents, and human contributors can hand work to one another without losing project state.

## 1. Authority and source of truth

- Repository: `pederaus9-ux/Bugsy`.
- Sunny Acres 3D lives under `farm3d/`.
- GitHub `main` is the only authoritative integrated codebase.
- Never treat a local workspace, Replit copy, stale handoff, chat transcript, generated patch, or unmerged PR as more authoritative than GitHub.
- Before changing code, fetch/pull current `main` and record its exact SHA.
- Work on a dedicated branch or isolated worktree. Never develop directly on `main`.
- Existing historical docs may be stale. For current coordination, this file and `farm3d/AI_RELAY_STATE.json` take precedence over `farm3d/HANDOFF.md` when they conflict.

## 2. Human authority

The owner is the final authority for:
- visual acceptance;
- product direction;
- scope changes;
- destructive operations;
- merges when a phase gate requires direct approval.

Agents may recommend a merge, but must not claim owner approval unless the owner explicitly gave it.

## 3. Agent roles

### ChatGPT
Technical lead, architecture, task specification, evidence review, red-team QA, phase gating, and GitHub coordination.

### Antigravity
Primary implementation worker when available: inspect repo, edit code, run tests, debug, capture evidence, push branch, and prepare PR.

### Claude
Deep implementation/refactor worker and alternate primary engineer. Preserve contracts and produce test evidence.

### Grok
Independent adversarial reviewer, alternate solution generator, and defect hunter. Distinguish proven defects from suspicions.

### Codex
Repo-native implementation/debug/test worker. Prefer bounded tasks, deterministic verification, and explicit diffs.

### CI
Objective verification layer. A green local run is not a substitute for exact-head hosted CI when hosted CI is part of the gate.

### Owner
Final visual/product acceptance and explicit merge authority where required.

## 4. Operating loop

Use this sequence unless a task explicitly requires something else:

**GOAL → INSPECT → PLAN → IMPLEMENT → TEST → FAILURE ANALYSIS → CORRECT → EVIDENCE → REVIEW → APPROVE/MERGE → UPDATE RELAY STATE**

Never skip directly from implementation to "done."

## 5. Mandatory preflight before coding

Every agent must:

1. Read this file.
2. Read `farm3d/AI_RELAY_STATE.json`.
3. Confirm current `main` SHA.
4. Identify current phase and active gate.
5. Inspect the files/interfaces relevant to the requested task.
6. List protected systems that must not change.
7. State exact acceptance tests.
8. Stop if the requested task is based on a stale branch or stale phase state.

## 6. Protected-system rule

Unless the task explicitly authorizes changes, do not alter:
- save schema or old-save compatibility;
- Firebase/auth/cloud behavior;
- economy/rewards/progression;
- unrelated animals;
- unrelated UI;
- collision/gameplay movement semantics;
- public renderer APIs;
- production ownership/root-object contracts;
- unrelated service-worker/cache behavior;
- previously frozen evidence/baselines.

A task that requires touching a protected system must be escalated before implementation.

## 7. Branch and PR discipline

- Use one bounded branch per milestone or defect cluster.
- Keep unrelated cleanup out of the PR.
- Record the exact base SHA and head SHA.
- Do not hide regressions by loosening tolerances, deleting tests, extending timeouts, or weakening assertions unless the owner/technical lead explicitly approves that change.
- Do not overwrite frozen evidence.
- Do not begin the next gated phase while the current gate is unresolved.
- If a PR head changes after review, prior approval applies only if the new changes are proven not to invalidate that approval.

## 8. Evidence contract

A serious coding task is not complete until the handoff includes:

- exact base SHA;
- exact head SHA;
- changed files;
- concise implementation summary;
- tests run and exact results;
- hosted CI status when applicable;
- performance/resource impact when applicable;
- screenshots/video/measurements when visual or motion quality is part of the gate;
- known limitations;
- protected systems verified unchanged;
- unresolved risks;
- recommended next action.

Use evidence, not confidence language, to establish completion.

## 9. Standard relay handoff

Every agent finishing or pausing a task should output this packet:

```text
SUNNY ACRES RELAY HANDOFF
Agent:
Task / phase:
Base SHA:
Head SHA:
Branch / PR:
Scope completed:
Files changed:
Tests:
CI:
Evidence:
Protected systems checked:
Known failures / limitations:
Unresolved questions:
Merge recommendation:
Exact next action:
```

If a task stops because of usage/session limits, produce this handoff at the nearest clean point rather than stopping mid-change.

## 10. Review severity

Review findings should be classified as:
- **BLOCKER** — unsafe to merge; proven contract/regression/data-loss/security failure.
- **MAJOR** — materially wrong behavior, missing acceptance criterion, or serious quality regression.
- **MINOR** — bounded defect that does not invalidate the milestone.
- **POLISH** — non-blocking aesthetic/cleanup opportunity.
- **SUSPICION** — plausible issue not yet proven; requires a reproduction/test.

Do not present suspicions as confirmed defects.

## 11. Merge gate

A PR is merge-ready only when:
- required tests pass on the exact reviewed head;
- no BLOCKER or MAJOR finding remains unresolved;
- protected contracts are preserved;
- required visual/device/manual gates are explicitly accepted;
- the owner has given direct merge approval when the phase requires it.

After merge:
1. record the merge commit;
2. confirm `main`;
3. update `AI_RELAY_STATE.json`;
4. sync any external coding workspace from `main`;
5. then begin the next phase.

## 12. Current Sunny Acres cow program

The cow program is gated sequentially:

- B0 baseline freeze — complete.
- B1 measurable Holstein reference — complete.
- B2–B8 static anatomy — complete and merged through PR #55.
- B9 gait retiming — next.
- B10 hoof/contact validation.
- B11 turning reconstruction.
- B12 transitions.
- B13–B15 renderer micro-behavior and recent-action suppression.
- B16 long deterministic behavior test.
- B17 full regression/performance.
- B18 controlled owner/device acceptance.

Do not start B10+ as part of B9 unless the relay state or owner explicitly changes the scope.

## 13. Current B9 intent

B9 must improve gait timing while preserving approved B8 anatomy and gameplay semantics.

Primary goals:
- visually more realistic dairy-cow stride;
- improved stance/swing timing;
- believable body weight transfer;
- stable behavior at 30/60/120 Hz;
- no new hoof skating/contact regressions;
- preserve gameplay movement speed;
- preserve 24-bone/public renderer contracts;
- preserve documented B0 stop/recovery/run-start failures as evidence until the phases assigned to fix them address them.

B9 is not authorization to rebuild anatomy, collision, AI behavior, save data, economy, Firebase, or unrelated systems.

## 14. Stale-context defense

If chat instructions, old handoff files, screenshots, local branches, or agent memory disagree with current GitHub:
1. stop;
2. inspect GitHub;
3. report the conflict;
4. use the newest owner-approved merged state unless explicitly told otherwise.

No agent should "remember forward" past evidence.

## 15. Fast user commands

When the owner says:
- **"Check Sunny Acres"** — inspect current GitHub state, active PRs, exact-head CI, relay state, and blockers.
- **"Take over"** — continue from the relay state at the next safe bounded task.
- **"Audit PR #N"** — independently review diff, tests, CI, evidence, and protected contracts.
- **"Merge"** — re-verify the exact head and required gates immediately before merging.
- **"Handoff"** — produce the standard relay packet without starting unrelated work.

This protocol is intentionally model-neutral. The agent is replaceable; the repository state, evidence, contracts, and gates are not.
