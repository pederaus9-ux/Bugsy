# Care bedtime seed sweeps (diagnostic; the suite itself runs seeds 4242 and 1)

Method: farm3d/tests/remaining-care-beast.test.mjs with its seed list replaced by SEEDS from the environment (sed: 'for(const seed of [4242,1])' -> 'for(const seed of JSON.parse(process.env.SEEDS))'); same body, deadlines and assertions; 4 parallel chunks; node v22.22.2; local container.

| Code | Seeds | Failing seeds | Count |
| --- | --- | --- | --- |
| 17f0048 (before A2) | 2-41 | seed 4 seed 11 seed 13 seed 15 seed 24 seed 25 seed 29 seed 38  | 8/40 |
| 3009594 (A2, before fix) | 2-41 | seed 10 seed 12 seed 20 seed 25 seed 26 seed 34 seed 36  | 7/40 |
| 86a99d9 (A2 + give-way + pet search box) | 2-81 | seed 23 seed 26 seed 41 seed 62 seed 69  | 5/80 |

Classification:
- Before the fix, all failures were bedtime standoffs: horses or sheep stuck in front of their beds (mirror livelock or swapped destinations).
- After the fix, all 5 remaining failures are the dog: an empty plan while it stands in a keep-out pocket created by ordinary roaming. Seeds 23 and 26: at (3.9, 2.0) and (3.9, -4.0), inside the barn's collision box near its east face. Seed 41 (traced in detail): at (-4.25, 4.55), in the 0.5 m gap between the barn's west face and the chicken-yard fence, with a bush to the north. No free cell is within the 1.5 m start window, and the escape rule forbids moving along the barn face. Seeds 62 and 69: at (13.3, -8.8), at a pen corner (not traced in detail).
- Remaining pre-existing defect (also on main): a pet that roams into such a pocket can never start a care walk. Proposed fix: when the care start is not free, plan out to the nearest free cell with reduced clearance (real object footprints, fences, pens and animal bodies only), then resume normal care planning. Not yet implemented.
