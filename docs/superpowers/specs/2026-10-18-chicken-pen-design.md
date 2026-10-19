# Sunny Acres: chicken pen and care — design draft

Status: written design for owner review. No product code, implementation plan, game launch, merge or deployment is included.

Verified source: main `756df378e7adbe20f34c204dc54172b1030e16bd`, tree `6580beff7b9018ec33c6d4cda0fff9139b4339d4`. Three.js and Firebase remain the existing engine and services. This draft distinguishes confirmed directions from proposed engineering defaults; approving the draft would approve those defaults too.

## Outcome and confirmed owner directions

Build one animal pen at a time, beginning with chickens. Each animal's pen can have a different size and design. Review genuine game captures and merge each pen independently; no other pen is rebuilt with the chicken update.

- A proper chicken coop and a run enclosed with chicken netting.
- Players customize the coop inside the game. First-version chicken capacity stays fixed: retain the existing maximum of six.
- Separate physical feed bin and waterer, filled by interacting with those objects instead of feeding chickens individually.
- A full feed supply and a full water supply each last 12 real hours, including time away. Filling an empty feed bin costs one existing chicken-feed item per current chicken; water is free. This uses feed already produced at the Feed Mill.
- The new base production interval is one egg per chicken per 30 minutes. Six chickens therefore produce 144 ordinary eggs in 12 hours before happiness bonuses.
- Eggs accumulate automatically on a pallet outside the pen while feed and water remain. A 240-egg pallet was recommended and accepted with the feeding proposal. Production pauses when storage is full or either supply is empty.
- One pallet interaction collects everything the barn can hold. Remaining eggs stay on the pallet.

## Proposed first-version visual and customization defaults

Keep the chicken run in its existing west-of-barn area initially; do not enlarge the whole farm or move the shared livestock paddock. Give this run its own chicken-wire/netting fence, posts and visible gate opening. Keep a safe walking route to the gate, feed bin, waterer, pallet and coop controls. Chicken pathing must match the actual enclosure and keep birds inside.

Use a raised wooden coop with roof, door, nesting-house detail and ramp. Place feed and water inside the run; put the egg pallet outside near the access route. Netting needs readable wire detail at phone distance without a high draw-call or transparent-overdraw cost. Preserve the accepted chicken model and animation.

Customization opens from a coop interaction. First version offers free wall, roof and trim colors plus two compatible roof appearances (shingles and corrugated metal). Options share a fixed footprint and capacity. They do not move or enlarge the coop, improve production or cost real money. Default appearance: natural wood walls, muted red metal roof and cream trim. These are proposed defaults, not previously selected colors. Preview choices before Apply; Cancel spends nothing and changes no saved appearance. Save applied choices across reopen and offline use.

Show feed/water fill levels and remaining time, egg count out of 240, and an understandable paused reason. Keep controls usable with a finger, keyboard and mouse, and readable in first person, third person and the overhead view. Chicken interaction retains petting/renaming; the care stations and pallet own feeding, water and egg collection.

## Proposed care, storage and migration rules

- Settle elapsed production using the old supply deadlines before refilling, collecting, buying a chicken or saving. Supplies stop at the earlier deadline. An egg completed exactly at that deadline is credited; none is produced after it.
- Permit early top-ups. Show their cost before confirming: feed cost is the ceiling of current flock size multiplied by the missing fraction of the 12-hour supply. Do not charge when already full; never extend beyond 12 hours from the refill. Water top-ups are free. An unsuccessful refill changes neither inventory nor timers.
- A newly bought chicken joins with a fresh production interval and the pen's existing remaining supplies. Buying does not reset supplies or grant retroactive eggs. Existing chicken ownership and purchase prices stay unchanged.
- Preserve earned partial progress when production pauses. Time spent paused does not create a backlog. Collection resumes production from its paused progress, rather than awarding eggs for hours when the pallet was full.
- Preserve existing happiness benefits: happy chickens can have the current faster cycle and double/gold egg chances. Evaluate happiness at the cycle's start, using its historical time during offline catch-up. Award bonus eggs only when pallet space permits; persist outcomes so reloading cannot reroll the same completed cycle.
- Store normal and gold egg counts separately. Collection follows the existing gold-first convention, respects total barn space, and awards inventory, XP and collection/event progress once for eggs actually collected. Producing into the pallet does not also credit the barn. A full barn leaves all pallet stock intact.
- Old saves retain every animal, name, happiness value and unrelated farm field. Ready legacy chicken outputs transfer once to the pallet. Already-paid in-flight legacy outputs keep their existing completion deadline and are credited once even if the new water supply has not been filled. Afterwards only the new care path produces chicken eggs. Clear/mark migrated legacy outputs to prevent both old and new collection paths paying out.
- New care timers start empty until the player fills them; migration does not consume feed automatically. Adding optional chicken-specific fields must not reset the farm or change its top-level save version without a demonstrated need.
- Evaluate elapsed time deterministically; repeated refreshes, taps, background/resume and save/load must not duplicate goods or spending. A backwards device-clock change never awards negative time or extra production. Do not claim tamper-proof real time while offline.

## Recommended architecture and alternatives

Recommended: a small chicken-care module containing state transitions and elapsed-time accounting, called by existing game mutations and save restoration. A dedicated chicken-yard renderer creates the coop, netting, stations and pallet, with existing page controls handling interactions. Both receive the existing state and clock; neither introduces another authoritative inventory or a background server process.

Extending the existing large inline page is possible but mixes offline accounting with visuals and makes regression isolation harder. A new server-first simulation would expand cloud and security scope and is unnecessary for this first pen. Keep cloud authentication, canonical trading and production permissions unchanged; compatibility with the existing farm snapshot transport must be demonstrated rather than assumed. Any required protected-system expansion is reported before implementation.

The optional chicken care/appearance data belongs under the existing chicken-pen save object. Preserve unknown fields and use a versioned chicken-care envelope for one-time migration. Centralize chicken feeding and collection routing so generic Feed All, old animal cards and tutorial actions cannot create parallel production or rewards. Update relevant tutorial/status text to point at the new stations. Other species continue using their existing paths.

## Evidence required before owner review and merge

Meaningful fail-first checks cover exact 30-minute/12-hour boundaries, differing supply deadlines, top-up spending, insufficient feed, empty/full barn, 240-egg cap, pause/resume, newly added chickens, deterministic bonuses, backwards clock and one-time legacy-output migration. Verify repeated pickup, duplicate input and reload never duplicate inventory, XP or coins. Test saves with no chicken pen, one chicken, six chickens and old pending outputs.

Native browser checks must include actual touch taps/drags, keyboard/mouse, a persistent normal guest farm, and an old service-worker/cache installation updating to the new build. Fresh phone-sized mouse sessions with service workers disabled are insufficient. Isolate external accounts/services in automated fixtures; do not write production user data. Preserve failed receipts and take genuine in-game close-up and whole-pen captures plus an interaction sequence. Disclose software rendering, device scale and physical-phone limits.

Check confinement, player access, coop appearance persistence and pickup reach; compare rendering resources/frame observations with the same scene before changes. Run relevant existing regressions without loosening assertions or deadlines. Existing legacy character-test failure, prior black-surface report, broader CPU/GPU/capture gaps and full release/device gates stay recorded separately. A new chicken result does not clear them.

## Separate subsequent work

**Next after chickens — holiday decorations:** the owner reports flat decorations, shapes appearing cut in half, and pumpkins rotating to follow the viewing direction. Owner screenshots `17281.jpg` and `17280.jpg` are visual references; static images do not establish the rotation or its cause. Inspect the actual rendering, clipping, orientation and placement before choosing a correction. Recommended direction: solid 3D pumpkins with fixed world orientation, complete silhouettes, suitable depth for other decorations, and warm lantern light or restrained animation where appropriate. These visual treatments are recommendations, not already approved final designs. Keep mobile performance and existing decoration ownership/placement intact. Capture genuine before/after views and a continuous camera orbit; review and merge this separately. No holiday runtime changes belong in the chicken update.

**Market Sales:** an independently reviewed/merged update for instant egg sales by the dozen and milk sales by the gallon, with visible fluctuating quotes, quantity/Sell All controls and six-real-hour price windows. Same-window reopening must not reroll the quote. This timing and feature direction are confirmed; exact price bounds, base quotes, milk-unit mapping and sales-source integration are future market-design decisions. Existing barn selling remains available during the chicken-only phase.

**Cow pen:** include a bulk milk tank when the cow pen is designed. The owner explicitly deferred it to that phase. Do not add the tank, change cow output/storage, choose its size or redesign the cow pen in this chicken update.

Other species' pens, expanded land, movable plots, new cosmetic monetization, the shelved normal optimization and recorder investigation are outside this scope.

## Review boundary

This file records agreed behavior and concrete proposed defaults. It is not an implemented or tested feature. Next is the owner's review of this written design; an implementation plan follows the reviewed design. Actual product/visual acceptance and explicit merge authority remain separate.
