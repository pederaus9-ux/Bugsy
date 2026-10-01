# Phase 7F: locomotion rollout

| | |
| --- | --- |
| **Base** | Main `98297442e750b13ff80a8240bcad7c8e6d12bf24` (PR #29, Phase 7E merged and approved by the owner) |
| **Scope** | Sheep, horse, dog and cat move onto the approved distance-driven rig. Cow and chicken keep their 7E gait and gain modest whole-body motion. The farmer gets cheap secondary motion. Villagers get idle life. |
| **Exit gate** | **Stop for owner visual review.** Phase 7G has not been started. |

## 0. Inherited 7E correction

In `pupStep()`, the head's vertical offset assignment sat after a `//` comment on the same line as the X assignment, so it never ran. It is now on its own line.

- The cow's nod into its front footfalls is now active.
- Checked in the browser: while a cow walks, the head patch's vertical offset varies between −0.0021 and −0.0001 in texture space (about 0–4 px of nod on the 505 px art).
- The chicken's head thrust (X) was already working and is unchanged.

## 1. Architecture (unchanged from 7E, extended)

- Every animal card now uses the 7E painted-leg cut-out shader.
  - Leg strips shear about the hip and lift while swinging.
  - Far legs draw behind the body and near legs in front.
  - The gait advances by the **distance the animal actually moved this frame**, divided by stride length.
  - Stationary or blocked animals stop stepping. Starts and stops ease through a speed envelope.
- New in 7F:
  - **`phRun`:** each leg can move to a different phase at a run, so a walk can blend continuously into a trot (horse) or a bound (dog, cat).
  - **Tail patch:** a second soft bend patch, alongside the existing head patch. It only moves where the body is read from, so it adds **no texture reads**.
  - **Body rock:** fore–aft pitch, applied through the card's existing tilt.
  - **Springy squash:** applied through the card's existing scale.
  - **Idle head look:** head nod, thrust and look use the same head patch.
- Fixes found while testing:
  - Samples that fall outside the picture now return nothing. Previously they smeared the edge pixels; this showed on the cow's tail at the image edge.
  - A head or tail bend that would borrow pixels from a leg cut-out keeps its own pixel instead, so there is no hole or line at the hip.
- Ears: deferred to 7M, as the brief allows. They would need extra cut-outs or patches for little visible gain at game distance.

## 2. Per-species values (`RIGS` in `index.html`)

- **L / Lrun:** stride in metres at a walk and at a run.
- **β:** share of the stride each foot is planted.
- **Lift:** foot lift.
- **Bob:** share of the animal's height.
- **Rock:** body pitch in radians, at a walk plus extra at a run.

| Species | L / Lrun (m) | β walk / run | Lift (m) | Bob | Rock walk + run (rad) | Squash | Leg pattern |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cow (7E) | 0.80 / 1.45 | .62 / .45 | .05 | .012 | .012 + .02 | 0 | Diagonal pairs, slightly offset (heavy) |
| Chicken (7E) | 0.26 / 0.42 | .56 / .45 | .035 | .02 | 0 + .03 | .015 | Alternating two legs, head hold-and-thrust |
| Sheep | 0.50 / 0.95 | .58 / .42 | .045 | .03 | .02 + .05 | .03 | Diagonal pairs; light, springy, shorter stride |
| Horse | 1.25 / 2.80 | .60 / .40 | .07 | .008 | .01 + .025 | 0 | Four-beat lateral walk (hind, fore, hind, fore) blending into a diagonal trot; restrained bounce |
| Dog | 0.50 / 1.10 | .55 / .38 | .05 | .022 | .025 + .09 | .012 | Diagonal trot blending into a bound (fore feet together, hind feet together) |
| Cat | 0.30 / 0.70 | .62 / .40 | .022 | .005 | .008 + .04 | 0 | Four-beat lateral walk, low steps, almost no bounce; soft bound at a run |

**Secondary motion:**
- **Head nod (m):** cow .012, chicken .006, sheep .012, horse .02, dog .012, cat .006.
- **Head look while standing:** .008–.03 m, slow and seeded differently per animal.
- **Tail swing:** once per stride while moving.
  - Cow: .035 m, with a slow idle swish.
  - Horse: .05 m, with a slow swish.
  - Dog: an always-on wag at 3.2 Hz.
  - Cat: a slow sway at 0.45 Hz.
- **Chicken:** keeps its approved head hold-and-thrust and gains a small landing squash. It has no tail patch.

## 3. Farmer and villagers

- **Farmer:**
  - Hips sway over the planted foot (0.024 m walking, 0.010 m running).
  - The head tips slightly against the sway and settles on each footfall.
  - The idle pose resets these.
  - Unchanged: speeds, controls, collision, camera and geometry (no new meshes).
  - The hair and hat are part of the head group, so there is no cheap separate bounce; deferred to 7M.
- **Villagers (Rosa, Joe, Mia, Sam, Lily):**
  - New idle life: weight shifting foot to foot, breathing, a slow head tilt and glance, and an occasional happy wiggle.
  - Their existing hop, bubble, request and gift behaviour is unchanged.
  - They still don't walk.

## 4. Performance

All runs used the same container: `?testfarm` at 844×390, DPR 1, with software rendering (SwiftShader). Frame times under software rendering are **not** device performance, so no FPS claim is made.

**Scene structure (deterministic):**

| | Main | 7F |
| --- | --- | --- |
| Scene meshes | 381 | 381 |
| Animal meshes | 30 | 30 |
| Shader programs | 44 | 42 |

- Programs drop because all six species now share the two rig programs.
- **No new meshes, draw calls, geometries or textures.**

**`?perf` overlay:**

| | Main | 7F |
| --- | --- | --- |
| Classic draw calls | 717 | 734 |
| Classic triangles | 1,051,513 | 1,051,547 |
| Geometries | 272 | 272 |
| Textures | 89 | 89 |
| Walk draw calls | 193 | 193 |
| Walk triangles | 1,016,833 | 1,016,833 |

- Classic draw calls vary between runs with what is on screen (emote bubbles, the visitor, animals in view): main measured 717–737 across four runs this session.
- **Animal `update()` CPU** (10 animals, 5×2000 frames):
  - Main: 0.191 / 0.170 / 0.094 / 0.086 / 0.081 ms per frame.
  - 7F: 0.178 / 0.132 / 0.077 / 0.053 / 0.049 ms per frame.
  - No measurable increase. The rig math is constant-time per animal with no per-frame allocation, traversal or material/geometry rebuilds.
- **Software-frame median / p95** (unreliable):
  - Main: 1316 / 1501 ms.
  - 7F: 260 / 4780 ms. The p95 includes first-use shader compiles.
- **Shader cost: the main GPU risk.**
  - Sheep, horse, dog and cat card pixels now read the texture 5 times (4 legs + body) instead of once. The cow is also 5 and the chicken 3, as in 7E.
  - Each read is gated by rectangle checks, and the head/tail patches add arithmetic only.
  - The cards are small on screen, but phone GPU cost is unmeasured. **Compare `?perf` on the phone** with the 7C/7E sessions.

## 5. Tests

`npm test` (container Playwright 1.56.1 + Chromium via `PLAYWRIGHT_MODULE`/`CHROME_PATH`; CI uses the pinned 1.62.1):

- **50/50 regression checkpoints** at 740×360, 844×390 and 1280×720.
- **6/6 perf unit tests.**
- **3/3 shed-switch runs.**
- No page, console or resource errors.
- No tests were modified.

**Visual evidence** in `docs/phase7f/`: isolated contact sheets for each species walking (and the dog and horse running), the cow's tail, the farmer walking and running, and a waiting villager.

## 6. Known limits and risks

- **3/4-view paintings:** the legs swing in the plane of the picture.
  - Seen side-on this reads as stepping. Walking toward the camera, the feet mostly lift.
  - The horse's near hind leg is partly hidden by its tail, so it only bends below the tail's end (a hock-like step).
- **Tall grass** hides most hooves and paws.
- **Unmeasured phone GPU cost** (above).
- **Tail and head patches** bend the painting softly. At large swings a little of the nearby body moves with them; the amplitudes are kept small for that reason.
- **Animal shadow depth programs:** they still lack `USE_MAP` on main and here, as noted in 7E, so shadows may not follow the art's shape. This is not changed here.

## 7. Owner visual review

1. **Open `…/farm3d/?testfarm&loco`.**
   - `loco` is a review helper: every 4 s the next animal sets off through its own pen or yard using its normal moves, alternating walks and runs.
   - Everything else about the animal is unchanged.
2. **Paddock:**
   - Cows: heavy diagonal steps, a gentle nod, a tail swish.
   - Sheep: a light, springy, shorter stride.
   - Horse: long, smooth, four-beat steps; a trot when running; very little bounce; a tail swing.
3. **Hen yard:** quick short steps and the head bob, as approved in 7E.
4. **Dog:** a quick trot and a bounding run, with a wagging tail.
5. **Cat:** low, quiet steps, a slowly swaying tail, and a soft bound when running.
6. **Every animal:**
   - When it stops, its legs should settle.
   - Standing animals look around a little.
   - Pushed against a fence, it should not step.
7. **Look for:** sliding, moonwalking, frozen legs, detached legs or toes, too much bounce, seams, flicker, or species that move identically.
8. **Farmer:** walk and run in the 🚶 over-the-shoulder view. Look for hip sway and a slight head settle.
9. **Villagers:** wait about 20 s for a visitor. They should shift their weight and tilt and glance with the head.
10. **Performance:** add `&perf` and compare FPS and median/p95 with earlier sessions.

**Stop here.** Phase 7G starts only after the owner reviews 7F.
