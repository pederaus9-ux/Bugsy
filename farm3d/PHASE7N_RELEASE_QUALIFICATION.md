# Phase 7N — production qualification

Status: **IN PROGRESS — not release approved**.
Owner authorized this phase on 2026-10-12 at 19:31:33 America/Chicago.
Implementation owner: ChatGPT/Codex only. Review is an adversarial self-review,
not an independent Claude/Grok/Muse audit.

## Fixed baseline and owner decisions

- Main: `047cbed91b816b4869f983ef8fe2571cdde987e2` (chicken PR #78).
- Main Git tree: `0643a15bc0a7144d3ca1e2dcd8e40a262e62f6fb`.
- Reviewed PR #78 head: `935f6d2ffb2349f1de0ccbd2da98185f00470813`.
  Its complete Git tree equals main's tree, so exact-code art qualification
  applies to the integrated baseline.
- Owner said **all animals are good** at 19:30:47 America/Chicago on 2026-10-12.
  Cow, horse, sheep, dog, cat and chicken visual acceptance is closed. Preserve
  their models/motion unless a new reproducible defect is demonstrated.
- This acceptance does not establish long-session mobile performance,
  iPhone support, live backend security or final release approval.
- Full farm and normal progression remain free to play. Optional cosmetics
  are the accepted future monetization direction. No monetization is added here.

## Scope of this first checkpoint

Reconcile stale current-status labels, inspect existing tests and completed
exact-head logs, verify selected live files, run bounded release checks, and
record an ordered qualification plan. A focused conflicting-save browser test
and isolated hosted workflow are now implemented, with behavioral execution
pending. No runtime, animal, save schema, deployed backend, renderer, service
worker, gameplay, dependency version or existing test-threshold changes.

Historical delivery records remain available. Their old pending animal gates,
roadmap labels, blanket purchase prohibition and schedule claims do not
supersede current owner decisions and freshly verified GitHub state.

## VERIFIED evidence

[Regression #196](https://github.com/pederaus9-ux/Bugsy/actions/runs/38324645491)
passed all seven jobs on main `047cbed`. The logs were read, not inferred merely
from the workflow badge. [Pages #75](https://github.com/pederaus9-ux/Bugsy/actions/runs/38324644434)
passed on the same main commit.

| Area | Verified coverage | Boundary |
| --- | --- | --- |
| Core farming and movement | Normal/testfarm boot; keyboard and mobile joystick; planting/harvest; inventory and XP; order pays once and consumes goods; insufficient inventory blocks delivery; panels fit | Short Chromium scenarios at 740×360, 844×390 and desktop; not full progression or long-session device acceptance |
| Local persistence | Normal crop/coins survive reload; sandbox does not change existing normal save; three old/damaged fixtures; unreadable first copy retained; unknown items repaired; newer saves not overwritten; quota failure reported and recoverable | Disposable browser storage; not an owner's actual device or OS termination |
| Cloud recovery | Actual Firebase SDK against isolated emulators; corrupt phone/good cloud; corrupt cloud/good phone; missing cloud; delayed/late reads; reconnect; sign-in race; reload/sign-out during recovery; no stand-in overwrite | Emulated rules/configuration, not the live project |
| Accounts and social | Registration, username, friend list, showcase, visiting, leaderboard, owner-only dashboard; production-shaped verified economy remains off | No production account or data writes performed |
| Accessibility/lifecycle | Touch targets, panel fit, modal focus, persisted motion setting, motion-menu flash regression, hidden/resumed rendering and released background input | Hidden state is simulated; Android/iOS process eviction and real app switching remain separate |
| Animal visuals and motion | Six-species hosted visual review passed; owner accepted all current animals | No new art work authorized by this checkpoint |
| Authored hands / cache / offline | Art #70 passed all three jobs at reviewed head935f6d2 with identical main tree; actual controlled cache migration, normal save/wardrobe, offline reload without server responses and missing asset/module fallback passed | Hosted Chromium; does not prove an existing phone's real cached old version upgrades correctly |
| Live deployment identity | Twelve selected runtime files byte-identical to main, including index, all six animal modules, shared updater, live3d, auth, analytics and service worker | Not every deployed asset; not a user's existing cache |
| Local release checks | 21/21 version/cache, economy feature flag, SDK parity, performance monitor and asset-policy checks | Node checks only; no local browser qualification claimed |

[Art #70](https://github.com/pederaus9-ux/Bugsy/actions/runs/38321403465)
includes the exact-code hands/cache/offline evidence above. Selected live SHA256
values and reproducible local commands are stored in
[tests/evidence/phase7n/baseline.json](tests/evidence/phase7n/baseline.json).
Full Actions artifacts expire; their current URLs are evidence locations, not
permanent archives. The existing chicken review checkpoint is frozen at
`5f6d52e9be88aaa961c490a21e6d89675331a034`.

## LIKELY, with limits

- `auth.js` uses a cloud revision check: an old device normally cannot overwrite
  a newer saved farm. If both copies changed, the player chooses one and the
  other is retained as a local backup. This is source evidence for the design;
  it is not end-to-end proof of two-device conflict resolution.
- Existing short gameplay and recovery qualification is a useful release
  baseline. It cannot establish extended-session stability or phone thermals.

## UNKNOWN — required gates, not invented defects

| Gate | Missing evidence | Next action / owner |
| --- | --- | --- |
| Same-account conflicting saves | Real two-device divergence, refused stale upload, both user choices and backup survival through reload | ChatGPT: isolated emulator regression first; owner actual-device check afterward |
| Android long session / heavy farm | Current-build sustained frame times, crashes, memory growth, heat, touch responsiveness and background recovery | Owner S26 Ultra; ChatGPT prepares fixed-build test record and interprets measurements |
| iPhone Safari / PWA | Supported iPhone browser/install, touch, audio, account/save, offline/update and OS resume | Physical iPhone test required; software viewport emulation is insufficient |
| Production security/configuration | Currently deployed Firestore rules identity and parity with tested rules; live owner-only dashboard/privacy boundaries | Obtain read-only Firebase console/export evidence; no live rules deployment authorized |
| Existing-device PWA update | Real old installed/cache build upgrades; saved farm preserved; offline reopening and asset failure recovery | Owner device plus fixed old/current candidate; preserve account/save backups |
| Complete gameplay/progression | Sustained consecutive farming, production chains, orders, inventories, unlocks, customization and applicable interactions across levels | ChatGPT audit/scenarios; owner game-feel acceptance |
| Environment/audio quality | Real weather/day/night transitions, sound/mute behavior and environment acceptance within actual game | Inspect real runtime; owner acceptance of visible/audible results |
| Release operations | Fixed candidate, rollback/recovery rehearsal, known limits, support record and explicit release decision | ChatGPT prepares runbook; owner approves release |

`farm3d/firebase/README.md` says repo rules are not yet published. That is an
old note, not proof of the live rules today. Live rules are **UNVERIFIED**.
Open PRs #60, #54, #37 and #34 are separate work. Their presence is neither proof
of a release blocker nor authorization to merge/close them.

## Highest-value next engineering action

Run the newly implemented, production-shaped **same-account conflicting-save
emulator qualification** in `farm3d/firebase/tests/conflicts.browser.cjs`, using
the existing harness and real `auth.js`; keep verified economy off. Use isolated
demo accounts/data only. Run `npm run test:conflicts` in `farm3d/firebase`.
Syntax is checked; behavioral results must come from the new exact-head
`Sunny Acres release qualification` hosted workflow before declaring this gate
passed. Existing suites and thresholds are unchanged.

1. Establish one account and the same cloud revision on two disposable devices.
2. Change both copies with distinct saved-state markers.
3. Upload one device; prove the stale second device refuses overwrite and stays
   dirty (its local unsynced progress remains available).
4. Reopen the stale device; prove the game presents both saved farms.
5. Test choosing cloud: cloud marker retained, phone copy backed up unchanged.
6. Test choosing phone: phone progress becomes cloud; old cloud backed up
   unchanged. Reload and prove selected progress plus backup survives.
7. Exercise offline/reconnect around divergence. Record exact revision,
   progress, user choice, backup bytes and every attempted cloud write.
8. Fail on progress loss, unwanted overwrite, silent selection or missing
   backup. Do not lower existing assertions or numeric thresholds.

The current suites cover revision rules and recovery, and the dormant economy
has its own two-device tests. They do **not** currently prove this whole normal
farm conflict/choice workflow. Those economy tests cannot substitute for it.

## Device qualification packet

Use the fixed current baseline, record the actual build/version, device/browser,
mode, weather, farm load and session duration. In Classic and Walk, cover
normal play and heavy crops/animals/decorations; inspect noon/golden hour,
rain/snow/night, settings, inventories/orders and repeated interactions.
Include real app background/foreground and network loss/reconnect. Verify
owned progress survives reopening. Keep diagnostics on for timed measurements;
record median/p95/worst frame time and any visible hitch/crash/input failure.

The existing roadmap calls for 20–30-minute mobile sessions; that is a test
protocol, not a delivery deadline or a claim that a session already passed.
Preserve the existing targets: ideal60FPS, good45+, floor30; investigate
sustained >33.3ms frames and >50ms hitches. Optimize measured causes only.
CPU throttling and software rendering do not establish hardware phone results.

Do not damage or overwrite an owner's farm to manufacture a test. Disposable
accounts/storage cover destructive conflict and corruption scenarios.
Production authentication/rules changes require separate bounded approval.

## Stop conditions and completion

Stop and isolate the first proven data loss, account/privacy leak, repeated
crash, wrong gameplay award, broken update or sustained device-performance
failure. Capture exact build, first failing operation, logs and state, then run
the smallest discriminating experiment. Do not blindly rerun unchanged failures.
Escalate changes to protected systems or major product/architecture decisions.

Phase 7N is complete only when applicable gameplay, persistence, security,
update, lifecycle, mobile/device and operational gates pass on the fixed
candidate and the owner accepts it. This initial checkpoint is not a release.
No merge or final release authorization has been given for this phase.
