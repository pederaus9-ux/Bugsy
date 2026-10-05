# Sunny Acres Cow Reconstruction — B1 Measurable Holstein Proportions

Status: B1 SPECIFICATION / NO PRODUCTION GEOMETRY CHANGE

B0 dependency head: `c2aeac480f908366603b8c8858e2df3a6b42a9dc`
Frozen production baseline: `75baac10fc3e4294062b67d44dee7c9e1325f94c`
Frozen cow blob: `866bb94666a58fd2f5402b440789255ce8264dee`

B1 defines the target anatomy numerically and produces controlled orthographic reference sheets before B2 is allowed to replace the body mesh. This phase changes evidence/tests only; `cow3d.js`, Beast AI, saves, collisions, economy and runtime behavior remain unchanged.

## 1. Biological anchors

The target is a healthy mature female Holstein, expressed in Sunny Acres' stylized language rather than photorealism.

Primary breed anchors come from Holstein Association USA. The 2026 classification change identifies 60 inches as ideal mature stature. The current linear-trait conversion table gives a breed-average mature daughter hip height of 60.2 inches at STA 0, approximately 1.529 m. The same table gives the following STA-0 measurements used by this specification:

- ideal hip height: 60 in = 1.524 m
- average hip height: 60.2 in = 1.52908 m
- hooks-to-pins drop: 1.0 in = 0.0254 m
- pin-bone spacing: 6.4 in = 0.16256 m
- foot angle: 45 degrees
- rear udder height: 9.4 in = 0.23876 m
- rear udder attachment width: 6.4 in = 0.16256 m
- udder floor relative to hock: 1.9 in = 0.04826 m
- rear teat spacing: 1.4 in = 0.03556 m
- teat length: 2.1 in = 0.05334 m

Sources:

- https://www.holsteinusa.com/news/press_release2026.html
- https://www.holsteinusa.com/genetic_evaluations/ss_interpret_linear.html
- https://www.holsteinusa.com/pdf/print_material/linear_traits.pdf

Published dairy-cow morphometry is used only as a cross-check because measurement definitions differ between studies. A large lactating-cow dataset reports approximately 146 cm stature, 84 cm body depth, 56 cm pelvis length and 57 cm hip width in its pooled sample. These support a deep dairy barrel and broad hook region but are not substituted for the Holstein Association's breed anchors. Reference: https://pmc.ncbi.nlm.nih.gov/articles/PMC7065411/

## 2. Coordinate system

All B1 targets are expressed in the existing cow actor space:

- X: lateral; +right
- Y: up; ground plane Y=0
- Z: longitudinal; -forward/head and +rear

The frozen B0 measured actor envelope is:

- X: -0.7556 to +0.7556
- Y: -0.1417 to +1.9833
- Z: -1.4167 to +1.1806

B1 does not change the gameplay species height 1.7 or collision radius 0.9.

## 3. Corrected Sunny Acres Holstein target

The B1 static silhouette target is deliberately smaller than the frozen B0 render envelope to leave animation/turning clearance:

- X: -0.42 to +0.42
- Y: 0.00 to 1.78
- Z: -1.30 to +1.06

Major target dimensions:

| Measurement | B1 target | Rationale |
| --- | ---: | --- |
| Hook/hip height | 1.524 m | Holstein Association 60 in ideal |
| Pin height | 1.4986 m | exact 25.4 mm downward rump slope |
| Withers height | 1.50 m | near-level dairy topline, slightly below hooks |
| Ear top | 1.78 m | readable stylized head while preserving envelope margin |
| Brisket height | 0.66 m | deep dairy chest rather than current rounded capsule |
| Belly low line | 0.72 m | retains abdominal depth while leaving udder/leg clearance |
| Body depth at heart | 0.84 m | 55.1% of ideal hip height; compatible with published dairy morphometry |
| Withers to pins | 1.48 m | long dairy frame; 97.1% of ideal hip height |
| Hooks to pins longitudinal span | 0.41 m | readable pelvis/loin transition |
| Barrel outer width | 0.68 m | 44.6% of ideal hip height |
| Outer hook width | 0.60 m | 39.4% of ideal hip height |
| Ear-tip span | 0.84 m | stylized readability; still far inside B0 width |
| Poll to muzzle | 0.43 m | elongated bovine skull instead of rounded toy head |
| Muzzle width | 0.32 m | broad bovine muzzle |
| Visible udder outer width | 0.38 m | readable four-quarter silhouette; biological attachment remains separately anchored |
| Hoof pair width | 0.11 m | readable cloven hoof at phone scale |
| Hoof length | 0.14 m | stable sole/contact surface for B10 |

The numerical source of truth is `evidence/cow-reconstruction/b1/cow-b1-targets.json`.

## 4. Controlled orthographic reference targets

The following committed SVGs are engineering references, not beauty art and not production geometry:

- `evidence/cow-reconstruction/b1/holstein-side-target.svg`
- `evidence/cow-reconstruction/b1/holstein-front-target.svg`
- `evidence/cow-reconstruction/b1/holstein-rear-target.svg`

They show the frozen B0 envelope, the B1 target envelope, major biological landmarks and key dimensions. B2 must be evaluated against all three views, not a single flattering camera.

### Side target requirements

The side silhouette must show:

- hook height at 1.524 m
- pins 25.4 mm below hooks
- long body frame from withers to pins
- continuous neck-to-withers transition
- elongated skull and broad muzzle
- deep chest/barrel without a spherical torso
- readable shoulder, stifle, hock and fetlock placement
- udder floor slightly above the hock reference
- hoof front face near 45 degrees
- tail rooted at the sacral rear, not the middle of a sphere

### Front target requirements

The front silhouette must show:

- bilateral symmetry around X=0
- barrel width 0.68 m
- muzzle width 0.32 m
- ear-tip span 0.84 m
- fore hoof centers near X=+/-0.20 m
- a narrower dairy neck than barrel
- no bow-legged or crossed forelimb stance

### Rear target requirements

The rear silhouette must show:

- outer hooks near +/-0.30 m
- biological pin-bone spacing 0.16256 m
- readable central tail root
- visible four-quarter udder form with biological rear attachment tracked separately from the stylized outer skin silhouette
- hind hocks near +/-0.23 m with near-straight rear tracking
- no obvious hock-in or toe-out

## 5. Anatomy tolerances

B2/B3/B4/B5/B6 static validation must satisfy these B1 tolerances before animation tuning begins:

| Item | Allowed deviation |
| --- | ---: |
| Major height/length dimensions | +/-5% |
| Major width dimensions | +/-6% |
| Knee/hock/fetlock and other joint landmarks | +/-0.04 m |
| Hooks-to-pins vertical drop | +/-0.01 m around 0.0254 m |
| Hoof front angle | 45 degrees +/-5 degrees |
| Major left/right symmetry | <=0.015 m |
| Fine paired-feature symmetry | <=0.008 m |
| Static hoof sole from ground | <=0.002 m |
| Intended continuous surface join gap | <=0.002 m |
| Udder floor above hock anchor | 0.04826 m +/-0.025 m |

Features smaller than 0.06 m may be enlarged by at most 1.35x for phone readability, but their attachment/center landmarks must remain biologically anchored and the B0 envelope must remain respected. This exception is intended for small details such as teat visibility, nostrils, eye rims and the hoof split; it is not permission to enlarge the head, udder, feet or limbs arbitrarily.

## 6. Exact envelope-fit proof

B1 target extents compared with the B0 frozen envelope leave the following static margins:

| Direction | Margin |
| --- | ---: |
| Left | 0.3356 m |
| Right | 0.3356 m |
| Below target ground plane vs B0 min Y | 0.1417 m |
| Above target vs B0 max Y | 0.2033 m |
| Forward/head | 0.1167 m |
| Rear | 0.1206 m |

Therefore the proposed corrected cow fits entirely inside the existing measured actor render envelope before any B2 geometry exists.

The proof is executable: `tests/cow-b1-proportions.test.mjs` checks the target envelope, every committed landmark, exact Holstein anchor dimensions, safety margins, coarse proportion ratios and presence of all three controlled SVG targets. The test is included in `test:core:game` so later geometry work cannot silently delete the specification gate.

This does **not** claim the gameplay collision radius encloses the visible cow. It already does not describe the full current rendered silhouette; the collision value remains protected and unchanged.

## 7. B2 entry gate

B2 may replace body geometry only after B1 review confirms all of the following:

1. B0 remains frozen and unchanged.
2. All B1 reference files are deterministic and present.
3. The B1 proportion/envelope test passes.
4. No production cow geometry or gait code changed in B1.
5. The corrected body can be built inside the B1 target envelope without changing species height, collision radius, Beast ownership or public renderer signatures.
6. B2 implementation is judged against front, side and rear targets simultaneously.

B1 does not approve any mesh yet. It establishes the measurable anatomy contract that B2 must satisfy.
