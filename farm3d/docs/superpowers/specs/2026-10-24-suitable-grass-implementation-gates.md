# Suitable-grass placement: implementation gates

Status: staged implementation acceptance with owner-approved named-file amendment A7. No merge or live deployment.

Owner direction on 2026-10-24: implement the researched full suitable-grass plan; unlock suitable ground immediately, preserve terrain heights, and allow confirmed free tree removal. The earlier A6 named-file approval permits only the `farm-land.js` buildable mask. The October 24 read-only audit found that the remaining implementation crosses protected editor, save and cache code. Obtain a new named-file owner amendment before editing those bytes; preserve A1/A2/A3, A4 containment, frozen evidence, original tests and all existing physical limits.

At 12:54:17 UTC the parent asked exactly for `farm3d/index.html` placement/camera/foundations/entrances/tree-clearing controls, `farm3d/game.js` safe saving/recovery/persistent tree removal and `farm3d/sw.js` matching offline-cache updates, with terrain heights, animal rigs, economy, Firebase rules and the fixed chicken yard unchanged; no merge or live deployment. The owner answered **“Approved”** at 12:58 UTC (Sentinel_f28172d3ffbc819188e4bf1aaffcc56b). This is A7, the named-file exception for the three scopes below; it does not broaden A1/A2/A3/A6 or approve a changed pen support/route validator. Before A7 edits, original SHA-256 digests at `253e72b` are: `index.html` `e750cb0e3b7a33338f9fd5854895868ad048df708887609c1221d80c1a96a748`; `game.js` `e8327df54542aa9ea8d1c6e6d5a5bc63fc031ccdc3f8001e60e22b3a49bd3f75`; `sw.js` `74aa9c02ededbda367efbf72b784b77edf684e6c829ab34b20026af76732e860`. Focused negative controls must detect changes outside the named scopes.

## Stage 1: shared site decision and safe ordinary edit

Acceptance: the selected workshop has one candidate result for preview and final Apply, using its entire unchanged 3.8 x 3.4 m footprint, current tree/object/path/pen/cow-access exclusions, ownership, and an explicit entrance approach. A valid preview must revalidate against the current obstacle/land revision at Apply; stale results cannot save. Cancel, interrupted touch, repeat Apply and storage-quota failure leave the prior scene, block registry, save, paid state and care reservations intact. A successful Apply/reload reconstructs one identical result. Retain REDs for a suitable hill rejected solely by today's mask and a footprint now allowed by the mask but buried/floating at y=0. No preview color is authoritative without the full selected-footprint result.

The pure site calculation belongs in a new module. The ordinary editor functions in `index.html` (`groundAt`, `editValid`, `commitEdit`, `applyLayout`, `editDown/Move/Up`) must consume it. `game.js` needs a prepared ordinary-layout commit or equivalent persist-before-publish transaction rather than mutating the live scene before `save()`. These are new protected scopes, beyond A6 and the pen-layout digest exception.

## Stage 2: supported hills and reachability

Acceptance: ray picking hits the same rendered terrain sampled for support. A workshop remains upright on a foundation with no unsupported corner or inaccessible doorway. Its visual root, contact/grass clearing, collision, placement marker, saved position and reloaded position agree. Obstacles, existing stone path, physical player passage and animal care routes retain their current margins; genuinely steep or unreachable sites report a concrete reason. Keep `farmGroundY` and the terrain mesh unchanged. Open suitable grass across the existing rendered ground, not just another arbitrary pocket; edit camera/touch can reach every advertised site. Owned animal-pen components require their existing support and station-route checks and independent qualification before being marked generally placeable on hills. The chicken whole-yard movement stays fixed.

This needs the A6 buildable-mask range in `farm-land.js`, editor/camera/picking in `index.html`, and possibly `animal-pen-validation.js` only for a separately demonstrated pen-support gap. Do not alter terrain heights, animal rigs, collision margins or care deadlines.

## Stage 3: stable, confirmed tree clearing

Acceptance: each removable near/hill/woods tree has a stable semantic ID, visual and collision ownership, and a saved removed/present state. Old saves load with their prior trees present. A clear action shows the selected tree and explicit free-removal confirmation; Cancel/repeated taps/storage failure remove nothing. A successful commit atomically removes its visual, shadow/grass/contact effects and every relevant placement, player, pet and pen obstacle, then survives reload, backup/import and cloud conflict/recovery. Restoring an old save must not silently delete trees. No invented currency cost or production Firebase-rule change.

Tree creation/merging and registries in `index.html`, the versioned schema and commit in `game.js`, and the offline cache manifest in `sw.js` are protected. The existing merged distant woods require a logical per-tree catalogue or safe batch rebuild before a selected tree can be removed. Tree IDs must not depend solely on array order or RNG sequence.

## Stage 4: guidance and release evidence

Acceptance: a neutral terrain-following grid covers the editable rendered map in bounded chunks without the current 10,000-cell exception or per-cell full-farm routing. Selected candidate feedback remains valid/blocked/unknown with reason, never says green for stale/unchecked results, and final Apply revalidates. Phone controls remain compact and usable in both orientations; grid rebuild and candidate checks stay responsive. Update service-worker versioned assets so offline clients cannot combine old validation with new placement/save code.

Keep focused RED and negative controls for support, entrances, paths, trees, paid ownership and care. Then run old-save/2D import and two-device conflict/recovery, occupied 46-animal Apply/care/route cases, phone-size local rendering, owner physical phone testing and official hosted checks. Do not count the existing unfinished occupied-shelter continuation, default-speed discrepancy, other Task 7/8 gates, or local Chromium as passed by this feature.

## Exact A7 protected amendment for stages 1-4

* `farm3d/index.html`: only ordinary edit picking/validation/preview/commit/reload, camera bounds, tree catalogue/confirmation and collision-registry synchronization. No animal rig, terrain/path or economy rewrite.
* `farm3d/game.js`: only versioned landscape-removal/layout save compatibility and atomic ordinary-edit persistence/recovery, preserving ownership/cloud handoff and existing pen transaction semantics.
* `farm3d/sw.js`: only the cache/version entries required by changed game modules.
* `farm3d/farm-land.js`: existing A6 buildable-mask region only; exact terrain-height, original `onFarm` and player-clamp bytes stay frozen.
* If actual pen hillside qualification proves a gap, request a further exact `animal-pen-validation.js` exception before changing its support/route behavior. The present plan does not preapprove it.

No merge or live deployment follows from these stages. The already-authorized owner-private Site is an isolated disposable preview only; verify no production-cloud writes or real-save import before its update.

## A8 player-reach amendment (owner approval, 13:29 UTC)

The parent asked: “may I expand `farm3d/farm-land.js::clampToFarm` so the player can reach the newly buildable land, while preserving terrain and obstacle collisions?” The owner answered **“Yes”** (Sentinel_68b5f150ebd4819182f202afad7ffab3). A8 permits only that named movement-clamp expansion with focused movement/obstacle checks. It does not permit flattening terrain, changing animal rigs or care clearance, removing trees without confirmation, or merging/deploying. Record its new digest and protect the old terrain-height bytes before editing. The A8 change is independent of the Stage 3 tree transaction and has not yet been applied at the reachable-tree checkpoint.
