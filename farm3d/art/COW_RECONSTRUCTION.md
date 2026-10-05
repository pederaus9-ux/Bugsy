# Cow reconstruction B0–B18

The owner approved the staged program in direct phone replies on 2026-10-04.
This branch starts from PR52 merge `75baac10fc3e4294062b67d44dee7c9e1325f94c`.
PR52's tested and merged trees match; Pages and twenty live files were verified.
Its post-deployment S26 acceptance is pending. Cow implementation belongs to this
PC checkout; there is one cow branch and no parallel implementation.

## B0 frozen control

Production cow blob `866bb94666a58fd2f5402b440789255ce8264dee` is unchanged by
PR52. The immutable local package is `outputs/cow-reconstruction-B0.zip` in the
parent workspace. It retains source, eighteen matched cow views plus overviews,
resource/CPU results, actual skinned bounds and repeated contact diagnostics.
Cow cost: 10,592 triangles, one visual draw, 24 bones, shared geometry/material.
The current rendering contract is synchronous creation and one pickable
SkinnedMesh, independent state/skeleton, shared immutable skin, idempotent disposal.

Baseline failures remain targets rather than hidden passes: still-planted stop
drift exceeds .002 at 30/60/120 Hz; post-teleport recovery exceeds .002 at 30 Hz;
run startup cadence varies across rates despite equal travel. Walking cadence and
steady walk/run contact pass. B9–B12 will address those gaps after B8 anatomy.
No motion logic is tuned during B1–B8. No physical meter conversion is established.

## B1 written proportion specification

Target: an adult female black-and-cream Holstein in Sunny Acres' stylized art
language. Anatomical direction uses the PDCA dairy-cow scorecard: a level back,
defined shoulder/rump, spring of rib, longer bone pattern, refined head with broad
muzzle, readable hock/cannon regions and attached fore/rear udder. These are
qualitative cues, not measurements of a particular reference cow.
[Primary anatomical reference](https://www.holsteinusa.com/pdf/PDCA_Scorecard.pdf).
The owner's farm-style image contains no cow; no unseen cow image is asserted as
an exact match. Final appearance still requires owner review.

The following numerical ranges are **our game-model design**, inferred to fit
the frozen character envelope. They are not dimensions stated by the scorecard.
Source coordinates are Y-up, front along negative Z, ground at Y=0. The existing
`height / 1.8` scale remains; ordinary gameplay height is 1.7. Preserve radius .9,
walk .8, run 2.6, existing navigation/pens/decisions and all economy/save behavior.

| Region | Source-space target | Purpose |
| --- | --- | --- |
| Whole neutral skin | X within ±.443; Y within [-.002,1.724]; Z within [-1.161,.775] | Stay within measured old skin envelope, independently of padded culling bounds. |
| Torso | Z -.63…+.72; maximum half-width .34; back about Y1.45; underside .76… .92 | Level dorsal line and distinct chest/rib/loin/pelvis, avoiding the old spherical barrel. |
| Shoulder/brisket | Z -.53…-.30; chest width .43… .54; shoulder blends into torso | Front strength without disconnected spherical shoulder covers. |
| Pelvis/rump | Z +.35…+.70; dorsal height about1.44; width .50… .62 | Legible rump, restrained hip landmarks and clean tail attachment. |
| Neck | Tapered bridge Z -.45…-.82; Y about1.14…1.33; width .30… .44 | Visible connected neck between shoulder and skull; preserve the neck picking ray. |
| Skull/muzzle | Z -.65…-1.15; skull widest about.35, muzzle about.32; poll near1.60 | Longer refined face, smaller eye relief and broad rather than spherical muzzle. |
| Ear/horn | Alert leaf silhouette; ears remain within whole-width limit; horns below1.724 | Preserve individual ear/head controls and the recognizable existing horned cow identity. |
| Limb | Existing hip/knee/hoof controls at .77/.41/.04 bind height; upper .36, lower .37 | Shape haunch/shoulder, knee/hock, narrow cannon and fetlock around the preserved solver. |
| Hoof | Two beveled claws, about.13 wide/.17 long; flat sole local Y=-.055 | Readable cloven outline and actual ground surface; rigid foot weights. |
| Udder | Between rear legs around Z .18… .46; underside aboutY .57; four distinct teats | Firm fore/rear attachment and balanced quarters; does not alter milk production. |
| Tail | Root embedded at rear; tapered three-bone shaft and switch toward hock height | Distinct attachment and silhouette without a detached round tuft. |

The old collision radius is a gameplay proxy, not an assertion that every nose
vertex lies inside a .9 sphere. The candidate must not expand the neutral skin
extents above, or require changing that proxy. Active-pose culling remains separately
tested. Pose tests must scan actual skinned vertices, not use the conservative box
as anatomy evidence.

## Implementation and stage gates

B2–B6 use shaped closed section meshes for body, neck/skull, limbs, cloven hooves,
udder/tail/ears. Spend topology on silhouettes and attachments; one shared skin,
one material and no new textures/loaders or asynchronous creation contract.
B7 blends only neck/head, shoulder/hip, knee/fetlock and tail-root transition
regions. Hoof soles remain rigid so skinning cannot undermine planting.
The existing 24-bone hierarchy/control names are preserved.

B8 requires front/side/rear/three-quarter rendered inspection, bilateral geometry,
no floating bridges, skinned bounds, connected shin/hoof rays, head/neck/body
picking, normalized finite weights, independent instances and stable disposal.
The old tests and budgets remain intact. Neutral geometry alone is insufficient:
also inspect the existing grazing/head-turn pose for attachment clipping. No B9
gait tuning until B8 passes. B8 is an engineering/static visual gate; final owner
and device acceptance remains B18.

B9–B12 gait/contact/turn/transitions → B13–B15 renderer micro-behavior layered
over Beast → B16 deterministic long behavior → B17 full regression/performance
→ B18 controlled before/after and owner/device acceptance. Each focused merge
requires specific direct human approval. The full program is not finished while
any required implementation, check, approval, deployment or device gate is open.

Gameplay/root APIs, actual-mesh picking, slot/name/personality, movement speeds,
collision, feeding/collecting/rewards/cooldowns, old saves, auth/cloud/economy,
other species, `/farm` and unrelated root remain protected. Spark verifiedEconomy
stays OFF. No live rules publishing, spending, real money or Muse participation.
