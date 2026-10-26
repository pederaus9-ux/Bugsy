# Narrow occupied-shelter translation oracle approval

Owner authority supplied by the parent on 2026-10-23, for the exact proposal at `7a70284c40393104c57893d363e72d878c7304ed`.

Assistant message `Sentinel_b420260fa1908191b46ac77d1548a11d`:

> One test needs your approval to correct its measurement. Moving the occupied shelter triggers a tiny rounding mismatch in the cow model’s stored animation weights, not a detected pose change.
>
> I recommend accounting for those existing weights while keeping the same strict tolerance and adding checks that catch real movement errors. No game-model changes or relaxed limits. Approve this specific test correction?

Owner message `Sentinel_e4aaec0169f481919797e56dffaa37f6`:

> Sounds good

Approved correction only: for each immediate occupied-shelter skin vertex, expected movement equals the commanded support/root movement multiplied by the sum of that vertex's original pre-Apply stored weights. Keep the strict `1e-8 m` tolerance. Freeze command and weight expectations before Apply; independently require root translation at `1e-8 m` and exact unchanged local pose, rig state, orientation, scale and weights. Keep all other physical/contact/reservation/paid-state/deadline assertions. Re-run all seven deliberately corrupted controls. Preserve the two historical native REDs and their executed sources.

This does not authorize any rig, runtime, default-movement, tolerance, seed or deadline change, nor general test relaxation. No merge/deployment or wider visual approval. The next authorized action is the same coordinated occupied-shelter native journey through continuation, wake/release, reload46 and applicable 30/60/120 Hz qualification; a new unrelated failure must be retained and diagnosed without weakening its check.
