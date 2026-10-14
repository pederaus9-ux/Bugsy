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

Owner update, 2026-10-11 19:49 America/Chicago: ChatGPT may start engineering reviews and hosted tests whenever evidence is ready, without asking again. This supersedes older handoff restrictions reserving hosted CI initiation for a separate owner instruction. It does not authorize merging, release, destructive changes or overriding owner visual/product decisions.

## 3. Agent roles

### ChatGPT
Technical lead, architecture, task specification, evidence review, red-team QA, phase gating, and GitHub coordination.

### Current owner instruction — 2026-10-11
ChatGPT/Codex is the sole active AI engineering lead and implementer. The owner canceled Claude and Grok. Do not require their handoffs or reviews, or claim they are working. Preserve their historical patches and evidence. ChatGPT performs implementation, regression checks and an adversarial self-review; disclose that this is not an independent external-agent audit. Owner acceptance and merge gates remain unchanged.

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

## Current phase - 2026-10-14

Owner approved the bounded visibility/master-gain runtime correction at 10:40:41
UTC. Applied exactly the proposed two lines in game.js; no unrelated runtime
changes. Original native audio suite now passes 10/10; the ten-second actual-tab
regression records zero hidden output, positive unmuted return and zero muted
return, with stored preferences preserved. See
[PHASE7N_AUDIO_FIX.md](PHASE7N_AUDIO_FIX.md) for exact source/integrity limits.
64 of 65 inventoried runtime files remain exact accepted baseline bytes; game.js
has the intentional approved audio-only exception. Historical 65/65 receipts and
the original audio failures remain untouched. Draft candidate needs exact-head
hosted CI and owner merge approval. No deployment, release or phone retesting.

### Previous audio failure checkpoint, 2026-10-14

Owner approved isolated audio qualification at 06:21:41 UTC. Native local Chrome
checks passed nine groups but failed actual hidden-tab ambient silence. A focused
reproduction recorded persistent nonzero PCM over ~10 seconds, trusted hidden/
visible browser events and zero hidden output under the game's master mute.
See [PHASE7N_AUDIO_QUALIFICATION.md](PHASE7N_AUDIO_QUALIFICATION.md) for exact
source `d8aed9e`, retained failures and the unapplied two-line fix recommendation.
Stop this testing scope here. Next approval: owner authorization for a narrowly
scoped shared-master gain/visibility fix. Runtime, existing tests and prior frozen
evidence remain unchanged. No phone, security, merge, deploy or release work.

### Previous connected checkpoint, 2026-10-14

The owner authorized recovery of checkpoint `e2f2ab2` into a fresh isolated
connected checkout, superseding the older replacement-environment restriction.
Recovery and 15 distinct local progression/update/restore assertions passed on
that immutable source: consecutive earned levels 1-8 with all 18 recipes/eight
orders; compressed/SA1/file import and failure guards; actual published old worker
installation followed by current-worker activation, save retention and offline
reboot. Failed environment/fixture attempts remain frozen. See
[PHASE7N_CONNECTED_QUALIFICATION.md](PHASE7N_CONNECTED_QUALIFICATION.md).
Review this documentation/test checkpoint next; recommend a separately authorized
local audio lifecycle extension. Broader device/physical-conflict/operational gates
remain open. No runtime, phone, security, merge, deployment or release work approved.

### Previous checkpoint credit, 2026-10-13

Current main: `a183e17b1a0a4f855d704da2ee8e5bc0187eed46` (PR80 merged).
Current phase: **7N — release qualification; report checkpoint ready for review, release gates open**.
[Regression201](https://github.com/pederaus9-ux/Bugsy/actions/runs/38392622802) passed all7 jobs; [Pages77](https://github.com/pederaus9-ux/Bugsy/actions/runs/38392621215) passed on this main.
PR79's conflicting-save emulator qualification and PR80's test-only rendered
ambient observation correction are merged and credited, not pending reruns.

The owner accepted all current animals and completed the qualitative Android/iPhone
phone round: modes, movement/interactions, saves/reopen/offline and weather were
reported good. Exact device assignment and sustained instrumentation remain incomplete;
no true shared-account physical conflict proof is claimed. No more phone tests now.
New bounded checks passed: catalog29 items/18 recipes,43 modules,archive65/65,
live static assets66/66. The initial failed Node network attempt and successful
curl follow-up are both retained. No runtime, criteria or live settings changes.

See [PHASE7N_RELEASE_QUALIFICATION.md](PHASE7N_RELEASE_QUALIFICATION.md) for
fixed-source evidence and limits. Owner confirms rules were already checked and are
good (2026-10-13 19:28:55 America/Chicago); credit that review as complete without
claiming this session independently verified deployment identity. Next: inspect
progression/update/restore coverage, then run only uncovered test-environment checks
after the original executor reconnects. Sustained measurements, physical conflicts
and operational/full-progression evidence gaps remain. Integration needs
owner merge approval; no merge, deploy or release authorized. ChatGPT/Codex only.
Full farm/progression remains free; optional future cosmetics are permitted.

The cow sections below retain historical intent and do not reopen accepted work.

## 12. Historical Sunny Acres cow program

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

## 13. Historical B9 intent

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

## Current bounded publication record - 2026-10-14

PR81 merged/published under the owner's 11:23:24 UTC conditional approval after unchanged exact-head readiness checks. Main is `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`; tree `fbbac30554c58a2153e79495723084701cc4e4ba` equals reviewed `e92a1ba40b53e8340f7d19c649e9a777d742ad28`. Regression203 all7, Pages78 and live static bytes5/5 passed. See [PHASE7N_AUDIO_PUBLICATION.md](PHASE7N_AUDIO_PUBLICATION.md) and AI_RELAY_STATE.json for exact receipts. Publication records remain on a separate evidence branch; no further main change is authorized by this outcome. Stop this completed patch task. Full release/additional development need separate owner authorization; no new phone work. Earlier phase checkpoint restrictions describe their historical authorization, not this completed bounded publication.

## Current later qualification record - 2026-10-14

The owner authorized the next isolated scope at12:13:04 UTC. Exact published main `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765` is unchanged. Later progression/land/daily/visitor/rush scope is complete with29/30 behavior PASS and a native-Date-confirmed visitor expiry action FAIL. See [PHASE7N_LATER_PROGRESSION_QUALIFICATION.md](PHASE7N_LATER_PROGRESSION_QUALIFICATION.md) and current state. Runtime fixes require a separate owner decision; propose only the one-line expiry guard. Prior publication/accepted animal/rules/phone evidence remains credited. No merge/deploy/release/new phone work is authorized by this outcome.
