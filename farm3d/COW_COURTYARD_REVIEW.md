# Cow courtyard — PR #90 validation

PR #90 is draft and unmerged. Main remains
`bf404a2a1261f3c7581025b249f2bd00c4539964`; the cow feature is not deployed.
Branch: `codex/cow-courtyard-20261020`.

The completed validation checkpoint `f5ebd1148affca6fbebfd3967e3148bd5fb4d0a7`
passed24/25 hosted jobs. The scene fixture now imports sceneryv4, matching the
page:844/1280 scene checks, exact wardrobe geometry/texture equality and legacy
mode pass. All cow diagnostics, installed/offline recovery, lights, market,
core regression, art and same-account save-conflict checks pass at that head.
Authenticated cow upload/restoration pass, but the later delayed-start cloud
race fails the original30-second reload deadline; its recovery assertion is not
reached. This is not a full recovery-suite pass or merge-ready verdict.

## Cloud fixture correction and qualification

The trace at`04b437a` proves a prompt1ms server response and1.5ms headers,
followed by19seconds in renderer Frame::Detach, including17seconds in GPU
DestroyCommandBuffer. The Node event-loop max gap was105ms. Simple GPU command
completion was not the correction:gl.finish took0.6ms and the original failure
remained. That failed experiment and its traces remain retained.

The old software-rendered test document must finish releasing its WebGL context
before the artificial25-second startup-race clock begins. The fixture now calls
the renderer's existing context-loss API and awaits its actual context-lost event
before each of the two deliberately delayed reloads. An already-lost context,
unsupported release API or release taking more than30seconds is an error. It
makes no account/save/hold/rules writes. No production renderer API or runtime
source changes as part of this correction.

Qualification source`2fd0500fbdf16f49571b932c6d5ab120c0322aff`, recovery run
39498083956/job118888244948, passes all22 original recovery assertions. The
measured old-context release took9881ms; subsequent document commit took43ms
and the reload25381ms within the unchanged30000ms deadline, including the
unchanged25000ms module hold. Cloud race revision7 stayed7, with0bad cloud
samples and0stand-in writes; the missing-cloud delayed-start case also passes.
Artifact12299491740 SHA256
`4463b7dd82ba34e521d82d2431f0f4cfc598e7bb0fe508b064efe18fac0f676f`
was downloaded, verified and inspected, including recovery.json22/22.

The adopted default at`fcb91e9` also passes22/22 in run39500639998, including
the strict context-release guard. The final fixture adopts that qualified
precondition without experiment flags;
`npm run test:recovery` exercises it directly. It retains browser/network timing
and original failures for future diagnosis. This is a headless test-fixture
correction; sustained physical-phone reload performance remains unverified.
All required workflows must pass on the final exact PR head before merge
readiness is claimed. The PR head/CI result is resolved from GitHub rather than
embedding a self-referential commit hash in this review document.

## Pose-aware integration fixture

The later full run on`fcb91e9` fails the legacy cow integration ray at1280:
`cow3d.browser.cjs:50` expects`animal`, receives`undefined`. Its fixed camera
looks at standing height0.9 even when natural courtyard care has folded the cow.
The same actual lying mesh reproduces0triangle hits from that ray. With the
production38-degree camera, the fallback point is18.731/20.292/37.462pixels away
at740/844/1280 respectively; the unchanged34-pixel fallback only covers the two
small views. This is distinct from the historical moving-cow tap failure.

The fixture now aims at the actual animated torso and additionally requires a
direct skinned-mesh hit, preserving the existing`animal`/`cow`, phase, distance,
resource and sandbox-save assertions. The real torso ray hits3triangles in all
three views; six actual-pose geometry tests pass locally. Production picking,
pose geometry, fallback radius and trusted-input/native tests are unchanged.
Original failure artifact12301871422 SHA256
`82955c5a6c16f0c5de1e5d1cde882b754c976403e9426cfe60025bdff1397961`
and screenshots/trace are retained in`cow-native-run13`. A new final exact-head
browser/core run must qualify the corrected fixture before readiness is claimed.

## Cow action identity during live updates

On`086d589`, native390x844 supplies pass, then the unchanged30-second tap on
`#cow-milk` times out. The cow remains ready with no queued job/tank credit.
Artifact12301478162 SHA256
`e3346bdc6229f518b1c574da4c234d40f56e52feff32d3b95a467a10988abdf2`
retains screenshots, video and the action trace. It records repeated button
replacement as activity changes from walking-to-water to off-to-graze, while
`refreshInfo` rebuilds the entire card even though its Milk action is unchanged.
This failure is tracked separately from the older Ready-cow/actBtn tap.

A cow-only patch now retains actual action nodes by stable control identity and
updates their attributes/disabled state/text in place. Activity/status remain
live; changing the cow/control set still rebuilds. Other tray types keep their
original refresh behavior. A real-browser DOM regression checks button/listener
identity across activity and cooldown changes, live disabled state, and a
new-cow rebuild. The original trusted native taps, timeouts, robot/XP/tank and
care assertions remain unchanged. This runtime UI correction needs fresh native
qualification; the DOM check is not substituted for the real journey.

Cache54 delivers the changed inline page. Existing exact installed/offline,
old-writer refusal and raw-save assertions are retained with their current-cache
pins moved from53to54; the cow update also compares cached index.html bytes.
The initial23 focused version/graph, actual-pose and original chicken/cow-control
checks pass. Final native/full CI and owner approval remain required.

Actual render evidence retained under the local`cow-native-run8` captures
includes day/night, feed/drink/lie/stand, five occupied beds, robot teat contact
and bulk-tank pickup at390/844/1280; installed52to53/cached29 refusal and
queued/approaching/docked offline boundaries pass. The courtyard geometry/materials remain unchanged by the later validation and
control-lifecycle corrections; final native CI must qualify the updated controls.
Viewports and software-GPU timings do not establish sustained physical-phone
performance. Review is by the sole author/lead, not an independent external audit.

Remaining gates: all required checks on the final exact head, followed by owner
visual/product approval and explicit merge approval. Other species' physical-care work stays gated after this cow
milestone. Historical cow-tap and wardrobe resource failures remain separate;
later passes do not establish their original causes.

## Historical implementation checkpoints

The following notes retain earlier evidence and superseded status. The current
qualification summary above takes precedence.

The owner approved concept4 and both plans. Cow care uses the unchanged five-cow
cap/prices/rates; stocked30-unit feed, free12-hour water, manual12-second robot and
50-gallon quality-preserving tank. Writer3 is activated only by actual cow care;
ordinaryv1 and lamp-onlyv2 farms retain their existing marker. The stock, job,
receipts and tank live in a pure ledger, independent of render frames.

## Verified locally

- 85 focused assertions pass, no failures/skips/cancellations; a further regression
proves eating cannot mark a drinking visit complete.
- Actual skinned geometry stays above the floor throughout41 lie/stand samples;
folded torso meets authored straw within.005m and muzzle contact within.08m.
- Five actual scene bay center paths avoid model geometry and dock/service/exit;
night/rain do not cancel committed trips, and standing finishes before walking.
- Malformed/mixed envelopes refuse raw-save overwrite; exact predecessor game29
refuses writer3; partial pickup retains milk/quality and cannot repay XP.
- Original chicken, market, decoration and writer contracts remain green in the
focused sweep. Full required hosted checks have not passed on the candidate.

## Native evidence recovered

| Run/head | Observed result | Artifact/digest |
|---|---|---|
|39464917356 /8590394|35domain pass; event modal intercepted Walk before stations|12283899319 /57be0953fb31069503cf07715a880650771021c3a5f7c79b482ffdb3a42486ec|
|39465733521 /5a3c92b|37domain pass; actual feed/water touch pass; tank selected during cow-selection test|12286115306 /c54a7ad61316cc9b6871a2e8dff8165e7d1bc13ff05ee982da5543ff67475485|
|39467800934 /ec84291|Feed/water and Milk request pass; approaching/docking timeout; offline transition/refusal pass but stale raw timestamp comparison fails|12285637635 /8320d23f1513edca6b0d3013de08490b6429a753d0e592a51c88c2cd6e4abaf5|

The first captured day image was modal-obscured. The second revealed poor camera
framing and grass through the foundation; neither is an accepted final preview.
Corrections close the synthetic event fixture, keep a ready cow's selection
stable, clear the foundation reversibly, and follow the uninterrupted robot trip.

## Still required

390/844/1280 full-resolution day/night and physical feed/drink/lie/stand footage;
20 actual GPU rebuilds with exact warmed baseline; docked/queued offline reload
boundaries and partial quality pickup; authenticated cow recovery;
all final exact-head required workflows; final adversarial author self-review;
owner visual acceptance and explicit merge approval. Viewports do not establish
physical-phone sustained performance. No independent external-agent audit exists.

Courtyard fits the existing build radius north of the chicken yard. An occupied
site preserves its paid objects and old enclosure; clear it and reload before
courtyard installation. No land expansion or automatic object relocation occurs.
Horses/sheep retain the old paddock. Other species' physical-care implementation
remains in the approved follow-up plan, gated after the cow milestone.

The latest trace preserves the60-second docking timeout with the cow still
approaching and no tank credit. A new regression reproduces the new adapter's
capped-delta slow walk; bounded physical substeps retain walking pace during
slow draws while discarding hidden-tab catch-up. The accepted wandering AI is
unchanged. The offline raw-byte assertion remains exact; its fixture now uses
the same fixed-clock method as the existing lamp writer-barrier test. No timeout,
contact tolerance or original assertion is relaxed. Historical wardrobe resource
drop remains unassigned and is not claimed fixed here.

## Successful first native/offline checkpoint

Diagnostic39469981279 passes on2033544:844x390 actual feed/water input,
ready-cow selection and Milk, measured dock,12-second service, one tank credit,
exit and native pickup with no repeatedXP. Actual52to53 installed-worker update,
cached29 byte-preserving refusal, current30 reopen, exact cached-module hashes
and offline paid-cycle readiness pass. Artifact12287191813 digest
`af04c7274a890c398e878d6596de7aab04b18e87681ecd14ff23d160cab1d5de`
was downloaded and its actual dock image/data inspected.

New five-cow testing reproduced skipped supply visits and a two-cow post
blockage. Cows now wait for stations, keep their own resting bay and yield in
small collision-checked steps. Paid cycles request their portion even at low
transient hunger; visual visits never spend feed again. Removal releases
reservations. These changes pass focused tests and await expanded native QA.
The shallow covered feed row is attached to the west shelter wing. No land,
prices, herd cap, recipes or other species' production changed.

Final visuals pin High and record the actual drawing pixel ratio, alongside
browserDPR1. The earlier automatic-graphics recording alone does not establish
that its drawing resolution stayed1. Three-size real-time care video and
fixed-step normal-composer closeups remain distinct evidence categories.


## Expanded diagnostic checkpoint ef24375a

Run39474692376 passes native844touch and1280mouse at actual drawingPR1,
including uninterrupted night feed/drink/bed/stand. The fixed-step normal
composer check passes390/844/1280, five distinct occupied beds, and20rebuilds
returning exactly311geometries/94textures. Downloaded ZIPs were SHA256 verified;
feed/drink/bed/day/night and native cluster-to-udder images/data were inspected.
The first feed closeup is partly fence-obscured; its next camera is inside the
yard. The actual native image still has flowers in circle-clearance gaps; a new
coverage RED proves the gap, and overlapping clearings now cover the foundation.
390native was still in checkout before the source was superseded; it is unqualified.

Installed52to53 and the cached29 writer barrier pass. New interrupted-job checks
pass docked reload, exact11999ms no-credit, offline one-time credit/XP, and partial
normal/gold pickup before failing the zero-console/network-error assertion on
three world textures. This shot fixture registers its worker after first loading
textures; it now reopens online under the installed controller and asserts all
three cache entries before going offline. No accounting/error assertion is
removed. Queued-offline case had not executed after that first-context failure.
This covers installed/reopened play, not immediate first-install offline use.

Adversarial author review also adds proven regressions for same-count farm
recovery/visit cleanup and saved layout before courtyard installation. Exact
predecessor/anatomy/gait/auth/security/light/market production sources remain
unchanged. Final hosted qualification must run on the corrected source.


## Corrected review of checkpoint93a47fa

The earlier circle-gap explanation was wrong: existing grass clearings are
squares. Its enlarged radius did not remove the visible flowers. Actual scene
inspection identifies separate Phase7M meadow stems/heads. The candidate now
restores original1.85 square clearings and adds a reversible instance-only
clearing within the courtyard. The meadow geometry/colors/placements outside
remain unchanged; removing the yard restores original instance bytes. Phase7M
adds only a stable stem name, with page/worker import updated to4. Native checks
now assert zero visible meadow instances within the yard at all three sizes.

Current focused checks:66PASS,0fail/skip.93a47fa passes390touch,1280mouse, all
three normal-composer poses/five beds/20GPU rebuilds, installed update and all
interrupted-job/queued offline cases. Its844Ready-cow tap fails when the cow
leaves the fixed camera aim; no job or milk is manufactured. The probe now follows
the moving cow with its camera throughout the trusted tap, removing its old
animal-freeze assumptions. Original30-second tap timeout and real input remain.

Matched static1280 High software-GPU frames average11.01ms without the yard
and11.54ms with it (10samples each, PR1). This is not physical-phone performance.
Warm20rebuilds return exactly315geometries/95textures within that run.

Art39476072800 (3jobs) and conflicts39476072859 pass. Authenticated cow
upload/restore pass, but later original delayed-start race hits its unchanged
30-second load timeout. Its original cloud log/artifact12289419079 digest
`93908ba81922b8448682f7ea9cc892d2e02e602f0df204039b388bd6bf4f8112`
are recovered. Added request-hold/release/navigation/boot timing observations
will distinguish causes; no production auth or recovery assertion changed.
Full final-head checks and owner gates remain pending.


706a98f native390/844 qualification failed before a Milk node existed. The real DOM
identity contract passed. The trusted Ready-cow tap completed but no cow card
appeared; this is distinct from the earlier existing Milk-node detach. Portrait
artifact12303525272 is verified locally (cow-native-run15); original30s limit and
all journey assertions remain. Input-event/DOM-mutation recording is now added
to the existing browser test to distinguish missing click delivery from hit/state
selection, without changing gameplay, tap dispatch or targets. Root cause pending;
PR90 remains draft, unmerged and not ready.


## Next correction: preserve card headers and isolate the legacy rig probe

At02af01f all5cow diagnostics pass, including trusted390/844/1280 journeys;
scene/wardrobe original assertions also pass, without assigning the older cause.
Two separate full-suite failures are retained:

- Core job118915008881, artifact12303803406 (SHA256
  6d1909e3aea4852c17005e0574172630a3d2ca142492864006aaafa7e4b30c2f):
  cow3d.browser.cjs:56 distance>0.01 fails at1280 with distance=measured=0.
  Its live cow already holds a bed task, so the existing care branch correctly
  overrides the legacy scripted stroll. Smaller sizes moved toward bed and
  passed incidentally. A real-Beast local reproduction measures0 before setup
  correction and0.883886m after. The test-only helper releases that reservation,
  resets the care overlay, and sets the isolated legacy rig in the clear aisle.
  Original120/180steps,0.01movement,1e-8agreement, blocked phase/amount, direct
  skin picking, and raw save assertions remain; no production AI change.
- Chicken job118915009131, artifact12303838561 (SHA256
  80a6e510719422338631f6c5cbe790694151915ee4a4446fe5060a5ada7765f1):
  native1280 Rename times out30s, repeatedly detaching during live animal-card
  updates. The earlier cow-row patch did not preserve headers or chicken cards.
  The same existing update path now preserves all animal-card buttons and their
  ancestors through compatible status/attribute changes. It preflights structure
  and control identity before applying any edits, with the original full rebuild
  for incompatible identity/structure. Station and non-animal trays are unchanged.

The browser DOM contract now covers cow Milk and header Rename/Close identity,
live text/disabled state, different cow/bird rebuilds, chicken header controls,
and no partial edit before a required fallback. Actual native chicken Rename
and cow journey assertions are untouched. Cache54 remains the unmerged version.
Original ZIPs, state, screenshots, traces and full logs are in cow-native-run17
and the ignored handoff folder. Next-head hosted results are still required.
The706 Ready-cow missing-card failure did not recur on02af01f; its cause is not
proven fixed. The historical wardrobe cause is also unknown. No merge/deploy.

Final local combined verification:36passed,0failed,0skipped (cow scene/pose/controls, chicken interaction/pet view, version graph and arm integration). Actual inline module and changed browser/helper syntax plus diff checks pass. New browser DOM contract and unchanged native Rename/core assertions still require hosted qualification.


## Weather VM dependency follow-up

eda7cef core job118925071341 failed before browser execution with
ReferenceError:prepareCowStroll is not defined in cow-test-preset.test.mjs.
The browser helper exists; its older weather-only VM did not bind the newly
shared setup function. The fixture now imports the real helper and supplies
real Three vectors. Both original weather-transition assertions are unchanged.
All57core Node files pass locally in60isolated invocations, including all4
animal-visual checks, using the unchanged core file list/isolation settings.
This follow-up changes no product code. Hosted full browser results are pending.

eda7cef's actual390/844/1280 cow journeys, all8DOM identity/fallback checks and
visual job pass. Verified844artifact12305180554 SHA256
a0ce39e6744d9d155d27055fd78e2f2d9853bf94f12c54bdc833f911e595ebec
is retained under cow-native-run18/native844, including128trusted input/mutation
records. These successful records establish delivery/selection in that run;
they do not prove why706failed. Original chicken Rename remains an unchanged
required hosted gate. No merge/deploy or physical-phone performance claim.
