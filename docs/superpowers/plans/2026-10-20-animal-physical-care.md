# All-Animal Physical Care Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Sole lead/native execution and adversarial self-review; no independent-agent claim.

**Goal:** Make chickens, sheep, horses, dog and cat physically use feeding/drinking stations and sleep in beds/buildings, completing the owner's all-animal requirement.

**Architecture:** Reuse the qualified animal-stations scheduler and animal-care-poses adapter from the cow milestone. Add species-specific station/support geometry and pose profiles in reviewable increments; retain each species' existing production/reward rules and accepted ordinary locomotion.

**Tech Stack:** Existing Three.js/ES modules, Node tests, pinned Playwright, existing CI. No physics engine or new dependency.

**Spec:** docs/superpowers/specs/2026-10-20-cow-courtyard-robot-design.md.
**Prerequisite:** Cow plan completed through owner preview/merge gate. Re-fetch main and record the actual integration SHA before execution; never start from an assumed future commit.

## Global Constraints
- Every animal walks to a reserved accessible slot; no teleporting or standing-sleep icons as a substitute for the required pose.
- Approved dimensions, anatomy and walking/contact tolerances stay intact.
- Chickens retain30 cap, current feed/water supply economics and egg pallet; sheep retain wool rules, horses retain carrot/ride rewards, pets retain love/treat behavior.
- New sleeping/feeding/drinking poses and directed tasks are authorized. Separate larger pen redesigns, new prices and automatic milking are not included.
- No relit/retuned game, land expansion, dependencies or Firebase policy changes.
- Cow robot must continue to pass; shared adapters cannot change cow accounting.
- Native scene evidence per species and final-head CI required; owner approves actual preview and merge.
- No claim of sustained physical-phone performance from software-rendered viewports.

## Review Focus
1. Chickens must physically climb the raised coop ramp and settle on the correct floor rather than passing through walls or sleeping below it (Task1).
2. Many animals requesting the same station at night: no stacking, starvation, ghost reservations or permanent blockage (Tasks1/2/4).
3. A pet following the player when sleep/weather/care begins: task cancellation preserves bounds and reaches a usable bed (Task3).
4. Large horses/sheep changing to lying poses near a wall: no body penetration or discontinuous standing/walking contacts (Task2).
5. Reload/night-mode changes during station access: reservations rebuild safely, paid production and cow robot sessions remain exact (Task4).

## Shared interfaces from the cow plan
createStationScheduler(stations) -> request(animalId,kind),arrive(token),release(token),snapshot(),restore(snapshot).
getAnimalCarePose(kind,rig) -> apply({mode,weight,target}),reset().
Stations provide world approach/dock/facing and support surface. Extend support with sampleStationSupport(stationId,x,z)->{height,normal,inside}; ordinary ground sampling is unchanged outside explicit access surfaces.
Beast adapter owns locomotion/reservation transitions; production remains in game/domain modules.

### Task1: Chickens use real feeder/waterer and coop bedding
**Files:** chicken-yard.js, chicken3d.js, animal-care-poses.js, index.html; tests/chicken-stations.test.mjs; tests/chicken-care-physical.browser.cjs.
**Interfaces:** createChickenYard adds station descriptors and explicit ramp/door/floor access; existing group/layout/targets/applyAppearance/setStatus/dispose remain backward compatible.
- [ ] Write tests for30 unique rest positions inside the coop footprint, capacity-limited feed/water slots, door clearance and continuous ramp height. Assert poultry feet follow support and birds settle on the coop floor, not y0 beneath it.
    assert.equal(restSlots.length,30);
    assert.equal(new Set(restSlots.map(s=>s.id)).size,30);
- [ ] Run node --test farm3d/tests/chicken-stations.test.mjs; retain RED. Native run node farm3d/tests/chicken-care-physical.browser.cjs must demonstrate initial old behavior differs, if browser available.
- [ ] Add accessible interior bedding and entry route with height sampling, actual feed peck and water sip poses, reserved flock occupancy and resting pose. Keep chicken-care accounting unchanged; cosmetic feeding cannot manufacture eggs or refill empty supplies.
- [ ] Require new tests PASS plus original coordinated/start-turn/stop/30-flock/egg-care suites unchanged. Capture actual approach, ramp, rest, drink and peck at phone/desktop sizes.
- [ ] Commit chicken behavior.

### Task2: Sheep and horses use beds, troughs and feed stations
**Files:** animal-care-poses.js; sheep3d.js; horse3d.js; new farm3d/animal-care-stations.js; index.html; tests/sheep-care-physical.test.mjs; tests/horse-care-physical.test.mjs; tests/large-animal-care.browser.cjs.
**Interfaces:** createAnimalCareStations(layout)->{group,stations,dispose()} provides visible straw beds, feed/water contact surfaces and access outside robot lanes; species use shared scheduler and pose adapter. No overhaul of public renderer APIs.
- [ ] Write per-species tests for individually reserved beds, supported folded-leg poses, muzzle-to-feed/water contact, standing completion before movement, and wall/ground clearance across current maximum herd sizes.
    assert.equal(sheepRewardBefore,sheepRewardAfterCosmeticVisit);
    assert.equal(horseRideBefore,horseRideAfterCosmeticVisit);
- [ ] Run node --test farm3d/tests/sheep-care-physical.test.mjs farm3d/tests/horse-care-physical.test.mjs; preserve intended RED.
- [ ] Implement species-specific lie/stand poses rather than scaling the cow pose. Route to visible stations in their safe retained accommodation; maintain horse4/sheep5 counts and existing rewards. Choose supported bedding paths clear of cow robot/courtyard and original walk routes.
- [ ] Require PASS plus all original horse reversal/turn/contact and sheep stop/contact assertions unchanged. Inspect actual continuous lie->stand->walk and feed/drink sequences; geometry PASS alone is insufficient.
- [ ] Commit sheep and horse behavior as separately inspectable changes if one requires further correction.

### Task3: Dog and cat physical bowls and sleeping beds
**Files:** animal-care-stations.js, animal-care-poses.js, quadruped3d.js, index.html; tests/pet-care-physical.test.mjs; tests/pet-care-physical.browser.cjs.
**Interfaces:** Add dog/cat bowl and bed station descriptors; existing createQuadruped/updateQuadruped APIs stay compatible. Task interruption goes through scheduler release rather than moving the pet directly.
- [ ] Write tests for bowl contact, distinct curled bed poses, shelter access, follow/play/sleep transitions, no visits inside livestock pens, and unchanged love/treat/reward values.
    assert.equal(petStation.kind,petKind);
    assert.equal(reservationOwnerAfterRelease,null);
- [ ] Run node --test farm3d/tests/pet-care-physical.test.mjs; retain RED.
- [ ] Implement beds and water/feed bowls near appropriate existing shelter, preserve accepted pet faces/anatomy/contacts and allow following again after care. Cosmetic bowl visits do not auto-charge coins or grant treats.
- [ ] Require PASS plus original pet contact/stop/follow tests; inspect actual dog and cat sequences, including weather/night.
- [ ] Commit pet behavior.

### Task4: Shared care priority, recovery and all-species qualification
**Files:** animal-stations.js, animal-care-poses.js, index.html, tests/all-animal-care.browser.cjs, regression workflow, core runner, relay/review records.
**Interfaces:** Reuse scheduler/pose adapters; no second behavior engine.
- [ ] Write stress fixtures for five cows/five sheep/four horses/thirty chickens plus both pets; night/rain/day transitions, occupied slots, interrupted approaches, repeated wardrobe/scene rebuilds and reload. Assert every animal reaches its assigned accessible bed/station and leaves safely; one cow robot job remains correctly credited.
- [ ] Run new suite for meaningful RED on missing cross-species behavior. Preserve exact old assertions and classify fixture/product failures separately.
- [ ] Implement minimal common priority/recovery corrections indicated by evidence. Rebuild cosmetic reservations from stable animal identity on reload; persisted cow robot state remains authoritative. Cap repeated path attempts and expose blocked state instead of looping/teleporting.
- [ ] Run all new species tests, original animal suites and final exact-head regression/art/release checks. Capture genuine normal renders/videos per species at390/844/1280, matched resource/frame measurements and repeated rebuild ownership. Test actual installed-worker update and offline farm reopening with paid cow/lamp/chicken state preserved.
- [ ] Audit spec coverage per species; report only demonstrated completion. Preserve phone limitations and any original unexplained failure. Present actual preview for explicit owner merge approval; after approved merge verify Pages/live bytes and record postmerge status separately.
