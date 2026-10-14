# Sunny Acres visual/style audit and first polish proposal

Audit complete; implementation is not authorized. Owner approved this audit/planning scope at 2026-10-14 14:55:09 UTC. Recommend one material-coherence pass around the barn approach and adjacent fields. No game, assets, existing tests, accepted animals or production settings were edited. This is the lead's evidence-based self-review, not an independent external-agent audit.

## Exact source and evidence

- Authoritative published/runtime source: `d5ed6a96c50914320f30a7b74b799b7f66a9b6e0`, tree `05ac4ee6c3ff982ba2e8925d68fd5077667d058f` (PR82).
- Documentation base: `8c6d2f4aef4ae2a03a8a408886623303fe0fd134`, preserving the completed publication receipts. Dedicated branch: `codex/phase7n-visual-style-audit`. No PR was created.
- Remote main checked before planning and again before packaging; both remained the source above. Final remote/scope checks are in the evidence packet. Audit record head is the immutable commit containing this document; obtain with `git log -1 --format=%H` on this branch. It is not a new runtime build.
- [Actual-render gallery](evidence/phase7n-visual-style-audit/gallery.html), [15 captures and exact metadata](evidence/phase7n-visual-style-audit/captures/captures.json), [integrity checks](evidence/phase7n-visual-style-audit/scope-check.json).
- Representative current renders: [Classic courtyard, noon](evidence/phase7n-visual-style-audit/captures/desktop-classic-noon-courtyard.png), [Classic courtyard, golden](evidence/phase7n-visual-style-audit/captures/mobile-844-classic-golden-courtyard.png), [Walk, noon](evidence/phase7n-visual-style-audit/captures/mobile-844-walk-noon-path.png), [Walk, rain](evidence/phase7n-visual-style-audit/captures/mobile-844-walk-rain-path.png), [Walk, night](evidence/phase7n-visual-style-audit/captures/mobile-844-walk-night-path.png), [740-wide Classic](evidence/phase7n-visual-style-audit/captures/mobile-740-classic-noon-default.png), [mobile Shop](evidence/phase7n-visual-style-audit/captures/mobile-844-shop-noon.png).

## Direction and reference limits

Read AGENTS.md, both relay files, DESIGN.md, PHASE7_PLAN.md, PROGRAM_STATUS.md, PHASE7M_VISUAL_MAKEOVER.md, PHASE7M_VISUAL_POLISH.md, PHASE7K_MEASURED_PERFORMANCE.md and phase7m/phase7mx evidence/readmes. There is no checked-in .agents directory here. Current main/owner instructions override older pending/not-live labels in those historical documents.

The written owner direction is recognizably Sunny Acres, lush premium storybook-cozy 3D, warm cinematic light, readable materials, vegetation and cohesive HUD. The current red barn, cream trim, crops and warm parchment controls already supply that identity. The historical MAX WOW generated reference was an art-direction ceiling, not an achievable pixel-match promise or proof of runtime quality.

The two original owner makeover screenshots and the original approved generated concept are not present among the checked-in references inspected. Their descriptions survive in PHASE7M_VISUAL_MAKEOVER.md. Historical actual renderer captures in tests/evidence/phase7m/ and the real owner S26 image in tests/evidence/phase7k/s26-owner-baseline.jpg exist and were inspected. They are historical sources, not current-head acceptance. Later phase7mx barn/vegetation studies are explicitly unaccepted experiments, with authored-asset/ownership/LOD/cache limitations. Do not silently promote those models into production. The missing makeover attachments limit precise style matching; they do not block this conservative proposal grounded in the actual current renderer. Owner direction between a quieter storybook surface and denser realism remains a choice to confirm before implementation.

## Capture method and results actually obtained

PASS: source-integrity checks verify all 65 inventoried runtime files against published main and all 304 existing test/evidence files (185 frozen receipts) against the documentation base, with historical relay records preserved. The 15 PNGs were visually inspected, covering desktop 1280x720, touch-emulated 844x390 and 740x360, each at device/render DPR1 and fixed Best quality. Classic default and courtyard; first-person Walk along field/path; noon/golden/rain/night where listed; Shop at desktop/844. All three sessions report zero JavaScript exceptions, all requested local source assets returned 200, all screenshots report the declared Lilita One and Nunito 600/800 fonts loaded, and the sandbox produced no player save.

The server serves Git blobs from exact immutable source, not edited working files. Actual full production composer and shadow/postprocessing execute with normal animation. Existing ?testfarm gives level 12, 30 mixed-stage plots, owned workshops/default animals; fixed Date.now and seeded RNG hold crop/state conditions. Camera/player pose fixtures do not replace animal models, animations, contacts or movement. Animals continue their normal simulation, so their pose/emote state differs between screenshots. These are not pixel-identical performance replay fixtures. Google font CSS/woff2 were anonymously downloaded from the exact declared URLs, hash-recorded and fulfilled locally with CORS headers; no fonts/packages were installed. External game services are intercepted; guest/testfarm does not access accounts/cloud production data. Only the optional debug perf overlay is hidden; normal HUD and testfarm label remain.

FAILED setup attempt retained: the first extra page/font wait timed out without a screenshot or a game exception. Correcting cross-origin headers in the audit-only font fulfillment was followed by a complete second attempt. Do not erase or count the first attempt as a passing capture. Its raw transport/stderr/failure record is under attempt1-font-wait-failure/. A PowerShell quoting error while trying to patch that utility also stopped before modification or launch; corrected using apply_patch. Chrome updater IPC access-denied messages are retained in stderr; no permission/settings change was attempted.

These are mobile-sized PC views, not Android/iPhone/Safari/PWA/physical-device or sustained frame-time evidence. There was no new phone round, behavioral regression replay, workflow dispatch, rules review/export, production write, deploy or release. Earlier passing qualification/phone/rules evidence stays credited.

## Visual findings, in priority order

| Area | Actual observation | Assessment and recommendation |
|---|---|---|
| Ground and field borders | Noon/golden Walk foreground has bright, high-frequency photographic grass next to broad brown rectangular beds. Individual grass texture marks compete with crop silhouettes and the aim ring. Narrow bright green gaps and straight soil edges make the beds read as plates on a carpet. Rain strengthens the grass micro-pattern. | POLISH, first priority. Quiet the existing ground albedo contrast and harmonize soil/path tones. Preserve field shape, crop identification, wet/dry state and collision footprint. A still image does not prove shimmer or frame-time trouble. |
| Path | Warm lane leads clearly to the doors in Classic. In Walk, abrupt broad scallops and green islands at the right-hand transition dominate the near field. | POLISH. Retune the existing alpha-mask/soil texture contrast so the edge reads as wear in the lawn. Keep lane dimensions, wheel ruts, UVs and movement boundaries. |
| Buildings/materials | Red siding and cream X doors form a strong hero landmark; silo reads as metal. Dense tiny multicolor roof shingles are visually busy. Workshop roofs repeat that texture pattern in saturated green/blue/orange/purple, pulling attention away from the barn. | POLISH, later pass. Retain current forms/signs/colors for the first pilot. Roof paint/customization and shared roof use make a generic shingle rewrite wider than a single barn change. No replacement barn or extra architectural geometry now. |
| Crops/vegetation | Crop silhouettes and mixed growth stages are readable; mature wheat supplies warm color. Close green leaves are angular, contrasted with photographic grass/tree cards. Distant meadow flecks are dense; nearby borders supply pleasant flowers/ivy. | POLISH. Reduce terrain competition first. Do not add grass/flowers, remodel crops, move fences or enter accepted animal work in this pilot. Crop remodel is a separate owner decision. |
| Light/weather | Golden courtyard has convincing warm/cool depth and long shadows; noon has clean barn separation with a gray sky. Rain and night are distinct; action control and aim ring remain visible against dark surroundings. Some night scene details naturally recede. | Preserve presets/exposure/fog/fill/shadows/bloom/tilt. Extra warmth or global brightness is not needed to test material coherence and would recolor accepted animals. Still captures do not establish dynamic weather or nighttime gameplay acceptance. |
| Composition | Classic default prioritizes barn/pen; courtyard fixture includes fields/path/workshops. At 740x360, shops and some fields are cropped and UI occupies the corners. Walk arms, joystick and action control fill the lower frame while the central target remains clear. | POLISH, no proven defect. Review the terrain pass in both default and fixed hero cameras; do not change default camera/framing/FOV, player/hands or controls to make evidence prettier. |
| Interface | Rounded parchment/gold buttons and bold fonts cohere. Classic mobile has eight side controls plus a four-button dock; familiar labels are clear but the many equal-weight circles compete with scenery. Shop is readable with deliberate scrolling, showing only expansion rows at mobile height. Mixed emoji/product thumbnails remain a stylistic mismatch. | POLISH backlog. No clipping or unusable control was established in these views. Keep HUD layout, labels, sizes, icons, text, interactions and panel scrolling unchanged for the terrain pilot. UI restyling needs a separate scoped proposal. |

No BLOCKER/MAJOR production defect was demonstrated by this visual audit. These are aesthetic observations, not a reopened release or animal gate.

## One representative scene for the first bounded pass

**Barn approach and adjacent crop borders, noon with a golden cross-check.** Classic camera yaw-.55, pitch.35, distance32, target(0,1,5); Walk position(-1.4,22), yaw.7, pitch-.48. Use the current source/farm fixture, full pipeline and normal HUD. Review 1280x720 and844x390; retain740x360 default/walk checks for small layouts. Rain/night are material compatibility checks, not a new lighting project.

Proposed edits, all currently unapplied:

1. Ground-only albedo/material adjustment in index.html: start with ~20% less micro-contrast/chroma around a muted grass midtone; retain current grass.jpg, texture count/resolution/repeat40x40, UVs, geometry, vertex shading and existing weather hook. If a small ground-only sampling adjustment cannot do this without changing a shared shader/renderer contract, stop for scope review. Do not modify the generic std()/weatherize() path used by animals/buildings. No baked AO, extra pass, new vegetation or replacement texture download.
2. Existing path mask/material in index.html: halve the high-contrast spot variation used by the current ragged-edge mask and use a smooth deterministic side transition while retaining the 4.2x18 lane, position, ruts and depth/polygon-offset policy. Do not add transparent planes or change navigation.
3. Existing soilCanvas in scene-polish.js and M.tilled in index.html: retain seeds, 512px map/normal-map counts and furrow geometry; lower fine grain contrast about15%, favor broad warm earth variation, and trial normalScale .14 versus current .18. Preserve the wet/dry overlay implementation and visible separation from grass. No change to crop model/material/state, growth, harvest effects or plot placement.

The representative view is a review target, not a claim of spatially isolated code: the ground mesh spans the farm, and M.tilled/soilCanvas are shared by plots. These edits would affect their existing uses throughout the farm. Owner implementation approval must explicitly include that shared-material reach. If the owner wants changes confined to the courtyard, revise scope before coding; do not add hidden duplicate surfaces/masks to fake locality.

Likely files: index.html and scene-polish.js, plus narrowly scoped evidence/test/docs if later approved. No runtime change is made in this audit. The target is a quieter, more coherent version of this existing farm, not the experimental phase7mx barn or a generated concept match.

## Proposed measurable guardrails and later gates

These are proposed acceptance limits, not owner-approved or already-passing implementation claims.

- Structural budget: zero added draw objects, triangles, lights, shadow maps, composer passes, material groups or GPU textures; five visible lights/2048 shadows retained for these fixtures. Same texture dimensions and render DPR; no quality/Auto threshold cut to conceal cost. No per-frame allocation/texture generation. Current capture resources vary with lazy emote/material initialization; use matched warmed sessions rather than treating these snapshots as leak thresholds.
- Current full-pipeline counter reference below is for exact views, not a universal farm cap. Values include shadows/postpasses; do not compare the historical S26 screenshot's50calls or old 7K timings as though they were the same head/fixture/accounting. Reproduce current baseline and candidate with identical timed scene/animal fixtures before enforcing zero structural cost.
- Future performance gate: existing 25-scenario 7K methodology at844x390DPR2 and1280x720DPR1, paired current-main/candidate CPU stages and disjoint-checked asynchronous GPU timers, identical quality. Proposed maximum5% CPU/GPU p95 regression per scenario, no newly introduced CPU frame>50ms, and no unexplained retained-resource growth after warmup. An unexpected delta needs diagnosis; keep failures, do not widen limits. The historical 7M combined maxCPU5.90→6.20ms/GPU4.919→5.155ms is context, not a current pass or permission to add cost. No physical FPS claim or phone test now.
- Visual gate: actual candidate before/after at the recorded cameras, both modes/all three viewports, noon/golden with rain/night compatibility. Crops, aim ring, Plant/Harvest context, path and wet/dry distinction must remain readable. Preserve animal/source blobs and UI rectangles/control sizes; check new material-hook composition rather than overwriting weather/season logic. Owner chooses whether the calmer surface still feels Sunny Acres before any merge.
- Engineering gate if implementation is approved: fetch exact main, dedicated branch, preserve test baselines, focused material/state checks and appropriate unchanged regressions/exact-head hosted CI; adversarial self-review. Draft PR only. Separate owner visual/merge/publication approval. Full release stays separate. No replay of the completed phone round.

| Capture | Mode | Preset | Full calls | Full triangles | Geometries/textures snapshot |
|---|---|---|---:|---:|---:|
| desktop-classic-noon-default | Classic | noon | 546 | 1,186,179 | 249/93 |
| desktop-classic-noon-courtyard | Classic | noon | 519 | 1,183,695 | 258/96 |
| desktop-classic-golden-courtyard | Classic | golden | 530 | 1,186,979 | 262/96 |
| desktop-walk-noon-path | Walk | noon | 446 | 1,109,989 | 270/98 |
| desktop-walk-golden-path | Walk | golden | 471 | 1,142,389 | 270/98 |
| desktop-shop-noon | Classic | noon | 523 | 1,183,703 | 275/99 |
| mobile-844-classic-noon-default | Classic | noon | 556 | 1,187,601 | 251/93 |
| mobile-844-classic-noon-courtyard | Classic | noon | 523 | 1,183,789 | 260/100 |
| mobile-844-classic-golden-courtyard | Classic | golden | 533 | 1,187,071 | 264/100 |
| mobile-844-walk-noon-path | Walk | noon | 454 | 1,113,327 | 270/103 |
| mobile-844-walk-rain-path | Walk | rain | 461 | 1,138,303 | 271/103 |
| mobile-844-walk-night-path | Walk | night | 474 | 1,146,287 | 271/103 |
| mobile-844-shop-noon | Classic | noon | 536 | 1,183,815 | 274/103 |
| mobile-740-classic-noon-default | Classic | noon | 555 | 1,187,599 | 251/93 |
| mobile-740-walk-noon-path | Walk | noon | 449 | 1,113,295 | 259/94 |

## Boundaries and next decision

Accepted animal models/body/face/palette/animation/AI/contact systems, player/hands, crops, ownership/root contracts, renderer API, camera/controls, saves/backup/update, Firebase/rules/security, economy/progression, collision, worker/cache behavior and all prior frozen evidence remain protected. No installs, external review messages, production data/settings, other projects, original workspace or FS25 changes. Audio/visitor fixes, earlier failed attempts/curl receipts, completed phone and manual rules reviews remain credited.

Next owner approval: approve or revise the above material-only barn/fields pilot, including shared ground/soil reach and proposed budget. Until then stop at this reviewable report. No implementation, PR merge, publication, release or new phone work is authorized.

SUNNY ACRES RELAY HANDOFF: Codex; visual/style audit/planning; runtime base d5ed6a96c50914320f30a7b74b799b7f66a9b6e0; documentation base 8c6d2f4aef4ae2a03a8a408886623303fe0fd134; branch codex/phase7n-visual-style-audit; 15 actual captures complete; documentation/evidence only; first setup failure retained; protected source/tests verified; no new CI; missing original makeover attachments and no current sustained/physical performance acceptance; recommendation is a bounded unapplied material proposal, awaiting owner scope approval.
