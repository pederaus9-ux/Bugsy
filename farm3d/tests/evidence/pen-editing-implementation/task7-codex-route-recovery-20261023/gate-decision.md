# Directed exterior passage: precise behavior decision pending

Assessment at 0f0d056 base plus the independently tested Beast.go idle-recovery correction. No passage implementation attempted. This is a product/authority boundary, not an automatic-approval denial, geometry failure newly reproduced here, or permission to change a locked digest.

## Existing authority and current consumers

The approved spec, `docs/superpowers/specs/2026-10-21-player-editable-pens-design.md`, says at line52: "Gate animation/open-close gameplay is not added." At line108: "Ordinary animal roaming remains contained" and calls for directed animal entry/exit qualification. The approved plan, `docs/superpowers/plans/2026-10-22-player-editable-pens.md`, Task4, authorizes: "Explicit gate links permit only a directed passage corridor during passage; ordinary roaming still uses inset containment."

These authorize a corridor-scoped traversal capability and its physical tests. They do not identify a caller that initiates an exterior trip or a terminal outside behavior. The actual production consumers confirm the gap:

- `index.html::Beast.go` is ordinary movement. Curiosity, social behavior, snacks, following, fleeing and wandering all use its fitted in-pen destination. Allowing any of these existing calls to leave would change the expressly contained ordinary behavior.
- `remaining-care-controller.js::request` and `chicken-stations.js::request` select existing feed/drink/bed stations. Their destinations are inside; coop doors are building lanes, not yard exits. Using a care task to manufacture an outing would change station/queue behavior.
- `index.html::chooseCowTask/updateCowTask` binds feed/drink/bed or the authoritative robot job. An exterior passage is none of those tasks and must not send robot reports or reuse its gate helper.
- `animal-pen-runtime.js::prepareAnimalPenRevision` prepares/publishes layouts and current care rebindings. It has no directed movement request or outside task ownership. The editor's Apply staging cannot substitute for walking through a gate.
- No existing yard-gate passage caller/state was found in these production adapters. Existing player gap proofs and validator bridges do not supply that state.

Consequently, adding an automatic walk outside and back, a new player command, or an indefinite outside wait would choose behavior absent from the written contract. A test-only path that teleports/repositions the actor back afterward would fail the required actual execution/handoff proof. Merely making a planner accept an outside endpoint would leave containment, support and care ownership inconsistent.

## Exact decision requested from parent/owner

Specify the intended initiator and terminal behavior of a **directed exterior animal passage**. The smallest proposed addition is an internal explicitly requested, bounded out-and-back operation for integration/diagnostic callers, with **no new player control and no autonomous ordinary exits**. It would physically traverse out, retain passage ownership at the outside approach, then return through the same gate before resuming ordinary/care decisions. This proposed excursion behavior is not implemented or claimed approved here.

If instead exits must finish outside awaiting a later command, explicitly approve that caller-controlled outside state and the policy for pending care, cancellation and a layout change while outside. Returning by projection or releasing an animal into ordinary outside roaming is excluded in either case. The two policies have different queue, animal-care and save/rebind consequences; choosing one silently would not be a routine geometry implementation detail.

For negative tests, "closed gate" must mean an absent/invalid directed link, a removed gap or a solid fence segment. It must not introduce the open/close gameplay excluded by the spec.

## Proposed technical scope after that decision

First implement a shared ephemeral passage adapter, integrated before care/ordinary movement in index, with explicit actor/species, stable gate ID, current farm/revision and direction. Reject requests from an actor with active station/coop lane/robot ownership rather than releasing those reservations. Queue by gate with physical neighbour/player clearance and preserve unchanged body, speed, turn/contact and support limits. Grant only the specified gate corridor during a live request; all ordinary predicates remain restrictive. No synthetic care/robot task or global polygon exception.

Coordinate preparation/publication with the chosen passage lifecycle. A discarded preparation must leave the old passage/queue untouched; stale farm/revision grants must never authorize a new gap. If the chosen design requires a change to exact locked chicken-stations.js, stop for an explicit successor-scope amendment before editing or registering a hash. No A3/rig, land/path, paid-ledger/auth or clearance change is proposed.

Acceptance remains the delegated full set: actual owned animals traversing both directions at30/60/120Hz, solid/ungranted/wrong-gate/stale controls, same-species and mixed opposing traffic without overlap, blocked-route recovery, full support/turn/contact (including cow slab edges), retained care/bed/coop-lane tokens, and real Apply/save/rebind/discard/publication recovery. Existing seeds1/4242 and500s/40s care limits remain. The prior eight route REDs stay archived; this idle-recovery fix does not resolve them.

Status: **PENDING product decision; gate implementation not attempted, not denied, no uncertain mutation.** Independent empty-route recovery is complete and tested. No new protected-scope approval is needed for that completed one-condition fix.
