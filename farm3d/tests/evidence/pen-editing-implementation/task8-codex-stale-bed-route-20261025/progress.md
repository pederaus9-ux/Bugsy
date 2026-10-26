# A26 bounded result: bed route repaired, separate skin RED retained

Runtime commit: `ddb4746c0662d731ac6ccc992f71e6f803f92227`, based on `ee60e517af32959ffe445494b38254d5397cf884`. Local only.

## Correction and scope

The original assembly seed4242/120Hz failure was a real solid-post intersection: 497 body-bone vertices entered the post after lateral avoidance left a stale route leg. A26 records scope and pre-edit digests before changing only `index.html::updateCowTaskStep`. A bed approach with lateral-avoidance history now revalidates its static leg and uses the existing planner to rejoin the same waypoint. It refuses containing obstacles or an unusable repair without claiming arrival. Existing padding, support, speed, separation, reservation, native animation and care timing remain unchanged.

Original RED: 2 focused PASS / 4 FAIL. First broader candidate: 42 PASS / 1 FAIL; retained. Narrowing the correction to the diagnosed lateral-avoidance condition fixes that scope regression without changing the existing assertion. Final focused run: **43/43 PASS**, including 37 unchanged cow-scene regressions, captured pre-entry bed arrival at 30/60/120Hz, blocked-repair and clear-leg controls, and two deliberately corrupted outside-scope controls. Captured arrival takes 13.267 / 13.133 / 13.100 seconds, inside the original 500-second limit.

The runtime diff is 11 added / 2 changed lines in this one function. No rig, yard geometry, land, game/save/economy or other protected runtime changes occurred in this slice. No experimental expensive collision subsystem was integrated.

## Native failure remains a failure

`native-candidate/results.json` is **FAIL**. First night 277.7167 seconds and first full-herd wake 330.6583 seconds completed. The observer then found 91 skin vertices inside the same post during a different intermediate cow-avoidance turn. First witness vertices belong to the head; the root remains outside padded clearance. This is separate from the original stale-leg torso entry and from ordinary daytime jaw clipping. It does not by itself establish blocked gameplay or a regression caused by A26.

The original raw result and trace are preserved. Its metadata said three nights although the bounded diagnostic loop was explicitly two; the follow-through corrects that label. No three-night completion is claimed.

## One observation through actual bed arrival

`follow-through-acceptance.md` records the finite hypothesis before execution. Explicit diagnostic mode retains all skin failures but follows native movement to the same second-night 500-second deadline. It cannot report physical PASS and exits 1. The ordinary runner still fails immediately on a bed-approach skin collision. No original test/oracle assertion, seed, deadline or tolerance changed.

`native-follow-through/results.json`: **OBSERVED_BED_ARRIVAL_PHYSICAL_RED_RETAINED**.

- All 46 stable identities complete night1 in 281.5500 seconds, their original continuous wake checks in 330.6583 seconds, and reach 46 unique held beds in night2 in **286.3250 seconds**.
- Across 341,260 observed cow bed steps: minimum separation **0.8500322846 m**, maximum root speed **0.80000000000042 m/s** (within the existing 1e-9 check), maximum support-height error **0**. Containment, revisions, paid state and browser-error assertions hold.
- No observed root entry into the target post's padded region. This is not a claim about every post or continuous skin clearance.
- One head/jaw hit among 20 near-post bed-approach skin samples: 214 head and 162 jaw vertices at that sample. The target cow physically reaches and holds its assigned bed **14.9 seconds later**. Sampling at 10Hz does not measure exact continuous clipping duration or prove no between-sample collision.
- Three ordinary-motion skin-hit samples among 46 near-post samples remain separately recorded. The first contains head/jaw vertices. The herd subsequently completes wake and bed care; feeding, milking and occurrence frequency were not tested here.

This is a fresh run of the same native fixture/seed/rate, not an exact suspended-state continuation. Initial game clock is 5.2393 versus 5.0896 seconds in the first run; night1 differs by 3.8333 seconds. Boot uses elapsed render time before the fixed-step harness takes over. The second run supports functional bed completion; it does not rewrite the first result or prove identical histories. Runtime SHA256 is unchanged between the two runs; exact hashes are in `follow-through-source.json`.

## Impact and stopping decision

The narrow stale-route repair has focused and live functional support. The remaining head/jaw clipping is an actual physical RED, but it did not block observed bed arrival. Recommend documenting and deferring that brief visual issue under the owner's severity policy rather than starting another collision architecture. Do not mark it passed or infer full visual approval. No new runtime change was made after the focused candidate.

The sheep hesitation remains provisionally deferred with original wake RED intact; its prior reconstruction was not an exact original recovery. No further sheep repair was attempted.

Current A26 full three-night matrix coverage remains **0 qualified combinations**. Historical A22 24 PASS / 6 FAIL and source-specific A24/A25 results remain historical. The original boundary seed4242/120 third-night cow failure still needs a bounded live follow-through; its prior run stopped on the separately deferred sheep wake. Whole-matrix, full physical/contact/pose, old PR95 receipt, cache/save/cloud/hosted/device and visual gates are not newly cleared. No whole-game scan now.

All owned browser/server/test sessions finished. No executor or permission blocker. No upload, Site update, merge or deployment. Stop here with a saved local checkpoint; next useful work is the still-unqualified boundary care case, retaining any deferred wake/visual failures separately.
