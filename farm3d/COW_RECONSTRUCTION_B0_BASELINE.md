# Sunny Acres Cow Reconstruction — B0 Frozen Baseline

Status: B0 COMPLETE / READ-ONLY BASELINE

Baseline source commit: `75baac10fc3e4294062b67d44dee7c9e1325f94c`
Baseline source tree: `0407503ea5f56705e00035ec0f35b262982dd855`
Baseline follows merged PR #52. PR #52 did not modify `farm3d/cow3d.js` or the committed animal-visual evidence set.

This file freezes the comparison point for B1–B18. Later cow work must compare against this baseline instead of a remembered design.

## 1. Current production cow implementation

Primary renderer: `farm3d/cow3d.js`
Blob SHA: `866bb94666a58fd2f5402b440789255ce8264dee`

Public rendering contract:

- `createCow3D(height=1.7, x=0, z=0, seed=0)`
- `updateCow3D(rig, dx, dz, dt, time, act='idle', hop=0)`
- `poseCowLeg(leg, tx, tz, lift, rig)`

Frozen gait constants:

- walk speed: `0.8`
- run speed: `2.6`
- stride: `1.04`
- run stride: `1.35`
- stance fraction: `0.60`
- run stance fraction: `0.45`
- upper leg: `0.36`
- lower leg: `0.37`
- hip height: `0.77`
- hoof term: `0.055`

Current visual is a procedural `THREE.SkinnedMesh` using one merged `BufferGeometry`, vertex colors and one `MeshStandardMaterial` (`vertexColors:true`, `roughness:.86`). The procedural Holstein coat is generated in object space; the production 3D cow does not use a cow texture atlas.

The skeleton contains root/body/neck/head/jaw, two ears, two eyes, four articulated hip-knee-hoof chains and a three-bone tail. Current procedural vertices are rigidly assigned to individual bones (`skinWeight` 1/0/0/0); B7 is specifically allowed to introduce selective smooth multi-bone weights at anatomical transition zones.

## 2. Current production rendering path

The regular game imports `cow3d.js` and uses it for cows. `live3d.js` owns the other live animal species and deliberately returns no cow maker. Beast creation therefore resolves cow rendering through `Cow3D.createCow3D(...)` on the normal path.

The existing `?characters2d` comparison/fallback path is protected.

During Beast updates the renderer receives real actor displacement and state:

`Cow3D.updateCow3D(rig3d, currentX-oldX, currentZ-oldZ, dt, time, act, hop)`

The rendering layer does not own the farm AI/save state.

## 3. Protected interfaces and systems

Unless a separately approved migration is created, B1–B18 must preserve:

1. `createCow3D(height,x,z,seed)` caller compatibility.
2. `updateCow3D(rig,dx,dz,dt,time,act,hop)` caller compatibility.
3. Stable actor root `g` for scene attachment, status bubbles and interaction/contact ownership.
4. Idempotent `dispose()` behavior.
5. Existing Beast ownership of name, personality, needs, AI decisions and save reference.
6. Existing species values for cow gameplay: height `1.7`, walk `0.8`, run `2.6`, graze behavior, step `3`, radius `0.9` unless an explicitly separated gameplay change is approved.
7. Pens, navigation, movement targets, collisions, production, rewards, economy and save schema.
8. Petting/social/flee interactions and existing status/emote plumbing.
9. `?characters2d` fallback/comparison capability.
10. Auth, Firebase, rules, analytics, `/farm`, unrelated root app files and verified economy state.

B13–B15 may add renderer-side micro-behavior scheduling, but Beast remains authoritative for why/where an animal walks, eats, rests, socializes, flees or interacts.

## 4. Frozen static/rendering evidence

Authoritative committed evidence directory:

`farm3d/evidence/animal-visual/`

Frozen artifacts include:

- `animal-before-gallery.png` — SHA `c71bb7f40ad4b1d7c28904dd5f64f70a3ccff0cc`
- `animal-before-metrics.json` — SHA `560e4e5cdbd26a6c3d709de0fe4669806e1df103`
- `animal-visual-contact.json` — SHA `722598cdbe4dc36ca0b0b34652a0d115d8b61ae0`
- `animal-visual-farm-844.png` — SHA `fd2fc9b0f12b37270a2e86061eb43dc5f50b02a3`
- `animal-visual-farm-1280.png` — SHA `4cf2db01566190a314eb579b857e81f6e57d3ec3`
- `animal-visual-gallery.png` — SHA `6b51adee755e3350d6bae941dc52d1c3836fcc7c`
- `animal-visual-live-sheet-844.png` — SHA `ef6ac055bf8eaf68121b25e9b1e201d78d716f76`
- `animal-visual-live-sheet-1280.png` — SHA `f82cd913bd5f0a57aa734f51692f5ff9480d2324`
- `animal-visual-live-results.json` — SHA `92484076f64366b89c2efea2b611376cb7d9991b`
- `animal-visual-performance.json` — SHA `4d73e331ee5e76a5fc4e6a9a76770a12292bc7f9`

B18 must use controlled matched captures against this baseline rather than replacing these files.

## 5. Frozen geometry and performance baseline

Current cow evidence reports 10,594 triangles for the cow test view including its two-triangle floor, i.e. approximately 10,592 cow triangles.

Current six-animal isolated fixture:

- 6 animal actor draw calls
- 7 calls including the floor
- 26,952 animal triangles
- 26,954 triangles including the floor
- geometries: `7 -> 7` through replacement testing
- textures: `7 -> 7` through replacement testing
- measured CPU update for six actors: `0.015300000011920929 ms`
- fixture: 640x360 SwiftShader, shadows off; CPU number excludes GPU cost and is not device FPS

The bounds in the older committed visual metrics are conservative **culling
bounds**, not the actual skinned anatomical envelope:

- X: `-0.7556` to `+0.7556`
- Y: `-0.1417` to `+1.9833`
- Z: `-1.4167` to `+1.1806`

Those padded values must not be presented as body width, physical dimensions or
hoof penetration. A repeated PC B0 scan of all 31,776 actual skinned vertices at
height1.7, origin and initial idle pose (Bessie) records the true envelope:

| Axis | Minimum | Maximum | Extent |
| --- | ---: | ---: | ---: |
| X | -.41795846 | .41795846 | .83591692 |
| Y | .00017913 | 1.62794591 | 1.62776679 |
| Z | -1.09560484 | .73146194 | 1.82706678 |

These are game coordinates. Physical meter calibration has not been established.
The immutable PC freeze is `outputs/cow-reconstruction-B0.zip`, 15,553,799 bytes,
in the parent workspace; its manifest preserves source and measurement hashes.
It includes the exact-head hosted 18 cow views plus two farm overviews and the
expanded local diagnostics below. The existing committed CPU result above and
newer hosted results are separate runs, not an improvement comparison.
The reconstruction may change internal shape while preserving the existing
height/radius and neutral skin envelope. Unexpected expansion is a regression.

## 6. Frozen hoof/contact baseline

Committed cow contact measurements (artifact labels use `m`, but these are game
coordinates; do not infer a verified physical meter conversion):

- 30 Hz walk: worst slip `0.000646934 m`; min sole `-0.000300241 m`; max planted sole `0.000016366 m`
- 30 Hz run: worst slip `0.001015441 m`; min sole `-0.000287190 m`; max planted sole `0.000078624 m`
- 60 Hz walk: worst slip `0.000361098 m`; min sole `-0.000288491 m`; max planted sole `0.000135295 m`
- 60 Hz run: worst slip `0.000664262 m`; min sole `-0.000304367 m`; max planted sole `0.000077103 m`

The existing numerical contact tolerance remains .002 game coordinates. The
historical two-millimetre wording is not a physical calibration. The committed
rows use normalized speeds1.105/2.38; new PC diagnostics below use actual gameplay
speeds .8/2.6 and must not be compared as if the scenarios were identical.

PC B0 deterministically repeated eighteen six-second straight/turn/stop/teleport
cases at 30/60/120 Hz, scanning individual actual skinned hoof soles. The same
planted world anchor is compared across consecutive frames, excluding acquisition,
replant and teleport frames. Known pre-existing gaps are preserved:

| Case | 30 Hz drift | 60 Hz drift | 120 Hz drift | .002 tolerance |
| --- | ---: | ---: | ---: | --- |
| Straight walk | .00053989 | .00030702 | .00016837 | Within |
| Straight run | .00120508 | .00076033 | .00044555 | Within |
| Wide turn | .00159874 | .00163883 | .00167321 | Within |
| Tight turn | .00110319 | .00150301 | .00187522 | Within, small 120 Hz margin |
| Stop, still marked planted | .00837286 | .00446701 | .00237948 | **Outside at all three rates** |
| Stable frames after teleport | .00541784 | .00181766 | .00053465 | **Outside at 30 Hz** |

Sole minima remain above -.000311 and individual planted sole maxima below.000306.
The horizontal stop/recovery slide is still a defect: planted offsets are
multiplied by easing movement amount and move toward neutral while still planted.
Equal six-second running distance varies only5.68e-14 across rates, but startup
phase spread is .0067887102 cycles; the old cadence unit covers walking only.
B9/B12 must address running cadence and B10/B12 the stop/recovery contact. No fix,
timeout increase or threshold reduction is part of B0. This is not whole Beast,
terrain, GPU, S26 or physical-device acceptance.

## 7. Frozen behavior baseline

Current Beast state owns:

- personality
- hunger
- tiredness
- loneliness
- action selection
- navigation/targets
- running flag
- interaction/save reference

Current decision families include wander, graze/eat, drink, rest, social, play, curiosity and idle. Weather/night logic can route animals toward shelter or beds. Petting can trigger happy, shy/flee or grumpy outcomes based on personality.

Current cow renderer already adds distance-driven stride phase, planted hoof anchors, turn-to-travel yaw, breathing, body roll, head glances, ear flicks, blinking, tail motion, eating head-down/jaw motion, reduced movement while resting/sleeping, pet response and hop motion.

B13–B16 must expand visual variety without duplicating or overriding Beast's gameplay decisions.

## 8. Holstein reconstruction target locked for B1

The reconstruction target is a healthy mature female Holstein dairy cow expressed in Sunny Acres' stylized 3D language rather than photorealism.

B1 must specify and validate, before geometry replacement:

- long/deep dairy barrel and rib cage
- readable shoulder/brisket transition
- narrower dairy neck with continuous neck/withers connection
- elongated bovine skull and broad muzzle
- laterally placed eyes and readable ears
- defined loin/pelvis rather than a spherical rear body
- anatomically readable fore/hind limb segmentation
- correct knee/hock/cannon/fetlock relationships at the stylization level
- cloven hoof shape and orientation
- integrated four-quarter udder with four teats
- sacral tail root and tail switch
- Holstein coat identity retained

The target is better anatomy and motion, not realism that breaks the game's cozy visual identity or phone performance.

## 9. B0 gate result

COMPLETE AS A BASELINE FREEZE, WITH KNOWN EXISTING FAILURES.

The baseline source commit, cow implementation, rendering path, protected gameplay interfaces, visual evidence, geometry cost, CPU fixture and hoof/contact measurements are now explicitly frozen.

No cow production geometry, gait, AI, behavior, save, collision, economy or gameplay code is changed by B0.

The B1 specification and controlled **proposed reference targets** accompany this
planning PR in [art/COW_RECONSTRUCTION.md](art/COW_RECONSTRUCTION.md) and
evidence/cow-b1. They do not replace the production cow. B2 production geometry
promotion remains held for owner review of this baseline/proportion plan.
