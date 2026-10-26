# Occupied shelter placement and strict skin-translation diagnosis

Base: `2b9ae20fead8bbdd15827b44bdecaa19a5622f0d`. No runtime, locked implementation, existing test, tolerance, seed or deadline changed. This checkpoint is diagnostic; it does not qualify the shelter journey or grant visual acceptance.

## Placement is constrained, but coordinated relocation is usable through Apply

The original occupied right-nudge refusal exactly reproduces the retained PATH/OVERLAP/ROUTE issue list. The unchanged enclosure admits only 64 integer shelter anchors whose five translated bed docks remain inside: X=-5..2 and Z=-40..-33. Exhaustive filtering of all 66,049 native integer anchors confirms that domain. Every one has a definite production-validator static rejection. Only `[-1,-40]` and `[0,-40]` clear both land and path, but both introduce real new robot primitive intersections. These are valid refusals, not evidence that obstacles should be relaxed.

That result is limited to an independent shelter move in the captured farm. It does not establish global impossibility or a product rule that the shelter must never move. Explicit coordinated operations are already supported by the editor. The separately retained hypotheses explain the dependencies: moving the robot clears real geometry; reshaping the northern boundary restores bed approach space; moving/widening the gate clears the shelter post while preserving the full A5 access reservation.

One actual-command candidate passes the full unchanged validator with 437 route checks:

| Item | Final value |
|---|---|
| Shelter | `[-1,-40]` |
| Robot | `[12,-36]` |
| v0 | `[-12,-42]` |
| v1 | `[15,-41]` |
| v2 | `[15.8,-32.8]` |
| v3 | `[-14,-32.8]`, unchanged |
| Gate | edge `[v2,v3]`, offset `16`, width `4.300000000000001` |
| Feed bunk and trough | unchanged |

The native mouse/keyboard journey reaches Apply with all 46 publication placements exact, paid state preserved, same five occupied bed task/token object references, same reservation snapshots and task timers, and exact root displacement within the original `1e-8 m`. It is a coordinated edit, not independent-shelter acceptance. Wake, continued support, eventual release, reload and 30/120 Hz remain unreached.

## Retained strict skin RED

Native Apply fails the unchanged assertion `maxVertexDelta < 1e-8`, with residual `9.34030723e-8` to `9.34030763e-8 m` for all five cows. The asserted displacement is `[2.6,0,-1.75]`. This is approximately 0.0934 micrometres; the strict limit is 0.01 micrometres. The RED remains a RED regardless of its size.

The bundled Three CPU `SkinnedMesh.getVertexPosition` path multiplies each vertex by the double-precision bone world matrix and sums the stored skin weights. Some existing Float32 weights sum to `1 +/- 2.9802322387695312e-8`, rather than exactly one. A root-only translation therefore produces the vertex residual:

`residual = rootDelta * (sumOfStoredSkinWeights - 1)`

This is not quantization of `skeleton.boneMatrices`: that packed Float32 array is not read by this CPU method. It is also not evidence of a stale render. Source evidence is in the unchanged `lib/three.core.min.js::SkinnedMesh.applyBoneTransform` and the existing rig geometry.

The separate no-editor/no-adapter diagnostic constructs the unchanged rig at all five starting bed positions and changes only its root. Across 31,728 vertices per cow, both the composed displacement and the original independent displacement fail the original strict limit; zero-displacement controls pass. All local bone transforms stay bit-identical. The formula explains every vertex within `7.783e-15 m`, and predicts the native maxima within `1.139e-14 m`. Original displacement `[.6,0,.25]` produces approximately `1.9371513e-8 m`, also above the unchanged threshold. Thus the strict oracle already fails on pure translation of the existing rig without any pen adapter.

The additional passive native diagnostic records local bone/model/card matrices, rig state, root rotation/scale, and skin weights before/after Apply, retaining the same strict failure. Its exact result is recorded in `outcome.md`; no runtime behavior or assertion is disabled by this instrumentation.

## Exact pending decision

No runtime fix is supported by the diagnosed numerical effect. Changing skin weights, rig anatomy, the bundled Three library or support coordinates merely to satisfy this oracle would expand protected scope and is not proposed.

Continuing shelter qualification requires an explicit decision on the strict translation oracle, because the owner has prohibited changing assertions. Proposed narrow correction for review: retain exact local pose/state/weight invariance, root translation at the existing `1e-8 m`, and all existing support/contact/speed/separation/deadline checks; compare per-vertex translation to the translation predicted from its unchanged stored skin weights at the same `1e-8 m`, with negative controls that deliberately alter a root or bone. Preserve both original native REDs and the isolated original-limit failures. Do not claim this proposal has passed review or is already authorized.

This proposed oracle change has **not** been implemented. It is a pending test-contract decision, not a tool denial, runtime patch, waiver of physical movement limits or locked-rig permission. After that decision, the complete native shelter journey still needs to pass at 60 Hz before 30/120 Hz and reload can be credited. Other clearly independent approved facilities can proceed separately.

## Evidence boundaries

Pinned local Chromium151.0.7922.34 / Playwright1.62.1, 1280x720 CSS viewport, DPR0.5; real native editor controls, fixed-clock seeded fixture, five actual cows manually updated, other 41 animals static. All 46 are owned and included in validation/publication. This is not full-farm traffic, official hosted CI, physical-device, cloud, independent-audit or visual-approval evidence. The original rejected independent journey and all intermediate composed drafts remain retained. A4 exterior trips/transfers remain deferred; A5 overlay visual acceptance and default-cow movement hold remain unchanged.
