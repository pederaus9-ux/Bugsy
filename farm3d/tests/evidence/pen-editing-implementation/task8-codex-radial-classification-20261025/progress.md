# Radial dependency correction and grouped rejection diagnosis

Base `907a84ea9ef1fa7ef80cff147f2c6fa3894ccd7d`; branch `codex/safe-test-preview-20261023`. Local, test-only. `acceptance.md` preceded edits. No runtime change, new architecture, benchmark, upload, Site update, merge or deployment.

## Correction and evidence

The retained frame166 robot leg0 domain had nominal reach `[0.34095021969949774,0.5036765402138478]`. Independent multiplication by the interval for `0.34/reach` left an impossible component upper bound `0.5022728063458718`, beyond the unchanged0.5m helper guard. Native code clips the vector radially to0.34m. For exact radial projection, each component necessarily lies in `[-0.34,0.34]`; intersecting that invariant with the existing enclosing interval removes the dependency inflation without shrinking any actual geometry.

`cowReachClip` adds an outward `16*Number.EPSILON*(1+0.34)` scalar allowance and outward rounding to that invariant. It retains the original norm/scaling expression, native reach and helper guard. This uses the existing supported-engine numerical assumptions, not a universal guarantee for every ECMAScript implementation. [Rump's dependency discussion](https://www.tuhh.de/ti3/rump/Research_Rump/topics.shtml) supports the diagnosis; the [ECMAScript Math.hypot contract](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.hypot) explains why native rounding assumptions remain explicit. The source-derived disk invariant and project checks, not those references alone, support this correction.

- **75,625 native arithmetic witnesses**, 122 groups: signs, axes, interior/exterior, circle boundary, extrema, zero/subnormal inputs, retained interval, deliberately narrowed bounds, invalid intervals, nonmutation/RNG controls.
- Existing **21/21 controls** and **11/11 containment cases /1,903,680 native vertices** pass unchanged, including retained post/containing-obstacle and valid-route controls.
- Exact archived robot prestate and request match. The original trace reaches830 queries through frame166 without a domain exception; **317,280** captured-state native vertex checks pass. Query nonmutation and phase-history checks pass. The robot query still returns an uncertain collision, not a false clear.
- The three prior reversal intersections at162–164 still reject. All historical41 records and their38 unresolved cases are unchanged.

## One forward diagnostic capture, grouped rather than separate journeys

The server used immutable907a84e helper bytes to reproduce all **125 exact rejection signatures** in a single450-frame diagnostic trajectory. The corrected helper was loaded under a separate test-only module identity and evaluated on the same detached captured states. No timing results were collected or compared. There are2,250 nonmutation checks and zero recovery-history mismatches.

Each retained rejection received exact displayed triangle/box checks and a finite set of native fractional updates. All125 predicted endpoints match the captured next displayed matrices exactly. **795 fractional poses and125 displayed starts** were examined. This is finite evidence; in particular the two recovery-event rejections were not sampled through the interior of the evaluated-to-stored recovery event. They remain uncertain.

| Category | Count | Meaning |
| --- | ---: | --- |
| Confirmed skin/solid intersection | 65 | 61 first witnesses on the opened exit-gate bars;4 on the adjacent bed divider |
| Conservative uncertainty | 59 | No finite witness; corrected continuous query still rejects |
| Corrected enclosure clear | 1 | Robot frame428: supported conditional enclosure clears; not merely a sampled absence claim |
| Invalid candidate domain | 0 | No candidate query threw a domain exception |

`grouped-classification.json` records each frame, group, primitive, triangle and exact box. The original seven station/reason groups split into15 groups when primitive and outcome are included. They reduce to three useful causes: confirmed open-gate/divider geometry obstruction; remaining motion/recovery enclosure uncertainty; and one removed radial-dependency false rejection. All65 positive witnesses remain rejected by the candidate.

## Measured geometry cause

Production `yard.setStatus({job:{stage:'exiting'}})` parks the exit gate at rotationY=pi/2. Its two actual axis-aligned bar boxes exactly match captured solids40/41: x `[7.5175000012,7.5824999988]`, z `[-40.2999999046,-38.2000000477]`. The authored exit-to-turn root segment runs from `(8.6,-39.2)` to `(6.95,-39.2)`, crossing the parked leaf. Confirmed gate first witnesses occur at frames292–345 and350–356. Four first witnesses at346–349 hit solid18, the final bed divider at x about6.2 and z `[-39.925,-37.375]`; that box also exactly matches the production primitive.

These are positive native skin/solid witnesses in a scripted direct traversal of authored waypoints. **The live controller's planned route has not been tested here.** Sixty of the65 first witness triangles still intersect after shrinking every box face inward by1mm, an additional diagnostic demonstrating nontrivial overlap. That diagnostic does not change runtime geometry, tolerances or acceptance tests.

## Retained diagnostic faults

The first forward capture succeeded, but classification could not import the in-memory candidate module: the new server called `statSync` before checking its virtual source map. `forward-capture.json` is preserved. The server lookup was corrected, an import preflight was added before simulation, and one justified retry saved `forward-classified-capture.json`. No qualification assertion changed.

An initial summary incorrectly assumed every actual first witness belonged to the exit gate because it inspected only the representative of an aggregate group. Its assertion failed on the four divider witnesses. `summary-first-hit-assumption-red.json` preserves the mistake; classification was corrected from already saved data with no browser rerun. The interim parent-visible65-gate statement was corrected to61gate+4divider.

## Decision and remaining work

Stop here. Tightening an interval cannot safely eliminate these65 real geometry witnesses. The next useful bounded action is to inspect the live robot exit planner and its registration of the opened gate/divider blockers, then choose a physically viable route or a separately authorized geometry change if necessary. Do not weaken collision checks to make the scripted path clear. The59 uncertainties are not safe-route credit.

There was **no new performance measurement**. Prior907a84e observer evidence remains p9525.20ms, worst76.80ms, four frames >50ms; it applies to that prior helper. This corrected candidate is unmeasured. The current approach has not demonstrated both safe usable movement and the original frame budget; it should remain an offline test reference. The evidence does not prove every alternative route or architecture impossible, and phone performance remains unknown.

`verification.json` records16 unchanged runtime/helper/historical files, corrected helper digest and exact counts. Both relays updated. A20 gameplay physical safety remains RED, care/wake credit1/30, broad matrix paused. All owned processes closed. No pending executor/approval action or external write; previous upload denial remains held.
