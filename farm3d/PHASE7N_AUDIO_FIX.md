# Phase 7N background-audio fix candidate, 2026-10-14

**Reviewed candidate passes local native audio checks and all eight exact-head hosted jobs. Owner merge approval is still required. No merge, deployment or release authorized.**

Frozen review receipt for [draft PR81](https://github.com/pederaus9-ux/Bugsy/pull/81):
reviewed candidate `e92a1ba40b53e8340f7d19c649e9a777d742ad28`, tree
`fbbac30554c58a2153e79495723084701cc4e4ba`. This completed report/CI receipt is
saved on a separate evidence branch so the tested PR head remains unchanged.

## Exact source and scope

- Owner approved applying/testing the proposed background-audio correction at 2026-10-14 10:40:41 UTC.
- Base checkpoint: `7ff71d8ffbc83ce5fd0f7b4f0a26282609eaba23`. Integrated main at preflight remains `a183e17b1a0a4f855d704da2ee8e5bc0187eed46`; both remote refs and the clean connected executor were verified.
- Committed implementation/local test source: `758c9017a70c0aebae11e8c4b4bf4a206907a2ce`. Dedicated candidate branch `codex/phase7n-audio-fix`; reviewed PR head above has identical runtime/test bytes to that local test source. Evidence branch: `codex/phase7n-audio-fix-review`.
- Only runtime change: two lines in `game.js`. The shared master gain is `0.55` only when `snd.on` and the document is visible; a native `visibilitychange` listener reapplies that gate. Saved sound/category preferences, context creation/resume, autoplay/gesture behavior, source scheduling, schemas, economy, auth/cloud, animals and renderer are otherwise unchanged.
- The listener does not create an AudioContext or write preferences. Returning restores output only if the user's sound preference is on; returning while muted remains silent. The native context can remain running while hidden; this fix silences its output and makes no claim of eliminating background audio CPU work.

## Preserved failure and unchanged assertions

The [original qualification](PHASE7N_AUDIO_QUALIFICATION.md) and all its receipts remain untouched. It recorded nine passes and a native hidden-tab output failure, including 20 nonzero PCM windows across roughly ten seconds. Its [confirmed reproduction](tests/evidence/phase7n-audio/background-confirmed.json), initial float32 fixture failure and missed-control diagnostic retain their original statuses.

The existing `qualification-audio.browser.cjs`, `qualification-audio-background.browser.cjs`, native probe and CDP harness are byte-for-byte unchanged in Git. The original full suite was rerun with `QUALIFICATION_REF` pointing at the committed fix. The separate new `qualification-audio-fix-background.browser.cjs` retains the old native-tab flow, sample counts and bounds; it asserts the existing silence threshold `<1e-6`, positive visible/return output `>1e-4`, trusted native visibility events, running native context/audio clock, and adds muted-return/preference preservation checks. The old diagnostic deliberately asserts that the defect exists and remains preserved as a failure reproducer, rather than rewriting its historical evidence to PASS.

## Local results actually run

| Check | Result / evidence |
| --- | --- |
| Original native audio suite | **10/10 groups PASS**, [raw receipt](tests/evidence/phase7n-audio-fix/original-audio-suite.json). Normal boot before gesture; autoplay suspension; trusted input and effect PCM; master mute; muted reload; music category; injected native suspend/gesture resume; category reload; ambient PCM; actual native background/return all pass. |
| Ten-second native hidden/return/mute regression | **PASS**, [raw receipt](tests/evidence/phase7n-audio-fix/background-regression.json). All 20 hidden windows have RMS **0** and master gain zero. Unmuted actual return has positive PCM (maximum RMS **0.0144458**); muted hidden and muted actual return each have maximum RMS **0**. The stored `on=true` preference is preserved during the unmuted hidden interval, and `on=false` is preserved through muted return. |
| Syntax / whitespace / exact patch scope | **PASS**. `node --check` for game/new fixture; `git diff --check`; runtime source equals the prior source after exactly the proposed master-gain replacement and listener insertion. |
| Source integrity | **PASS**, [invariant receipt](tests/evidence/phase7n-audio-fix/invariants.json). Of 65 inventoried runtime files, **64 remain exact baseline Git bytes; only `game.js` intentionally differs**. Original tests/probes/fixtures and all prior frozen evidence remain unchanged. The one file's non-audio contents are preserved by exact whole-file comparison against the expected two-line edit. |

Commands:

```powershell
node --check farm3d/game.js
node --check farm3d/tests/qualification-audio-fix-background.browser.cjs
$env:QUALIFICATION_REF = '758c9017a70c0aebae11e8c4b4bf4a206907a2ce'
node farm3d/tests/qualification-audio.browser.cjs
node farm3d/tests/qualification-audio-fix-background.browser.cjs
git diff --check
```

Each run used its own disposable Chrome profile and artifact directory, immutable localhost Git bytes, isolated guest data and intercepted external endpoints. Installed Chrome 155.0.8059.40 / Node v24.19.0; no local dependency installation or personal browser profile. PCM is measured via the parallel native analyser with the original destination graph preserved. Actual browser tab transitions have trusted native events; no visibility getter/event was simulated. Explicit AudioContext suspension remains an injected native-state test. No audible quality, phone/Safari, OS process eviction, sustained performance or CPU-power claim.

## Exact-head hosted validation and review

[Regression202](https://github.com/pederaus9-ux/Bugsy/actions/runs/38552464056), attempt 1, completed **7/7 jobs SUCCESS** on exact head `e92a1ba40b53e8340f7d19c649e9a777d742ad28`. [Conflict qualification2](https://github.com/pederaus9-ux/Bugsy/actions/runs/38552463831), attempt 1, completed **SUCCESS** on the same head. No jobs were retried. Core logs confirm all 33 Node files/five browser suites; backend logs confirm recovery and actual SDK/blocked-storage boot; conflict logs confirm both choices with stale-upload refusal and byte-exact backup retention.

The Actions checkout `f4581eb328635e6ab6d1f5e46590c2d736e29a15` has the identical `fbbac30554c58a2153e79495723084701cc4e4ba` tree as the reviewed candidate. [Raw metadata/steps/tree proof](tests/evidence/phase7n-audio-fix/hosted-ci.json) and [qualified log excerpts](tests/evidence/phase7n-audio-fix/hosted-log-excerpts.json) are frozen. Workflows, dependencies, job limits and tests are unchanged. Their normal isolated runner setup is separate from installations on this PC. No deploy workflow or production write was performed. This is fresh candidate qualification, not credit borrowed from old-main CI.

Adversarial self-review checked the full diff and adjacent cases: hidden context not yet created, autoplay-suspended context, normal unmuted visibility restoration, mute changes, persisted settings and repeated native transitions. The two-line gate does not create/resume contexts, change preferences or register per-start duplicate listeners. The module-level listener is installed once on module evaluation. No unrelated production fix or weakened criterion is included. This is ChatGPT/Codex self-review, not an independent external-agent audit.

The candidate carries forward earlier unmerged documentation/test qualification checkpoints as history, not extra runtime work. Old 65/65 runtime identity claims remain historical receipts for their original source. This candidate explicitly records 64/65 plus the approved audio-only exception; accepted animal geometry/motion remains unchanged.

## Approval and relay handoff

- Agent: ChatGPT/Codex.
- Phase: 7N bounded background-audio remediation.
- Base: `7ff71d8ffbc83ce5fd0f7b4f0a26282609eaba23`; local runtime/test head `758c9017a70c0aebae11e8c4b4bf4a206907a2ce`; exact reviewed head `e92a1ba40b53e8340f7d19c649e9a777d742ad28`. Evidence commit is separate and is not presented as the CI-tested PR head.
- Branch / PR: `codex/phase7n-audio-fix`, [PR81](https://github.com/pederaus9-ux/Bugsy/pull/81) remains **draft**; frozen review branch `codex/phase7n-audio-fix-review`.
- Scope: exact approved two-line runtime correction, new focused regression and truthful source-integrity/report/relay updates.
- Tests: local 10/10 original audio plus native ten-second/return/muted regression PASS; exact-head Regression202 all7 and conflict qualification2 PASS, attempt1, no retries.
- Evidence: `farm3d/tests/evidence/phase7n-audio-fix/`; original failures and all earlier accepted evidence frozen.
- Limits: headless native graph/Chrome lifecycle only; broader release gates remain open. No owner phone repeat requested/performed.
- Protected systems: 64 inventoried runtime files unchanged; game.js changed only as approved; original tests/evidence, production data/security, other projects and FS25 preserved.
- Recommendation: bounded audio candidate READY FOR OWNER REVIEW, no material self-review finding remains; keep draft and unmerged. Release remains NOT READY with broader evidence gates open.
- Remaining approval gate: **owner approval to merge this exact reviewed candidate**; deployment/release require separate approval. No merge, deployment or release performed.
