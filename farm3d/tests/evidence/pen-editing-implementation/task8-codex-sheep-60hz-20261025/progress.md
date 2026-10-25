# Task 8 sheep-edit seed-1, 60 Hz local care/wake checkpoint

Source HEAD at the browser run was `7562c4518daad0b967d7ae0ac3d26690d9668219` plus the local test-only rate parameterization in `animal-pen-three-night.browser.cjs`; no production code changed. `acceptance.md` preceded the run. The test used the actual test-only seed-1 gameplay stream, a real saved sheep whole-pen Apply, all 46 owned animals, and three consecutive nights in one local Chromium context at `dt=1/60`.

The 500-second night and physical-departure limits became 30,000 frames solely because of the 60 Hz rate; each individual continuous 40-second wake required 2,400 frames. All simulated frames were observed by the existing physical wake oracle. Two added 60 Hz negative-control tests reject the old 1,200-frame wake count, a return at 39.9 seconds, and a 500-second departure violation. The full wake-oracle suite passed 14/14. No seed, gameplay limit, clearance, animal clock, or production RNG changed.

| Night | All 46 beds held | Latest physical departure | All 46 individual wakes |
|---:|---:|---:|---:|
| 1 | 282.02 s | 288.77 s | 328.77 s |
| 2 | 312.83 s | 332.02 s | 372.02 s |
| 3 | 263.68 s | 300.03 s | 340.03 s |

Each cycle retained 46 stable identities, 46 distinct installed bed reservations, exact paid state, layout revision 1, containment checks and zero browser errors. Raw result and rendered local frame are in `seed1-candidate/`. The test exited 0. This advances the **care/wake subgate** to 3 of 30 edit/seed/rate combinations: sheep move at seeds 1 and 4242 at 30 Hz, plus sheep move at seed 1 at 60 Hz. The other 27 combinations, full physical speed/contact/pose breadth, recovery/cloud, hosted/device and merge gates remain open. The local viewport is not a physical phone or official CI. Offline cache/importer bookkeeping still requires named-file approval and predecessor qualification before publishing changed runtime bytes. No remote upload, Site update, merge or live deployment.
