# Phase 7E: locomotion prototype (cow, chicken, farmer)

- **Base:** merged main `9e5aa829e64e0e595f001be4c354368512c01a9f` (PR #28).
- **Scope:** prototype only, for **cow, chicken and farmer**. This phase **stops for human visual approval**; Phase 7F (the other animals and the villagers) has not been started.
- **Untouched:** economy, saves, cloud, Firebase, social, quests, crop/production/weather rules, input mapping, mobile UI, dynamic quality, grass, the service-worker architecture, `/farm` and the root app.

## 1. Audit of current main

| Actor | What it really is | Legs / head / tail | Movement and speed owner | Facing and update |
| --- | --- | --- | --- | --- |
| Cow, chicken, sheep, horse, dog, cat | `makeAnimal()`: a **camera-facing textured card** (`PlaneGeometry`, `art/<kind>.webp`, alpha-tested), plus an invisible sun-facing `shadowCard` for the shadow. Each animal has its own material. | **No separate parts**: legs, head and tail are painted into one picture. There is no skeleton. | `Beast.update()` owns the AI, steering, the `vel` vector and pen clamping. The old pose was faked on the whole card: stride bob from `phase += speed·dt·S.step` (already distance-based), lean, squash, hop, peck/graze tilt and idle fidgets. | The picture faces left. The card mirrors (`scale.x`) to face the direction of travel, with a tiny "turn hop" so it never shows its edge. Every animal updates every frame. |
| Farmer | `buildFarmer()`: a procedural group built from the wardrobe. It has `legs` (2 hip pivots, each a one-piece leg cylinder plus a boot), `arms` (2 shoulder pivots), `head` (hair and hat) and `body`. | Rigid legs (no knee), no torso pivot. | `updateWalk()` owns movement and collision. Pose came from `placeWalkCamera()`: `sin(walked·4.4)` swing, so the stride was fixed and arms opposed legs. Footsteps came from a separate distance accumulator. | Turns toward the direction of travel. Visible only in the over-the-shoulder walk view, plus the classic idle at `FARMER_HOME`. |
| Rosa, Joe, Mia, Sam, Lily | `visitorCard`: an emoji face card, a cylinder "coat" body tinted by `VILLAGER_COAT`, a hit proxy and a bubble. | No limbs. | **They don't walk**: they stand at the gift spot and bob on a timer. | They face the camera. |

The reusable parts are the per-animal card material (one draw call), the AI's `vel`, the actual change in position each frame, and the farmer's limb groups.

## 2. Chosen architecture (the lightest that gives real legs)

### Cow and chicken: painted-leg cut-out in the card's own shader

- An `onBeforeCompile` patch on the existing card material (and on its shadow depth material) re-samples the same picture in layers.
- **Each painted leg is a pixel rectangle of the art.**
  - The leg **shears about its hip line**: the top stays fixed and the hoof or foot swings, so there is no seam or gap.
  - The leg **lifts** during its swing.
- **Layer order:** far legs behind the body, near legs in front.
- **Pixel ownership:**
  - A pixel belongs to the first leg rectangle that holds it.
  - An optional "claim" rectangle wins first; it keeps the hen's near back toe with its own foot.
  - The body never shows a pixel that a leg owns, so there are no ghost legs.
- **Head:** a soft round patch around the head lets a hen hold her head still and then thrust it forward each step, and lets a cow nod slightly into her front footfalls.
- **Mip selection:** sampling uses one shared gradient (`textureGrad`), so cut edges don't pick a blurry mip level.
- **Cost:** **no new meshes, textures or draw calls**. There are 3 (chicken) or 5 (cow) texture reads per card pixel.
- **Leg rectangles** are listed in the `RIGS` table, in art pixels.
- **For 7F:** sheep, horse, dog and cat would only need a `RIGS` entry each, measured from their art.

### Gait, which is distance-driven

- `pupStep()` measures **how far the animal really moved this frame**, including fence clamping and shoves, and advances `gait += distance / strideLength`.
  - Standing still means no stepping.
  - Pushing against a fence means no stepping.
  - Cadence follows speed.
- **No-slide stepping:** each foot is planted for `beta` of the stride and swept back by exactly `beta·L/2`, so planted feet keep pace with the ground.
- **Running:**
  - The stride lengthens with speed (`L` → `Lrun`).
  - Stance shortens (`beta` → `betaRun`).
  - Lift grows.
- **Walking toward or away from the camera:** foot sweep is scaled by how much of the walk runs across the screen (with a floor of 35%), so feet don't slide sideways on the screen. The lifts stay visible.
- **Starts and stops:** an envelope from the smoothed real speed eases the legs in and back to neutral, with no snapping and no frozen mid-stride slide.
- **Per species:**
  - **Cow:** an 0.8 m stride. The diagonal pairs (near-front with far-hind, far-front with near-hind) are slightly offset for a heavy four-beat feel. Bob is small (1.2% of height) with a small head nod.
  - **Chicken:** a 0.26 m stride, with alternating quick short steps (about 6 a second at walking pace). Stance is 56%, bob is livelier, and the head holds then thrusts.

### Farmer: articulated

- `buildFarmer()` now splits each leg at a **knee**: thigh, then a knee pivot holding the shin and boot. Everything above the belt sits in a **torso** pivot.
- `poseFarmerGait()`, driven by `walk.gait` from real distance, sets:
  - opposite arm and leg swing;
  - knee bend on the swinging leg;
  - shoulder twist against the hips, with the head counter-turning to keep looking ahead;
  - two bobs per stride.
- **Walking vs running:**
  - Walking uses a 0.72 m step with a gentle swing.
  - Running uses a 1.05 m step, a 0.2 rad forward lean, a bigger hip swing, deep knees, arms carried forward and pumping, and a slightly lower body.
- **Starts and stops** ease through a speed envelope, framerate-independent.
- **Footsteps** now fire as each foot lands, half a gait cycle apart. The step lengths are the same as before (0.72 m walking, 1.05 m running), so sound and legs agree.
- The classic idle resets the new joints.

### Unchanged on purpose

- Animal AI, steering, speeds, pens, petting, fleeing, eating/resting poses, fidgets and the turn hop.
- The sheep, horse, dog and cat, which keep their old card pose until 7F.
- First-person camera bob and hands.
- No save fields were added, so there is nothing to migrate in `fresh()` or `upgrade()`.

## 3. Evidence

These are contact sheets from headless Chromium (SwiftShader software rendering):

- [`docs/phase7e/cow-walk.jpg`](docs/phase7e/cow-walk.jpg): an isolated cow walking and then stopping.
- [`docs/phase7e/chicken-walk.jpg`](docs/phase7e/chicken-walk.jpg): a hen, slowed to 12% speed so the step phases are visible.
- [`docs/phase7e/farmer-walk.jpg`](docs/phase7e/farmer-walk.jpg) and [`docs/phase7e/farmer-run.jpg`](docs/phase7e/farmer-run.jpg): the farmer side-on.
  - The final frames show the stop settling back to standing.
  - Software rendering samples about one frame per stride, so these show poses, not motion. **Motion must be judged on a real phone.**

## 4. Validation

- **Full suite (`npm test`): passed.**
  - 50 regression checkpoints at 740×360, 844×390 and 1280×720.
  - 6 performance unit tests.
  - 3 shed-switch viewport runs.
  - No page or console errors.
- This used the container's Playwright 1.56.1 and Chromium through `PLAYWRIGHT_MODULE`/`CHROME_PATH`. CI runs the pinned 1.62.1.
- No tests were changed or weakened.

**Before/after `?perf`** on `?testfarm`, 844×390 at DPR 1, software GPU, same machine:

| | main | 7E |
| --- | --- | --- |
| Classic draw calls / triangles | 729 / 1,051,385 | 732 / 1,051,543 |
| Geometries | 270 | 272 |
| Walk draw calls (desktop first person) | 200 | 198 |
| JS `update()` for all 10 animals | 0.270 ms/frame | 0.290 ms/frame |

- The +3 calls and +2 geometries are the farmer's two new shin meshes (the main pass plus shadow). The animal rig adds **no** draw calls.
- The 0.02 ms of animal CPU covers the cow and chicken gait math. It allocates nothing per frame and only updates existing uniforms.
- Frame times under SwiftShader (about 1.5 s per frame for both) are **not** device performance. There is no FPS claim here: the S26 Ultra baseline is owner-reported, and other phones are unmeasured.
- **Shader cost:** card pixels now take 3–5 texture reads instead of 1. The cards are small, but GPU cost on low-end phones is unmeasured. Check `?perf` on a phone.

## 5. Risks and known limits

- **Visual judgement:** the legs are cut from a 3/4-view painting, so legs swing in the picture plane.
  - Seen side-on, this reads as stepping.
  - Walking straight at the camera, the feet mostly lift rather than sweep.
- **Tall grass** hides most of the hooves and feet in the paddock and yard at normal camera angles.
- **Shadow cards:** the cow/chicken shadow depth material compiles with the rig, but on **both main and this branch** its program lacks `USE_MAP`. The shadow may therefore not follow the art's alpha. This is pre-existing and not changed here; noted for 7K/7M.
- **Farmer turning** still uses the existing per-frame turn rate (frame-rate dependent, unchanged).

## 6. Owner review steps (Android, after merging or on the PR preview)

1. **Paddock:** open `…/farm3d/?testfarm` and watch the paddock.
   - Cows should step with alternating diagonal legs, slowly and heavily.
   - Standing or grazing cows should have still legs.
   - Legs should settle when a cow stops.
2. **Hens:** watch the chicken yard.
   - Quick short alternating steps, with the head holding and then thrusting.
   - When Buddy chases them, they should scurry with faster steps.
3. **Farmer walk:** tap 🚶, keep the over-the-shoulder view (👁️ toggles it) and walk.
   - Arms opposite legs, knees bending, a gentle twist.
4. **Farmer run:** push the joystick to its edge to run.
   - A visible lean, bigger strides, pumping arms.
   - Footstep sounds on each footfall.
   - Walking into a fence should stop the stepping.
5. **Performance:** add `&perf` and compare FPS and median/p95 with your 7C session.
6. **Visual check:** look for seams, flicker or detached toes.

**Stop here.** Phase 7F starts only after the owner approves these visuals.
