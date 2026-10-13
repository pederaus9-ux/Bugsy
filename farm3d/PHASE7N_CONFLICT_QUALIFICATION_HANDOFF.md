# Sunny Acres — Phase 7N qualification checkpoint

This is a **measured evidence checkpoint**, not a competing implementation or
another merge candidate. PR #79's tested head remains unchanged. The checkpoint
contains receipts/documentation only, parented to the tested implementation.
Its result supersedes the original pre-CI pending label for these two cases.

## SUNNY ACRES RELAY HANDOFF

Agent: ChatGPT/Codex (sole implementation owner; adversarial self-review).
Task / phase: Phase 7N normal-farm conflicting-save qualification.
Base main: `047cbed91b816b4869f983ef8fe2571cdde987e2`.
Tested head: `c0ba1dc79bff54b210edadd7fb87a44029124d17`.
Tested tree: `55e8e13146e2c78fc0647d2b07e97c6cfbf1ef5b`.
Implementation branch: `codex/phase7n-release-qualification`.
PR: [#79](https://github.com/pederaus9-ux/Bugsy/pull/79), draft and unmerged.
Evidence branch: `codex/phase7n-conflict-evidence` (no separate PR).

Scope completed: recorded owner acceptance of all current animals; verified
current-main baseline and selected live sources; added a two-device same-account
browser test using real auth/game and SDK against isolated demo emulators.
No production writes or new runtime behavior.

Files: `farm3d/firebase/tests/conflicts.browser.cjs`, additive `test:conflicts`
script, `.github/workflows/farm3d-release-qualification.yml`, current status
notes, qualification plan and evidence. All pre-existing npm scripts and
versions are unchanged. No existing assertion/threshold was weakened.

Tests: original bounded Node release checks21/21; new script syntax, JSON,
protected-path inspection and diff checks pass. Hosted `npm run test:conflicts`
passes both cloud/phone choices on exact headc0ba1dc, workflow#1, run38328239127,
job115071811629. Both choices prove offline divergence, refused stale upload,
no stale farm write, user choice and byte-exact unselected backup surviving reload.

| Choice | Initial revision | Other device's revision | Final selected revision | Selected coins | Preserved backup bytes | Stale farm writes |
| --- | --- | --- | --- | --- | --- | --- |
| Cloud | 1 | 2 | 3 | 320 | 2036 | 0 |
| Phone | 1 | 2 | 4 | 220 | 2057 | 0 |

Final revision includes subsequent normal save/reload activity. It is not a
claim that ordinary saves are disabled after selection. This test proves two
specified trajectories, not arbitrary device input or physical-device behavior.

CI: new qualification workflow#1 SUCCESS. Broader regression#198 has3/7jobs
passing at this snapshot; four are still running. Do not call that workflow
fully green. Refresh GitHub before proposing integration. Current integrated
main regression#196 all7 and Pages#75 are already verified successful. Art#70
is applicable to current main because its reviewed and merged Git trees match.

Evidence: unmodified artifact `conflicts-results.json` and provenance are
frozen under `farm3d/tests/evidence/phase7n/`. ZIP artifact11781842902's SHA256
`4b87ce5e3b0833c65b5342ed8b4f4d978ed70d56f5aa501937a61a09ecde4184`
was verified before extracting the result. No imagined/replacement visual proof.

Protected systems checked: accepted animal/runtime files, geometry/motion,
backend deployment/rules/data, save schema, root speeds/collision, service
worker, renderer interfaces, dependencies and original tests unchanged.

Known failures: none in the two new measured scenarios. No new production
bug proven. Current-build physical phone, iPhone/Safari/PWA, sustained load,
actual OS background/cache update and production rules/configuration remain
unverified required gates. Historical phone screenshots are not current-build
long-session proof. Software/emulator checks are not physical phone results.

Owner approval: all current animals visually approved (2026-10-12 19:30:47
America/Chicago); Phase7N authorized (go, 19:31:33). This is not final release,
production-security, sustained-device or PR79 merge approval.

Verdict: **PASS WITH LIMITATIONS — these two conflict regression cases only**.
Merge recommendation: hold PR79 until exact-head hosted regression finishes
and owner grants merge approval. Phase7N as a whole remains IN PROGRESS.
Do not independently merge the evidence branch: consume its receipts when
reconciling later status. Keep the implementation/tested head distinct.

Exact next action: inspect remaining regression#198 results; preserve any
failure and diagnose rather than blindly repeat. Then qualify fixed-build
Android/iPhone/PWA long sessions and real update/reconnect/background recovery,
and obtain read-only evidence identifying the live Firestore rules. The main
qualification plan contains the device packet and stop conditions. No further
animal reconstruction or optional animation polish is part of this milestone.
