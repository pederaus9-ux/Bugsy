# Phase 7H gate evidence: F1 (rules) and F2 (save recovery)

Branch `claude/sunny-acres-phase7h-fixes`. Nothing here is merged or published.
Ruling being answered: **F1 blocks the production rules publish. F2 blocks the 7H implementation merge.**

Here F1/F2 are the red-team gate findings. `SAVE_AUDIT.md` uses F1–F6 for its own save findings, which are different
items; where they appear below they are written "save F1", "save F2", and so on.

---

## F1: Firestore read authorization (get / list / count)

**Reproduction.** I probed every collection with a separate get, list and count for each role (owner, the document's
player, another signed-in player, no sign-in) against the 7G-1 rules in the emulator.

- The owner could **list and count `farms`**. A list returns whole documents, so the owner could download every
  player's full save. The rule meant to allow only a count was `allow list: if isOwner()`.
- Any signed-in player could **list all of `showcase` and `usernames`**, because `allow read` covers both get and list.
- An owner-email token with `email_verified: false` was accepted.

**Root cause.** Firestore has no count-only permission. A count is a list, and list permission returns full documents.
`read` is get + list, so allowing it on showcase and usernames also allowed listing them.

**Rules change (7G-2), the smallest one that closes the gap:**
- `farms/{uid}`: `allow get: if isMe(uid); allow list: if false;`
- `showcase/{uid}`: `allow get: if signedIn(); allow list: if false;`
- `usernames/{name}`: `allow get: if signedIn(); allow list: if false;`

Everything else is unchanged from 7G-1, and no deny test was weakened. `players.html` no longer counts `farms`: its
"total players" now comes from `presence`, which the owner can already read.

**New authorization tests** (`firebase/tests/rules.test.mjs`):
- A get / list / count matrix for every collection × role.
  - farms: owner D D D, the player A D D.
  - showcase and usernames: signed-in A D D.
  - players, help, friends and market: A A A for the allowed role.
  - presence and events: owner A A A.
  - Every collection with no sign-in: D D D.
- "Nobody can list or count farms": owner getDocs, a limited query, owner count, bob count and alice list.
- Owner-email limit (documents current behaviour as a residual risk): an unverified owner email is accepted; a
  different-case email or a missing email claim is refused.
- Two buyers at the same moment: through the game's transaction exactly one gets the listing, and two blind writes at the same moment (no transaction, no client check) are stopped by the rules (exactly one lands).
- Mutation check (wide-open rules): 182 of 185 deny cases get through; the other 3 are edits of documents an earlier, wrongly allowed delete had already removed. So the deny tests test the rules.

**Results.**
- 7G-2: 23 tests, 75 allows + 185 denies = 260 checks, all pass.
- Against the old 7G-1 file (`RULES_FILE=` the 7G-1 copy), the new farms tests fail ("farms list as owner: expected
  deny"). They detect the bug they were written for.

---

## F2: save recovery

### The invariant

> A corrupt or unreadable phone save must never overwrite a known-good cloud save during recovery.

### Timed-out run evidence (the original failure)

The first CI-style run of the old "damaged phone save" flow timed out at 00:26 (2026-10-02, Central).

- What survives: the failure screenshot,
  [`evidence/timed-out-run-2026-10-02T0026-flow-grandma-failure.png`](evidence/timed-out-run-2026-10-02T0026-flow-grandma-failure.png).
  It shows the **stand-in farm's first-run "Welcome to your farm!" screen**: the cloud farm had *not* come back.
- What was lost: that run's console log. The harness wrote one log file per page name, and the next run overwrote it.
  The harness now keeps every log line with a timestamp, and each run's artifacts are copied into `evidence/` before the
  next run.
- `evidence/later-passing-flows-run-0034-flows.json` is from a **later, passing** run (00:34). It is not the timed-out
  run, and is kept only for comparison.

### Reproduction and root causes (two, both evidenced)

**(a) The cloud read times out on a busy page and was never retried.**
- On a page building the 3D farm with software graphics, Firestore logs "Backend didn't respond within 10 seconds" and
  `getDoc` fails.
- The old `linkFarm` then said "Cloud farm unavailable, playing the farm on this phone" and never tried again. Recovery
  stayed pending, and the player sat on the stand-in farm for the rest of the visit.
- Reproduced in the new suite's first run (scenario 1.1: restored false, cloud untouched). The log is in
  `evidence/run-rec1/`.
- The same path, outside recovery, turned off cloud sync for the whole visit. That run's scenario 1.2 "normal save after
  recovery" failed with rev 4→4; see `evidence/run-rec1/console-grandma.log` around page load #7.

**(b) A race between sign-in and the game's first read of the save.**
- `auth.js` can sign in and run `linkFarm` before `game.js` has read the save (the game reads it only after the 3D scene
  has built).
- The old `linkFarm` decided "recovering" from a flag that `game.js` sets when it finds the save unreadable. If sign-in
  came first, there was no flag yet and recovery was skipped.
- Reproduced deterministically: the harness holds `cow3d.js` back 25 s, and the test runs against the pre-fix `auth.js`.
  Result: `FAIL 0 race … restored false after 123s, page loads +1, recover 1, cloud rev 1->1, bad samples 0, stand-in
  writes 0` (`evidence/race-prefix-auth-FAIL.log`).

In every failing run the invariant still held: **0 stand-in writes were sent and the cloud copy was untouched.** The
failure was "the good farm doesn't come back", not "the good farm gets overwritten".

### Fixes (`auth.js`, owner-authorized protected file)

- `linkFarm` now decides "recovering" from the save itself (present but unreadable, for this account) as well as from
  the flag, so the order of sign-in and game load no longer matters. It also keeps the first unreadable copy itself.
- **Retry with backoff** (5 s, 10 s, … up to 60 s) whenever the cloud read fails, for as long as the same account stays
  signed in and isn't linked yet. This is a fix in the game for cause (a), not a retry in a test.
  - Each try makes exactly the same decisions as opening the game again.
  - Until one succeeds, `cloud.uid` stays empty, so nothing is uploaded. While recovery is pending, `upload()` also
    refuses.
- **Storage full while restoring:** after writing the cloud farm locally, the code checks that it really landed
  (`ls.set` swallows errors). If it didn't, recovery stays pending and nothing is uploaded.
- **Corrupt cloud copy:** it is never brought to the phone. If the phone farm is good, the phone farm repairs the cloud.
  If both copies are unreadable, the phone keeps playing (no reload loop) and the next real change replaces the cloud
  copy.
- **Missing cloud copy:** recovery ends and the stand-in may start the account's cloud save (`SYNC_REV` 0).
- Unchanged from the earlier 7H work: `game.js` keeps the first unreadable copy, shows a notice, and sets the recovery
  flag only for account farms.

### New recovery test design (`firebase/tests/recovery.browser.cjs`, shared harness `emu-harness.cjs`)

**What it measures, and how:**
- **A sentinel, not coins.** Before each scenario the good farm gets a unique `__sentinel` token. It is committed, and
  the test waits until the cloud copy equals the phone copy byte for byte.
- **The cloud watched for longer than the 15 s upload delay.** The cloud copy is sampled every second for 20–45 s, and
  any sample without the sentinel (or not byte-identical, where that is the expectation) is a failure.
- **Every farm write recorded.** All farm writes the page sends are captured from the network, so a stand-in upload is
  caught even if something later wrote over it.
- **Restore checked two ways.** The phone copy is compared as a progress projection (sentinel, level, xp, coins, gems,
  barn, plots, stats), because the game re-saves timestamps after loading. The cloud copy is compared byte for byte.

**Test machinery:**
- The damaged save is written "at rest" before any game script runs.
- Page loads are counted.
- Network faults are real request aborts:
  - `offline` aborts everything.
  - `blockFarmRead` makes only the read of this player's farm fail, while writes still go through. This means an
    attempted upload *would* land.

**No test-side retries, longer timeouts, weaker assertions or polling for a favourable state.** The test fails as soon
as a bad sample appears.

### Results (latest full run; logs in `evidence/run-rec3-pass/`)

| # | Scenario | Result |
|---|---|---|
| 0 | Race: sign-in before the game reads the save | PASS: restored after 49 s, 0 bad samples, 0 stand-in writes (FAILS on the pre-fix auth.js) |
| 1.1, 1.2 | Corrupt phone + good cloud (twice) | PASS: restored with the same progress and sentinel; exactly one recovery reload; cloud rev unchanged and never without the sentinel for 40 s |
| 7 | Recovery then a normal save | PASS: uploads the restored farm, sentinel kept, rev +1 (both repeats) |
| 2 | Good phone + corrupt cloud | PASS: phone farm kept, no reload loop, cloud repaired from the phone (rev corrupt+1, sentinel present) |
| 3 | Corrupt phone + missing cloud | PASS: no recovery reload; the first unreadable copy kept (not replaced); new cloud save at rev 1 |
| 11 | Cloud unreachable at start, no recovery | PASS: the same visit syncs once the cloud is back, no reload |
| 4/9/10/8 | Reload during recovery; recovery state survives the reload; online but the farm read fails; same coins, different state | PASS: pending 1/1/1; the stand-in has the same coins as the good farm; farm read refused; 0 bad samples over 25 s online (> 15 s); 0 stand-in writes |
| 6 | Sign-out during recovery (sign-out tries an upload first) | PASS: nothing uploaded, recovery still pending |
| 5 | Sign-in during recovery | PASS: cloud farm restored after exactly one reload; cloud copy byte-identical |

**What the suite caught on the way (honest record):**
- The first run with the retry fix exposed cause (a) outside recovery, plus a test bug: the "kept copy" check ignored
  the deliberate first-copy-only rule.
- The second run passed, but its log showed that scenarios 5 and 6 ran after recovery had already finished. I treated
  that as a hollow pass. They now run while recovery is provably pending (`blockFarmRead`).

### Other required checks (`farm3d/tests/save7h.browser.cjs`, 13/13 PASS; save findings F1–F6)

- **Fixtures:** the 3D first-release save, the 2D save, and a damaged save (repaired: numbers coerced, coins 120).
- **Unreadable save:** the first copy is kept and never replaced, the player is told, and only account farms mark
  themselves for recovery.
- **Unknown item:** removed, and the game starts.
- **Newer save:** opens but is never written back by older code.
- **Storage full:** `save()` fails visibly (notice, returns false, no "saved" event) and recovers.
- **Quota failure:** does not trigger a cloud upload (`{"r":false,"saved":0,"dirty":null}`).
- **Migration ladder:** runs in order, once only; a gap is an error; a newer save is left alone; `upgrade` is idempotent
  on the fixtures.
- **Measurements:** a normal save is 1.9 KB, a heavy save 19 KB (limit 900 KB), and an idle farm makes 0 saves per
  minute.

---

## Full suites and CI

All of these are on draft PR #38, marked do not merge.

| Suite | Local | CI run 36984236000 (head `c6f4519`) |
|---|---|---|
| Firebase rules (`rules.test.mjs`) | 23/23, 260 checks | 23/23, 260 checks |
| Firebase game flows (`flows.browser.cjs`) | 18/18 | 18/18 |
| Save recovery (`recovery.browser.cjs`) | 13/13 | 13/13 |
| Old saves + measurements (`save7h.browser.cjs`) | 13/13 | success |
| Full Farm3D regression | run 1: exit 0 (60 + 15) · run 2: see below | success: 60 PASS, 0 FAIL |

**First CI run (36980947290, head `11cab6d`): the Farm3D regression failed, and it was investigated rather than
re-run.**
- Failing check: "1280x720 pointer harvest". The plot was still planted after the click, and the failure screenshot
  shows the Wardrobe open.
- The trace's screencast shows the spot was picked while the camera was **still easing out of first-person walk mode**.
  The test waited a fixed 2 s, which wasn't enough on the CI machine.
- In the settled view the **farmer stands on that plot**: after a walk, the farmer stays where the walk ended, by
  design. The second click therefore hit the farmer, and tapping the farmer opens the wardrobe.
- This is a timing gap in the test, not a 7H change: 7H changes only the version numbers in `index.html`.
- Fix (`c6f4519`, test only): wait until the eased view reaches the camera target, and pick only a spot that the
  game's own hit test reports as that plot. The assertions are unchanged.
- Evidence: `evidence/ci-run-36980947290/` (the job log, the failure screenshot, and the first-vs-second-click
  frames).

**Local regression run 2:** every check passed, including the fixed 1280 harvest, except the last stage
(`cow3d.browser.cjs`). There, at the third viewport, navigating from the 1280 farm page to `characters3d.html` timed out
after 30 s. Running that stage alone reproduced it.
- A probe showed the page itself loads in about 1.5 s, and in 4.7 s straight after one farm page. The time goes on
  *unloading* the heavy farm page, which gets slower after the two earlier viewports in the same browser on this 2-CPU,
  software-graphics container.
- No 7H file is involved, service workers are blocked in that harness, and the same stage passes in CI.
- Recorded as an environment-only observation (`evidence/full-farm3d-regression-run2-cow3d-timeout.log`), not hidden.

---

## Residual risks

1. **The owner check trusts the email claim.** Requiring `email_verified` would lock the owner out, because the game
   never verifies emails. Recommended: pin the owner by uid. That needs the owner's decision; it is documented by a test.
2. **Retries can bring up the farm chooser or a reload a few seconds into a visit** (another phone saved meanwhile).
   That is the same decision the game makes at launch, just later.
3. **The emulator is not production.** The 10-second Firestore timeout was reproduced on a deliberately slow page.
   Real-phone timing is untested until the phone smoke test, which has NOT been run.
4. **Unreadable copies are kept one at a time.** Only the first unreadable copy is kept. A second, different unreadable
   save on the same phone is not kept, by design, so the oldest evidence survives.
5. **Clients that never update.** Any client already in the field that never reloads keeps the old `auth.js` until the
   service worker updates it (`sa3d-v28`, `auth.js?v=13`).
6. **The local container can time out in the last regression stage.** The cow3d stage's navigation off a heavy 3D page
   can exceed 30 s here; CI passes it. If it ever shows up in CI, the fix belongs in that test's navigation (close the
   farm context before opening the preview), not in a longer timeout.
