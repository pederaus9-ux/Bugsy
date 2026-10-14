# Isolated homestead preview — safe interim checkpoint

Owner approved Stage0 at2026-10-14 16:33 UTC, Sentinel_ff04cbff23a4819190aef9a670f2bd8a. Preview is in progress; parent explicitly requested this turn end with a concrete checkpoint for visibility. This is not cancellation or final owner art acceptance.

Runtime baseline: d5ed6a96c50914320f30a7b74b799b7f66a9b6e0; planning checkpoint: 70a1019046f88a0914d95d547f5fb15902e0f359; preview code: 3b4533e6a42a13cd218c1d4bbf2e133ee8c214f8 (initial smoke code47664b728b5aeafda19c79d295c86d4a045447a8). Dedicated branch codex/phase7n-homestead-renderer-preview. Production runtime and prior plan/audit/tests/evidence remain unchanged.

Implemented only five new files under previews/homestead-study/: cdp.cjs, served-page.cjs, probe.cjs, scene-study.js, run.cjs. Real Three renderer/composer, procedural 3D barn/farmhouse/workshops/fences/shelters/water/path/landscape, four fixed synthetic species pens and three10-plot groups. Default testfarm economic/crop state is preserved before/after fixture installation. Native animal construction creates the unchanged rigs at synthetic pen positions; no accepted animal-module edits or contact-anchor teleport are used. Model motion/navigation is not fully qualified by these stills.

[Actual screenshot gallery](evidence/phase7n-homestead-preview/GALLERY.md), [raw results/failure](evidence/phase7n-homestead-preview/review-attempt1/results.json), [checkpoint invariants and camera deltas](evidence/phase7n-homestead-preview/checkpoint-results.json).12 desktop before/after PNGs,4 incomplete mobile baseline PNGs,2 preserved initial smoke PNGs. Initial dark roads/framing were refined; smoke evidence remains untouched. Public repository visibility was read-only verified; anonymous image-link verification is a separate delivery step.

Fixed-quality failure: mobile844 Walk produced DPR1.7496 instead of2. The runner selected renderer Best but did not set G.PREFS.quality in its fresh synthetic preference. Production ultra() correctly consulted Auto on Walk entry; watchFrames adjusted scale. Treat this as fixture setup failure, not a demonstrated product defect. Set fresh synthetic preference toBest before boot, retain assertion and run only unfinished/invalid views. Do not count the mobile Walk timing as matched DPR2 evidence.

Preliminary warmed desktop1280×720 DPR1,5-second samples, asynchronous disjoint-checked GPU timer; zero disjoint rejects.

| View | CPU total p95 ms | GPU p95 ms | Full calls p95 |
|---|---:|---:|---:|
| full-farm-noon | 3.80 → 3.50 | 3.249 → 2.942 | 588 → 481 |
| courtyard-golden | 4.10 → 2.90 | 3.625 → 3.150 | 533 → 280 |
| walk-field-noon | 2.30 → 2.40 | 3.068 → 3.130 | 171 → 246 |

Field-Walk draw calls exceed the proposed24/5% incremental limit; relative layout visibility differs even at the same camera. No full budget/phone performance or release-readiness claim. Actual camera deltas are recorded in the gallery; collision-offset pairs require a common safe pose before claiming matching. The overview still puts the third field group close to the bottom edge. Paths/roofs are coarse procedural study surfaces, not accepted production assets. Farmhouse and proposed layout controls are explicitly nonfunctional; no farm migration or free-place editor implemented.

Isolation: loopback+testfarm+explicit harness token; new browser profiles/origins, farm-key writes throw, external requests intercepted, immutable production blobs with recorded served-copy hooks.65 inventoried runtime blobs equal published baseline. No real player saves read/written; captured initial storage empty and farm key absent. No Firebase writes, verified-economy switch, pricing/land entitlement/security/settings/installations/phone work or deployment.

Executor briefly rejected a status read with exec-server transport disconnected, then a retry succeeded. Saved files/code are on the existing connected PC; do not replace or delete the workspace.

Remaining authorized work: correct synthetic preference; finish mobile pairs and rain/snow/night/reduced-motion views; resolve camera offsets/framing; inspect all captures; complete resource/motion/isolation checks and matched performance reporting; publish/verify immutable Android PNG links and complete report/relay. Preserve existing desktop passes unless a distinct fixture or visual correction invalidates them. No new approval needed to resume this Stage0 scope after access is working; owner art/direction and later mechanics/migration/merge/publication gates remain separate.
