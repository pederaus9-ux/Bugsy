# PR84 planting trial publication

Owner instruction at2026-10-18T10:49:59-05:00: “Let's merge planting and see how it works”. After disclosure of the baseline character-check failure, this explicitly authorizes this bounded integration/publication for in-game review. It does not certify that failed check or full release readiness.

Base54d970e389418e6dbd9d49ca25f8a611b6f2f81c; reviewed0ccb01d64be1b9c51483de6150b1838286a7c31a; merge756df378e7adbe20f34c204dc54172b1030e16bd. Both parents verified; merged tree6580beff7b9018ec33c6d4cda0fff9139b4339d4 equals the reviewed tree. PR84 merged normally; original branch/history/evidence preserved. Eleven intended paths changed, no additional runtime changes.

Exact reviewed-head regression:7/8 jobs pass. Planting12 unit contracts and22 browser behavior groups, gameplay, Firebase rules/economy/flows/save recovery, animals, saves, accessibility and analytics pass. All check runs:11 success,1 failure. Authored-hands and same-account conflicting-save checks also pass on this exact head; older authored-hands timeout evidence remains preserved. Local focused101/101 plus6 syntax checks pass; original incomplete-fixture and interim selector-collision failures retained.

Remaining failure: scene-polish.browser.cjs:75:10, legacy exact-zero finger-return timeout, observed on published baseline and candidate. Cause unestablished; no assertions/timeouts/runtime weakened to clear it. Full CI is not green.

GitHub Pages39142393236 SUCCESS: build117719296057, deploy117719392052, report117719392054 all successful. Deploy log explicitly names merge756df378e7adbe20f34c204dc54172b1030e16bd and site https://pederaus9-ux.github.io/Bugsy/. Game https://pederaus9-ux.github.io/Bugsy/farm3d/ . No independent phone/client-cache/live-byte verification is claimed by the deployment receipt. Owner review is next.

Post-merge main regression39142394038 is running at publication; no future success assumed. GitHub Actions are the running system; no autonomous assistant monitor is installed. Existing recorder/normal optimization remain shelved, no recorder/browser workaround launched. Broader performance/reference/device/release gaps remain open.

The updated relay snapshot and this report live on codex/planting-publication-record-20261018, a separate evidence branch. No additional main change or feature is merged by creating this record. Original PC inaccessible/untouched; no unrelated save/auth/Firebase/economy/character/animal/movement changes. Worker cache v46 refreshes the changed HTML without altering worker algorithms.

If owner later requests rollback, inspect current main and prepare a normal revert of this merge, preserving any subsequent work; baseline first parent54d970e. Do not reset main, delete records, clear storage, or imply gameplay save writes can be undone by code rollback. No rollback authorized/performed now.
