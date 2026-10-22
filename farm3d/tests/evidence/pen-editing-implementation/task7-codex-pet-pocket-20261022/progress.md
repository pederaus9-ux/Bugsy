# Pet pocket checkpoint — 2026-10-22

Source: `cf29f6d6433ceb3060f6f049045504afb3c87c3a`; integrated main fetched and verified `1115f93101a0e86fdcc9780e053c17b73dd6dac5`. Isolated branch `codex/pet-pocket-20261022`, sole Codex implementer. Existing worktrees, dashboard and unrelated PRs preserved. The fresh Windows clone converted text to CRLF; before tests, restore only files whose LF-normalized bytes hash to their exact indexed Git blob. This restores the reviewed bytes, including A1/A2, without changing source.

## Acceptance criteria, written before reproduction or implementation

1. Retain RED on the exact source for seeds **23, 26, 41, 62, 69**, using the complete original Beast test body. Then run the original diagnostic sweep **2–81** and the unchanged official **4242, 1** cases. Preserve the existing 15000 steps at 30 Hz (500 seconds), three nights, 1200-step wakes (40 seconds), assertions and seeded random stream. A separate harness may parameterize only the diagnostic seed list, as in Claude's recorded method; original test bytes remain unchanged.
2. Trace exact failure positions, obstacle/fence/pen relationships and first-step legality before choosing a fix. Retain snapshots and first failure output in this new directory. Do not overwrite Claude's evidence.
3. Any correction stays within the authorized care controller/navigation scope. Preserve physical speed, support, fence continuity, whole building footprints, pen exclusion and neighbour body separation. No teleport, reduced body clearance, new physical penetration, changed roaming, rig, ledger, auth, terrain or path bytes.
4. Critically evaluate the proposed reduced-clearance recovery. Planner padding is not proof of body safety. If a pet already overlaps a footprint, any exit must reduce that penetration and never introduce another; an impassable real gap cannot be legalized by lowering clearance. If no safe correction is possible in controller scope, stop the runtime change and record the exact additional authority needed.
5. Add targeted negative controls for an impassable narrow gap, solid fence/closed pen, building-crossing shortcut and occupied route; assert continuous and per-frame clearance, original speed/support and unchanged full-clearance routing. Existing assertions, seeds and deadlines remain intact.
6. Re-run unchanged care controller/navigation/Beast and protected-byte gates plus the isolated core Node runner after a proven safe repair. Local Node/browser diagnostics are not hosted CI or physical-device clearance. Update both relays at this clean checkpoint; no merge or deployment.

## Recovery and rulings

- Approved spec and plan hashes and A1/A2 authority inspected. Chicken yard stays fixed; horse paddock movable/square. Only the exact recorded A1/A2 locked bytes are authorized.
- No game implementation/test writer observed in process command lines. Claude desktop processes exist; owner states Claude stopped. Tool servers remain untouched. External activity cannot be conclusively excluded.
- Model metadata request: supported host options are exposed in the `create_thread` / `send_message_to_thread` tool schema; current task model and effort are not exposed. No private session logs inspected, no model change requested, no other worker started.
- Ruling: use a native Node diagnostic harness in this checkout instead of the historical shell `sed` command. It must derive the exact original test body and change only the documented diagnostic seed-loop expression. Cost if wrong: invalid reproduction; record body hashes and compare before execution.

## Results and diagnosis

- Exact five-seed RED reproduced: **0/5 pass**, all failures retained in `source-five-red.log` with original body hash and command in its manifest.
- Complete original diagnostic range **2–81: 75/80 pass**, failures **23, 26, 41, 62, 69**, zero skips/cancellations. Four chunks use the historical partitioning method; every original assertion, deadline and wake remains unchanged. See `checkpoint.json`, `source-sweep-1..4.log` and manifests.
- Unchanged official Beast suite, seeds **4242 and 1: 2/2 pass** (`source-original-beast.log`). This limited suite still does not cover the reproduced failures.
- Protected-byte/default-geometry suite **4/4 pass** (`source-protected.log`). New physical negative controls **6/6 pass** (`physical-negative-controls.log`). These are diagnostic rejection proofs, not a repaired game.
- `source-five-snapshots.json` freezes all eleven animals and the exact world rectangles, fence segments and pen polygons for every failure. Reconstructed diagnostic plans use the unchanged controller. `seed-41-ordinary-entry-trace.json` observes the complete seed41 body with only a fixture wrapper; no RNG/state/controller replacement. Its original assertion still fails.

### Two defects, rather than the handoff's single classification

1. **23/26/41: ordinary movement has already put the pet inside the real barn footprint.** Barn is `[0,0,4.4,5.9]`. Dog centres are `(3.85,2.0010848143433106)`, `(3.85,-3.9812384919924213)` and `(-4.25,4.549263291012599)`. These are real footprint penetrations of 0.55, 0.55 and 0.15 m, not merely planner padding. Seed41 trace records ordinary `play` movement crossing the barn at t=4.7666666666666595 and again t=187.43333333332527, both without a care task. The final failed care begins from an already-invalid position.
2. **62/69: plan/step disagreement at a default pen corner.** Both retain a nonempty direct plan, contrary to the previous "all empty plans" summary. Continuous polygon clearance uses radial edge distance; `clearPoint -> fitsPen -> inPen` expands default convex pens by shifted half-planes (mitered corners). The 0.08 m sampling in `line` misses a forbidden part of the first 0.05 m physical step. The unchanged per-step guard correctly refuses it. Captured first-step assertions prove both cases; do not lower that guard.

### Why the proposed reduced-clearance escape is rejected

Seed41's dog margin is 0.42 m. The barn west face is x=-4.4 and the chicken fence is x=-4.9 (0.05 m fence radius): a body centre must be at most -4.82 to clear the barn and at least -4.43 to clear the fence. No full-body passage exists in that 0.5 m gap.

The existing monotone escape may reduce an already-present penetration, but cannot increase it or introduce another. For seed41 that limits the centre to x<=-4.25 until |z|>=5.75. The fence limits x>=-4.43. The north bush's expanded top at z=-5.2 and south bush's expanded bottom at z=4.98 both cover that entire strip, closing all four sides before the dog can leave the barn. The new control proves each boundary rejects crossing with the original continuous collision function. Searching farther cannot open it.

A diagnostic zero-pad segment `[-4.65,0,-4] -> [-4.65,0,4]` passes, while the unchanged 0.42 m body check rejects it. The suggested clearance reduction would therefore create a new body penetration. **No runtime candidate was applied.**

## Clean stopping point and exact authority needed

**Pending scope approval, not denied and not an uncertain mutation.** To fix the complete five-seed defect safely, authorize a narrow ordinary-pet collision correction in `farm3d/index.html`, specifically the `Beast.update` steering/final `fit`/pen-projection path and its route handoff, so ordinary movement cannot create the retained barn/fence pockets. Include a consistent continuous full-clearance pen-corner check in `remaining-care-controller.js` / `remaining-care-navigation.js`. This expands the delegated controller-only first slice and protected movement semantics; the approved pen-layout adapters do not authorize silently changing ordinary roaming. `OWNER.lock` also identifies index.html as protected outside its handed-off scope. No new A1/A2, land/path, rig, ledger, save, economy or auth edit is needed or proposed.

On approval: write focused ordinary-entry and corner-plan RED tests first; prevent the invalid source position, preserve full body/fence/footprint/animal separation and original speeds; rerun these exact five seeds, 2–81 and 4242/1 with original deadlines/assertions, targeted controls and core Node runner. Preserve this unchanged-source RED even if a safe repair changes subsequent seeded trajectories.

Tasks7/8 remain incomplete and authorized after this blocker is resolved; previous completed work remains credited. No preview/visual acceptance, new hosted CI, feature PR, merge or deployment. No full core rerun claimed on this evidence-only checkpoint. Author's diagnostic self-review only, no independent audit. All launched tests finished; no monitor/automation started.

Ruling: stop before a runtime correction because seed41 has no collision-preserving controller escape — relaxing the body radius would violate the owner's invariants — cost if wrong: ordinary-movement approval is requested unnecessarily, rather than shipping an unsafe route.
