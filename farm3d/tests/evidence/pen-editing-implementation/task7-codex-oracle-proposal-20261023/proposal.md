# Proposed occupied-shelter translation oracle

**Proposal only. No original assertion has changed and neither native shelter RED is passed.** The placement-guide appearance approval is a separate bounded acceptance.

For each skin vertex, capture its position and the sum of its four stored skin weights **before Apply**. Also freeze the expected shelter/root displacement from the command, not from the observed result.

Let:

- `d` = commanded root displacement, `[2.6, 0, -1.75]` in the retained composed journey;
- `s_i` = sum of vertex i's four stored weights before Apply;
- `v_i_before`, `v_i_after` = measured world-space skin vertex positions.

Current check:

`length((v_i_after - v_i_before) - d) < 1e-8 m`

Proposed check:

`length((v_i_after - v_i_before) - d * s_i) < 1e-8 m`

Equivalent form: subtract the independently predicted rounding term `d * (s_i - 1)` from the original residual. **The tolerance remains strictly less than `1e-8 m`; it is not increased.** Neither the expected command delta nor the expected weights may be recomputed from the post-Apply result.

Keep a separate root check:

`length((root_after - root_before) - d) < 1e-8 m`

Require exact equality of all local bone/model/card matrices, rig state, root orientation/scale and stored skin weights across the paused Apply. Keep every existing support/contact, separation, speed, planted-hoof, liftoff, reservation, paid-state and deadline assertion unchanged. This replacement is limited to the immediate occupied-shelter skin translation assertion, not animation/contact measurements during subsequent movement.

## Why the current expectation mismatches the accepted rig

The existing skin stores weights as Float32 values. Some sums are `0.9999999701976776` or `1.0000000298023224`, although their intended sum is one. Three's CPU skin-position calculation weights the bone world transforms, including translation, by those stored numbers. Moving only the root therefore produces a tiny extra term `d * (s_i - 1)`.

For this journey, the largest predicted magnitude is:

`length([2.6,0,-1.75]) * 2.9802322387695312e-8 = 9.340306487211477e-8 m`

The native measurements are about `9.340307e-8 m`. Passive capture proves local pose/state/weights unchanged, and that formula explains every measured vertex within `2.1450750043274925e-14 m`. The same effect occurs without any editor or adapter. No rig weights are normalized or altered by the proposal.

## Controls actually executed for this proposal

`animal-pen-shelter-oracle-proposal.mjs` runs outside all qualification runners, using disposable unchanged rigs and private geometry clones. Five uncorrupted root-only translations satisfy the proposed combined check; all five still fail the original uncorrected skin assertion. Seven deliberately corrupted cases are rejected:

| Injected error | Measured proposed vertex error | Additional detection |
|---|---:|---|
| Root extra X `2e-8 m` | `2.00000021e-8 m` | Root error `1.99999994e-8 m` |
| Root translated twice | `3.13408688 m` | Root error `3.13408679 m` |
| Body bone extra X `2e-8 m` | `2.00000021e-8 m` | Local bone matrix changed |
| Body bone rotation `1e-6 rad` | `1.08011807e-6 m` | Local bone matrix changed |
| Model X scale extra `1e-6` | `4.30000008e-7 m` | Local model matrix changed |
| Root rotation `1e-6 rad` | `1.16055391e-6 m` | Root quaternion changed |
| Stored skin weight extra `1e-6` | `3.96925376e-5 m` | Stored weights changed |

The controls include root and bone errors just twice the unchanged numerical threshold. They demonstrate detection in these isolated cases, not exhaustive error detection or native shelter qualification. Exact local-invariant checks also reject local changes even when their vertex effect falls below the numerical threshold.

## Status and remaining work

The proposal is not adopted and no test-change approval is inferred. Existing test files, rig/library/runtime bytes and all historical evidence remain unchanged. The owner instruction prohibiting assertion changes remains the reason to hold adoption for a precise decision.

If approved later, retain the original native RED evidence and verify the complete native 60 Hz journey with the corrected test before 30/120 Hz. Continued support, wake/release, reload and all remaining Task7/Task8/hosted/device gates are still pending. This probe supplies no merge/deployment or visual-release approval.
