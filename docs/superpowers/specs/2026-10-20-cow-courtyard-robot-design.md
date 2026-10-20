# Cow courtyard, robot milking and physical animal care
Date: 2026-10-20
Status: DESIGN FOR OWNER REVIEW — no product implementation
Source baseline: bf404a2a1261f3c7581025b249f2bd00c4539964 (PR89 merged lights).
Owner-selected visual: concept4, Dairy Courtyard.

## Owner requirements
- Pale-blue/off-white L-shaped courtyard shelter, connected grazing area, fenced pen and visible bulk milk tank.
- All animals physically go to their feed and water areas to eat/drink.
- Sleeping animals use beds or buildings and visibly settle/lie down.
- A milk-full symbol appears over a cow when ready. The player selects that cow, presses Milk, and the cow walks to the robot.
- The robot visibly milks the cow and transfers its milk into the bulk tank.
Generated concept art establishes layout/material direction, not achieved rendering quality or replacement cow anatomy.

## Existing behavior verified
Main retains a shared paddock for cows, sheep and horses; chickens have their own yard. Cow cap5, unlock4, pen300coins, cow120coins, baseline production180seconds, happy production144seconds and XP3. Existing per-cow feeding spends one cow_feed. Ordinary collection currently transfers milk directly to the barn. Shared Beast behavior chooses arbitrary grazing/rest positions and a general night-bed region; named sleeping/eating states alone do not establish correct physical station or bed contact.
PR89 premerge20checks passed and its postmerge regression39449603350 is now SUCCESS. Live lights remain preserved. Historical wardrobe resource decrease is not assigned a cause.

## Delivery sequence
This is a multi-stage animal-care milestone with one authoritative branch.
1. Cow courtyard and real cow bedding/feed/water/robot routes, with robot/tank gameplay and save qualification.
2. Apply the physical feeding/drinking/sleeping contract to chickens, sheep, horses, dog and cat in separately reviewable increments. Their output/reward systems remain as currently shipped unless a subsequent explicit design changes them.
The second stage is part of the requested scope, not discarded backlog. Do not claim all-animal completion after cows alone. Each stage requires actual rendered evidence and owner review before merge.

## Cow yard and routes
Use the selected L-shaped blue/cream shelter, accessible straw-bedded resting bays and attached grazing paddock. Put the long feed bunk under one shelter wing and water trough at an accessible end. Each cow has a usable resting slot; no sleeping cow blocks the drinking point, robot lane or player entrance. A compact robot stall sits on the service side of a shelter wing with identifiable entrance, docking position and exit. A visible pipe leads to the outside bulk tank under its small matching canopy. Tank collection is accessible to the player without entering the cattle lane.
Cows move into their own enclosure; horses/sheep retain safe accommodation in their existing area until their stage. No lost animals, trapped player, overlapping field or decoration, removed paid object, or forced save-position rewrite is acceptable. Audit actual available space before fixing world coordinates; the concept footprint is not a permission to overwrite occupied farm space. Do not expand land or redesign the entire farm as a shortcut.

## Physical station contract
Each feed, drink, bed and robot position has an approach point, occupied slot and facing direction. Reserve before walking and release on completion/interruption. An animal's muzzle must reach the actual feed/water surface while the feet remain grounded. Use chewing/head movement for feeding and a distinct drinking head pose; do not animate drinking beside an unreachable trough.
Animals walk to beds/buildings before settling. Cows fold legs into a supported lying pose on straw and stand before moving; preserve approved body proportions and ordinary gait. Sheep/horses settle into their own appropriate bed poses; chickens settle inside their coop; dog/cat curl up in their beds/shelter. No floating, ground penetration, wall walking, snapping or merely standing beneath a sleep icon. Existing contact/gait assertions retain their tolerances.
Use occupancy queues or alternate free positions. A blocked animal retries safely; a visual teleport must never award production. Weather shelter and sleep requests must not cancel or duplicate a committed milking session.

## Cow care proposal
Shared stocked feed bunk and water trough replace repeated individual feeding as the preferred cow workflow. Proposed initial rule: store up to30 cow_feed units; consume one unit per cow starting a new production cycle. Keep the existing180second baseline and144second happy cycle. Water refill is free with12real hours of supply. A cycle pauses if required supplies run out, preserves earned partial progress and resumes without a new feed charge. Newborn/breeding/death/veterinary mechanics are not part of this milestone.
These supply details are proposed defaults for owner review; the owner has not yet explicitly approved the earlier shared-care recommendation. Do not implement them as already-authorized economics.
Eating/drinking visits must correspond to available shared supplies; idle grazing can remain cosmetic but must not grant unpaid production or replace the actual bunk visit.

## Manual robot workflow
1. A cow that completes its production cycle becomes Ready. Show a clear milk-full symbol above it and Ready to milk in its panel.
2. Selecting it and pressing Milk creates one request for that cow. It joins the robot queue if busy; show Queued for robot. Repeated taps cannot enqueue it twice.
3. Reserve the cow's output and tank capacity before admitting it. If the tank lacks room, leave the cow ready and say Empty the bulk tank first. Never discard milk or silently skip the queue.
4. The cow stands if resting, walks through the entrance, aligns and stops at the dock. Arrival is a physical position/facing check, not just a timer.
5. Robot gates close; a modest arm moves and the milking cluster visibly connects under the udder. Proposed animation duration12seconds. Show a progress indicator and restrained machine sound respecting mute/reduced motion.
6. On completion, credit the reserved batch to the tank exactly once, update its fill/gallon display, detach/retract the cluster, open the exit and let the cow walk back to a free area.
7. The readiness symbol clears on successful completion. A new production cycle follows the approved supply rule. The next queued cow can enter only after the previous cow has cleared the exit.
Manual command is required as the owner requested; do not replace it with unattended automatic dispatch. Existing Collect/Collect All paths must route cow output through the robot rather than bypassing it.

## Tank, rewards and market integration proposal
Initial proposed tank capacity50 existing milk units, displayed as gallons using the current Market Sales mapping; do not invent an additional liter conversion. One cow produces its existing normal1-unit batch, including the existing happy double/gold rules, without multiplying throughput. Determine and persist any random quality/double award once per batch so cancel/reload cannot reroll it.
Tank contents store normal and gold quantities distinctly. Player collects a chosen amount or all available into barn inventory, limited by free barn space, retaining the rest in the tank. Existing dairy recipes and Market Sales continue using barn milk. Direct-from-tank selling is outside this first milestone.
Grant the existing production XP/event progress once at successful robot completion; tank pickup grants neither again. Preserve already-earned milk, XP and event credit during legacy migration. Show tank-full state clearly; don't lose a ready batch when capacity is reserved by another queued cow.

## Persistence, recovery and offline behavior
Authoritative gameplay state must be independent of renderer frames. Persist per-cow production progress, ready batch, queue request, robot job/session ID, stage, reserved output and tank contents. Stable per-cow identity must survive rebuilding the animal display. Position/animation alone cannot create milk.
Migrate existing unfed, paid-running and ready cows exactly once. Preserve existing paid feed, timestamps, ready output, names, love and ownership; current barn milk/gold and milk in recipes remain unchanged. Retain fixtures for v1 ordinary farms and v2 lamp farms. Use an explicit new minimum-writer version only for farms that contain incompatible cow-care state so old cached clients cannot erase it. Do not hard-code a version until checking the final main baseline.
Offline time can advance production only while supplies suffice, up to readiness; it never auto-orders a new robot visit. An already-started, physically docked robot job may finish while away, crediting the tank once by its saved job ID/timestamp. Queued or approaching cows resume their physical approach on reopening; they do not silently milk offline.
Reload at every stage must preserve the batch/reservation. Close/reopen during credit, queueing, tank pickup, cloud recovery or service-worker update must never duplicate output, spend feed twice or strand a cow. Follow existing same-account stale-upload refusal; no new cloud service, security-rule relaxation, production-account test or invented conflict resolution is allowed.

## Technical boundaries and mobile cost
Separate pure cow-care/job accounting from procedural courtyard/robot geometry and animal-station movement/pose adapters. Integrate with existing game menus, save guards, path routing and renderer ownership. Share station reservation logic where useful, but avoid a wholesale Beast rewrite.
Static structures should be merged/instanced by material; robot moves only its necessary parts. Reuse water/feed materials; no physics engine, extra shadow-light arrays or per-cow render loop. Allocate transient scratch objects once where practical.
Protect accepted walking/contact behavior, other species' rewards, player controls/collision semantics, purchased decorations/lights, current recipes/prices, authentication and cloud contracts. New bed poses and directed station tasks are the specifically requested additions. Record changed production behavior explicitly.
Browser viewport tests do not establish physical Android/iPhone heat, battery or sustained performance. Compare the same representative scene before/after and disclose software rendering. Owner visual/device acceptance remains separate.

## Required evidence
- Pure tests: unchanged timing/rates; feed accounting, water/pause boundaries, ready state, duplicate taps, one-robot queue ordering, station reservation/release, full tank including double batch, quality retention, partial collection, barn full, interrupted jobs and exactly-once credit.
- Migration fixtures: no pen, one/five cows, old running/ready/happy outputs, ordinaryv1 and lampv2 saves, existing milk/gold, partially stocked/queued/docked/credited states. Old-client write refusal and current recovery.
- Actual input: tap a ready cow, press Milk, observe its uninterrupted trip, docking, arm/cluster, tank gain and exit. Verify busy/blocked/full states and repeated input.
- Genuine rendered closeups and continuous sequences: sleeping on straw with folded legs; standing from bed; muzzle contact at feed/water; robot attachment; tank and pipe. Include daytime/night, overview/walk and390/844/1280 viewports.
- Save/reload at each meaningful job stage; offline readiness and active-session return; authenticated emulator recovery/conflict tests and actual installed-worker upgrade with cached offline reopening.
- Rerun required exact-head regression/art/qualification checks without skips, timeout extensions or weakened thresholds. Inspect the actual final rendering before presenting it.
- Stage2 evidence for every remaining species; do not substitute successful cow footage.
- No merge without explicit owner approval.

## Review choices
Owner already chose concept4 and the manual Milk-to-robot interaction. The remaining proposed gameplay defaults for approval are shared cow supplies,30feed storage,12hour water,12second robot service and50gallon tank, with existing rates/cap/prices retained. Changes to herd size, milk value, land, other species' economics or automatic robot dispatch require a separate choice.
