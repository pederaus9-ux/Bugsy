# Six-species animal visual repair

Base: merged farmer/recovery main `92113b07e41d83806df8025c47eb6ad1f8fa1f4f`.
Branch: `chatgpt/animal-visual-verification`. Owner requested continuation and,
in the designated phone chat, reported that the horse still appeared headless
and asked for visual verification of every animal. Muse is no longer an approval
dependency under the owner's subsequent instruction. Each merge still requires
the owner's explicit decision.

## Reproduced problem and changes

The baseline gallery renders the exact main modules, not a remembered design.
The horse has a head bone and a small dark oval, but no visible neck; the oval
floats above the torso. Sheep, dog, cat and chicken likewise lack connecting
neck geometry, readable faces or attached-looking tails. Bone-existence tests
could not establish that the animals looked complete.

- Horse: continuous shoulder/neck/head, larger readable head, muzzle, eyes,
  ears, pale blaze, mane, attached tail and flat hooves. Overall height retains
  the existing game height setting.
- Dog/cat: connecting neck, eyes, muzzle/nose, species-specific ears, attached
  tails and paws. Geometry remains one shared skinned visual per species;
  skeletons and animation state remain independent per animal.
- Sheep: connected wool neck, face/eyes, ears, short tail and hooves.
- Chicken: neck, eyes, beak, comb/wattle, tail feathers and toes. Added knee
  pivots keep the two legs attached while lifting/planting. The complete model
  is scaled using its actual .52-metre source height, so the new comb does not
  exceed the game's existing height setting.
- The five simpler rigs reuse the existing quadruped motion solver with
  world-space planted-foot anchors, flat soles and reachable hip targets. They
  turn toward actual travel and advance cadence from distance at their rendered
  scale. Head glances, restrained ear motion and tail motion also work at idle.
- The farm forwards its existing `running` flag to rendering. Previously every
  `moving` action selected the run pose, including a normal stroll. Speeds,
  paths, pens, collisions, decisions, production and rewards are unchanged.
- Cow anatomy stays intact. Its leg targets now cancel torso rock as well as
  breathing scale: the new rendered-sole check exposed roughly 2.3 mm of
  ground penetration from the old body roll. Hooves retain flat contact while
  the torso still breathes and rocks.
- Release: cow/live entry imports advance to `?v=2`, including the cow preview;
  matching offline shell uses `sa3d-v34`. Fetch strategy is unchanged.

No save fields, auth, Firebase rules, economy, market, farmer geometry,
`game.js`, `/farm` or unrelated root files change. Grass is not cut or reduced.

## Evidence and meaningful regression protection

`npm test` includes four new units and `animal-visual.browser.cjs`:

1. Raycast the first visible neck surface at its connecting bridge and the
   front head surface for all six species. A hidden/floating head bone alone
   cannot satisfy this check.
2. Inspect actual skinned sole vertices, flat-foot orientation and planted
   world drift at 30/60 Hz, walking and running, at real in-game species heights.
   Contact and planted drift tolerance is 2 mm. Running flight phases are
   allowed; when a foot is planted, a rendered sole must touch the ground.
3. Equal-distance cadence at 30/60/120 Hz, correct facing after rightward
   travel, and release of planted feet after a teleport for the five repaired
   simpler rigs. Existing cow tests continue independently.
   A fourth unit raycasts along every actual shin-to-foot connection, preventing
   foot pieces from floating below truncated leg geometry.
4. Isolated six-species gallery: idle/walk/run, front/side/rear, 54 samples.
5. Actual farm at 844x390 and 1280x720: all six move through the real Beast
   update, the real head hit proxy resolves each species, and the sandbox save
   remains unchanged. Retain normal overview captures, then sample the actual
   rigs on the existing flat dirt path so grass/other animals cannot hide the
   anatomy. This positioning and hiding other actors is test-only.
   Normal UI is retained in the overviews; transient UI is hidden for the anatomy
   samples so visitor/toast overlays do not obscure the joints.
6. Retain 108 individual live pose/angle captures and two captioned contact
   sheets, plus JSON and the original before gallery. Shadows are disabled in
   this software-render fixture. It is not a physical S26 Ultra acceptance test.
7. Measure isolated draw calls/triangles and resources through 30 actor
   replacements with idempotent disposal. No per-frame geometry/material
   allocation or scene traversal is added by animation.

Artifacts: `animal-visual-gallery.png`, `animal-visual-live-sheet-844.png`,
`animal-visual-live-sheet-1280.png`, `animal-visual-farm-{width}.png`,
`animal-visual-live-{width}-{kind}-{mode}-{angle}.png`,
`animal-visual-metrics.json`, `animal-visual-performance.json` and
`animal-visual-live-results.json` and `animal-visual-contact.json`. Fresh CI artifacts remain authoritative for
the tested head; committed images are a review snapshot.

## Findings kept visible

The first focused sheep unit failed because it expected the old 16-bone rig;
the three added ear/tail pivots make 19. Its replacement verifies those parents,
reachable hips, flat hooves and ground clearance instead of a fixed hip height.

The first rendered-sole probe used an unrealistically exact 0.01-mm threshold;
contact tolerance was specified at 2 mm. That still failed the cow's real body
roll error, which was corrected in production. The initial requirement that a
running animal always have a grounded foot also rejected legitimate flight
phases; contact is now required when a foot is planted. Existing tests and
timeouts were not relaxed.

The first live capture positioned rigs on distant undulating terrain and later
in tall paddock grass among other animals; these are not adequate anatomy
evidence. Final captures use the existing flat dirt path and retain normal
farm overviews separately. An oversized chicken comb also exposed the old
source-height scale assumption, corrected in the model.

Full-size visual inspection exposed truncated sheep/cow shins and chicken toe
geometry below the shin tips. Shafts now span their actual joint lengths, with
overlapping knee/foot geometry and a regression raycast through the connection.
Chicken wings now rest folded against its sides rather than extending sideways.

The first full local run failed the new 30,000-triangle six-animal budget at
33,416 animal triangles. Small eye/joint/cap spheres were reduced while torso
and head silhouettes gained dedicated detail. The threshold was not raised;
the failed log remains in task evidence. Final cost is regenerated per run.

The first gallery/performance fixture reused its automatic finish-screenshot
name for the deliberate gallery capture, overwriting the gallery with the
performance view. Farm overviews had the same naming issue. Session screenshot
names now differ from review capture names; final evidence was regenerated.

Hosted run `37154026046` at `dbcd843` completed all 43 units, all existing
browser checkpoints and the isolated six-species gallery, then reached the
existing 20-minute job limit during live-farm captures. The cancelled job log
is retained in task evidence. CI now gives animal visual capture a separate
20-minute job while the existing regression job runs `test:core`; `npm test`
still runs both sequentially locally. All four hosted jobs must pass before
merge. No assertion, viewport, sample or timeout is removed or relaxed; this
is a relevant workflow change, with application files unchanged by the split.

## Validation status

- Current complete unit list: **43/43 PASS**, including all four new tests.
- Full local browser suite: **75 checkpoints PASS**; final anatomy evidence was
  regenerated after the last screenshot-naming fix. Original triangle-budget
  failure remains retained; no threshold or timeout was raised.
- Stage A smoke: **PASS** at both viewports plus saved-hair hard reload.
- Manual inspection by the implementing agent: **all six PASS**
  for connected/readable head and neck, body/leg/tail attachment, proportions,
  no obvious floating parts or clipping, and sampled idle/walk/run from three
  angles. Reviewed isolated gallery and actual-farm contact sheets at 844x390
  and 1280x720; natural side-view self-occlusion is distinguished from missing
  legs. This is visual review, not a second reviewer's independent audit.
- Measured contact across 24 species/rate/mode cases: worst planted drift
  **1.016 mm**; lowest sampled sole **-0.305 mm**; highest planted sole
  **0.136 mm**. All are within the 2-mm tolerance.
- Isolated six-animal render: **6 actor draw calls**, unchanged from baseline;
  with one floor, 7 calls and **26,954 triangles**. Baseline animals alone were
  16,076 triangles; repaired animals alone are 26,952. Geometry/texture counts
  stay **7/7 → 7/7** through 30 replacements. CPU updates for six actors are
  approximately **0.015 ms** in the local fixture; this excludes GPU work.
- Local old-save compatibility: **13/13 PASS**, including the old fixtures,
  unreadable-copy, newer-save and quota guards, and size/time measurements.
- Complete hosted CI must be read at the current PR
  head before merging. No production Firebase publishing is part of this work.

Physical phone FPS/thermals/battery and owner style approval are not established
by these browser captures. Tall grass can naturally hide feet in normal play;
it was preserved, with anatomy inspected on the existing clear path.

[Before](evidence/animal-visual/animal-before-gallery.png) ·
[Repaired gallery](evidence/animal-visual/animal-visual-gallery.png) ·
[Phone-width review](evidence/animal-visual/animal-visual-live-sheet-844.png) ·
[Desktop review](evidence/animal-visual/animal-visual-live-sheet-1280.png) ·
[Contact measurements](evidence/animal-visual/animal-visual-contact.json) ·
[Rendering cost](evidence/animal-visual/animal-visual-performance.json)
