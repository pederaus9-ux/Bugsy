# Phase 7J — anonymous progress and performance reports

Release 36 adds filters and bounded anonymous summaries to `players.html`.
The existing lifetime milestone counts remain separate. The new panel is mounted
only after an owner-only presence read succeeds. Firestore still authorizes reads.
Sign-out discards in-flight results and clears the panel; failed reads offer retry.

## Data and limits

The existing event schema stays exactly `{e, d}`. Compact names encode release,
platform (Android/iOS/desktop/other), screen class (phone/tablet/desktop/unknown),
guest/account/unknown and a milestone or visit summary. Example:
`a2_36_apg_sess_00a` is a release-36 Android phone guest visit, under one minute,
with no observed error and an average of at least 60 rendered frames per second.
Names fit the existing 24-character rules restriction. No Firebase rules or
indexes change, and no production Firebase deployment is needed by this PR.

No UID, email, name, raw user agent, actual dimensions, location, farm contents,
URL, error text or stack is sent. Random document IDs identify individual reports,
not a browser or person. The queue is separate from farm saves (`sa3d-metrics-v2`).
It holds at most 48 reports, prunes reports older than 14 days and creates at most
40 new reports per UTC day per browser while local storage is available. These
are client safeguards, not server-enforced abuse prevention. The old milestone
reporter is retained for compatibility and is separate from this new cap.

Offline writes keep the same random document ID through retries. Existing rules
allow creates only: an uncertain success retried as an update is refused and
dropped, rather than duplicated. Transient failures retain the queue with a
60-second backoff. Connection, gameplay/milestone and page lifecycle events flush
the queue; there is no upload timer or per-frame network request. Storage and
random-ID failures are nonfatal. Sandbox `testfarm` and `shot` captures emit none.

## What the numbers mean

- Milestones: first observed harvest, regular/rush order, tutorial completion,
  selected levels and game open, once per release with persistent local storage.
  Existing accomplishments are not inferred retroactively from an old save.
- Day-1/day-7 returns: exactly 1 or 7 UTC calendar days after the first v2 gameplay
  observation on this browser. These are return reports, not cohort retention
  percentages or unique player counts. Clearing storage changes that observation.
- Sessions: foreground visit segments. Hiding/leaving the page reports a segment;
  resuming begins another. Auth gates, save recovery holds and the portrait rotate
  screen exclude paused time. Sign-in mode changes end the previous segment.
- Visit length: under 1, 1–4, 5–14, 15–29 and 30+ active minutes.
- FPS: average actual rendered intervals, bucketed into 60+, 45–59, 30–44 or below
  30. Fewer than five seconds of measured intervals reports insufficient data.
  No rolling arrays, sorting or network work occurs on each rendered frame.
- Errors: only an observed JavaScript error/unhandled rejection flag; startup
  error reports are separate. Abrupt OS/browser termination may never report.
  The dashboard explicitly says “no reported errors,” not universal crash-free
  reliability. This cannot identify native GPU/OS crashes or failed startup
  before analytics itself loads.

## Owner reads

7/30 days include today and use UTC dates; all-time has no lower date bound.
Queries use only the existing date index, descending, with document cursors.
Version and platform filters act locally on the loaded reports. Initial reads
request at most 250 event documents. More history is manual; at most 2,000 event
documents can be requested per mounted panel, including failed/superseded reads
and period changes. Legacy events count toward that read budget, but not toward
v2 results. Partial results and the read limit are visible; filter results are
never presented as population totals. Presence and earlier lifetime counts retain
their existing separate reads.

## Validation and remaining acceptance

Nine focused unit tests cover codec/privacy, bucket/date boundaries, dimensions,
milestone/release deduplication, exact return days, pause/error/end behavior,
offline retries, bounds/expiry/corrupt storage and filtered denominators. Browser
coverage uses the actual owner page at 390×844, 844×390 and 1280×720: filters,
pagination, stale responses, sign-out, denial, retry, read caps and 44px controls.
The real game is exercised with successful harvest/order hooks and sandbox
exclusion; SDK calls are isolated from production. Hosted emulator coverage
tests real rule compatibility, create-only retries, extra-field rejection and
owner date pagination. Existing core/animals/save/Firebase suites remain intact.

Three initial browser fixture attempts were preserved locally: undeclared
optional mock variables on the denied-page and sandbox checks, and waiting for guest mode in
the deliberately guest-disabled test farm. The assertions were corrected to
match those actual states; thresholds and timeouts were not relaxed.

Physical S26 Ultra acceptance and live owner sign-in/dashboard reads remain
owner tests after deployment. No headless result is called physical acceptance.
The CI results for the exact PR head are recorded in the PR and continuation
checkpoint; this document does not predeclare pending CI success.
