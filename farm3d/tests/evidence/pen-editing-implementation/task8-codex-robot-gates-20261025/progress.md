# A21 robot gate correction — local bounded checkpoint

Base: `32f1871377968de6d558addf51a84e053cec0813`, branch `codex/safe-test-preview-20261023`. Owner approval and all runtime preimages were recorded before edits in `docs/superpowers/specs/2026-10-25-robot-gate-parking-owner-amendment.md`. No remote operation was attempted. Existing dirty shelter checkout, historical evidence, main and private Site remain untouched.

## Result

The two parked-open leaves now fold alongside the robot lane on separate tracks, clear of each other and side rails. Mesh dimensions and closed gate world transforms/vertices remain exactly equal to the immutable baseline. Exact outward-rounded leaf bounds participate in installed collision/navigation state and follow gate status without accumulating stale objects.

Directed routes retain an unreachable pending waypoint and its real reservation/job. Both the actual route predicate and direct/side steps reject crossing closed leaves. Removing an obstruction permits actual completion, without teleportation, fake arrival or lost targets.

Full-body observation also exposed two existing route defects. A robot-only point 0.5 m before the original entry approach gives the native rig room to turn clear of the entrance post. The exit turn is 0.35 m earlier along its original leg (default x=7.30 rather than 6.95), clearing the final bed divider. Both fresh and restored exit handling share this point. Authored approach/dock/exit/clear endpoints, rig, speed, support and separation limits remain unchanged. Both route changes had additional pre-edit digest/causal records before implementation.

## Exact current runtime browser evidence

These are real local pinned Chromium 151 native cow-controller jobs, with five cows and 46 owned animals; the other 41 controllers are paused. No production root replacement or expensive experimental movement guard is used. The custom case boots a saved default-shaped custom pen; it is not a new editor Apply journey.

| Artifact | Rate / mode | Setup | Exit | Observed entry/exit body hits | Gate hits | Minimum five-cow exit separation |
|---|---:|---:|---:|---:|---:|---:|
| `corner30-default.json` | 30 Hz / default | 24.9667 s | 8.1000 s | 0 | 0 | 1.374157 m |
| `corner60-custom.json` | 60 Hz / custom | 24.8000 s | 8.0000 s | 0 | 0 | 1.307522 m |
| `corner120-custom.json` | 120 Hz / custom | 24.7833 s | 7.9583 s | 0 | 0 | 1.303367 m |

Original 60-second setup and exit deadlines remain. Maximum measured target exit speed is 0.8000000000001251 m/s, within the original per-step numerical allowance; root-floor error is zero. Five stable IDs and the target exit token/job identity are checked from every retained exit frame, followed by actual job/task completion and reservation release. No browser errors. The 6,889 displayed target-body frames cover approach, milking and exit; the **milking findings below remain RED**. Speed/separation/root-height telemetry is for exit, not a new all-frame/all-cow physical certification.

`cow-robot-gates-evidence.mjs` generates `verification.json` from existing raw records without browser reruns. Exact final runtime hashes identify the uncommitted candidate used by the three final cases; raw `head` fields correctly name their base. No runtime change followed these runs.

## Focused checks

- 59/59 checks in `final-focused-tests.txt`: geometry, blocked/recovered routes, registry lifecycle, existing cow scene, occupied robot phase, yard and cup-contact tests. This precedes the final exit-turn adjustment.
- 39/39 directly affected cow scene/route checks in `final-route-regressions.txt` after that final adjustment, including actual valid bed paths and 30/60/120 Hz obstruction recovery.
- A21 exact preimage reconstruction and unrelated roof/arm/bar/closed-pose negative controls pass 2/2 in `lock-controls.txt`. Nineteen protected/helper/historical files are verified byte-identical to the base; every adapter registry field outside the approved cow-yard entry also matches.
- Registry control covers translated installation, dynamic open/closed extents, 20 status toggles without growth, cancelled preparation and old-object retirement. It does not replace the separate failing old install fixture below.

## Retained REDs and cause-based corrections

- `red-local-default.json` / `red-local-custom.json`: exact 64 exit gate-hit frames each, under the original limits. The first sandbox-only navigation failure is separately retained in `red-default.json`; permitted local browser execution then worked.
- `geometry-candidate.txt`: strict rectangle containment caught approximately 8.88e-16 m reconstruction undercoverage. The bound was enlarged outward; the assertion was not changed.
- `regressions-first.txt`: an initial new all-static per-step guard failed three existing scene cases; it was not accepted. Final new checking is gate-specific, retaining pre-existing static routing/sidestep checks. Old padded-post weaknesses remain separate.
- `entry-baseline-custom.json`: immutable-base native trace confirms three entrance-post body hits and the same milking plate/cup findings as the candidate. Gate parking alone did not cure entry; native earlier staging removed the observed entry hits.
- `final60-custom.json` / `final120-custom.json`: 11/20 actual live bed-divider hits before the final turn correction. These are preserved, not relabeled benchmark artifacts. Final `corner*` cases clear the observed divider.
- Initial new route-module URL fixture error, new summary preservation-list error and diagnostic logs remain. Their corrections affect only new harness/report setup, not accepted assertions.

## Remaining blockers and limitations

**The robot attachment plate still intersects actual cow skin during milking.** Exact current counts are 26/52/102 displayed first-hit frames at 30/60/120 Hz, primitive 43 (the rectangular arm cluster plate). All 180 stored triangle/box witnesses reconfirm offline; 168 remain positive against an additional 1 mm inward diagnostic box, while all 180 far-box negative controls reject. This diagnostic does not reduce acceptance geometry. The unchanged base has the same 26 plate frames at 30 Hz. The additional 283/567/1,137 primitive-44 hits are against a cup's bounding box; cylinder/cup contact is intentional and its AABB alone does not establish unwanted penetration. The existing four-cup contact test passes. These categories must not be conflated or automatically waived.

A21 authorizes parked gates and matching routes, **not robot-arm geometry**. Do not change the plate/cups or rig under this amendment. The next bounded step is to map the retained plate witness to actual anatomy/attachment phase and distinguish intended contact from unintended arm intrusion; if correction needs arm geometry, prepare a precise owner scope request. The body/plate issue prevents a full robot physical-safety pass. `LIVE_ROUTE_BOUNDED_PASS` in raw browser files is limited to their explicit route/gate/motion assertions; it does not assert that `fullHits` is empty.

Two separate old regression gates remain RED:

1. `animal-pen-scene-install.test.mjs`: synthetic VM lacks `hills` after earlier map work. `install-baseline-red.txt` reproduces the same ReferenceError with immutable base index source. Old tests were not edited or skipped.
2. `cow-turn-lock.test.mjs` positive lock test: unchanged `chicken-stations.js` hash `e4b680d...` differs from the existing reviewed registry hash `2c4293ab...`, identically at the base. Six existing negative lock controls pass. No unrelated digest was re-registered to hide this mismatch.

All earlier 65 confirmed / 59 uncertain query cases, A19/A20 post failures and rejected performance experiments remain preserved. The expensive collision experiments are still test-only. No continuous-motion, physical-phone, hosted, whole-herd traffic, full paid/save audit or performance claim is added. Current A21 care/wake matrix coverage is **0/30**; prior A20 1/30 and earlier passes remain historical and require affected-code requalification. Broad matrix remains paused on physical safety. Cache references were not advanced for this local-only checkpoint.

All owned browser/server/test commands finished. No approval/tool wait. No upload, Site update, merge or deployment; the earlier upload denial remains held.
