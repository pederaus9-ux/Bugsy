# Sunny Acres isolated player preview

[Eight-second before/after clip](player-before-after.webm) · [Gallery and original movement clips](GALLERY.md)

The isolated correction lowers resting forearms and adds opposite walk/run arm swing using existing distance-driven gait. Native action clips, customization, controls, camera, speeds and accepted animal rigs remain unchanged. Same character geometry/asset; appearance acceptance is pending. No live-game merge or deployment.

Runtime d5ed6a96c50914320f30a7b74b799b7f66a9b6e0; tested player overlay08a1b8a93f6cd081306b6df5e3bda357dd7d8889; saved implementation checkpoint8d38a7e59e6902dfd0553316dfdbb18c20209e8b; moving validation539770265d32745a83d3324b7308da4f4bfc7e7b and performance145a36b32072e4e3539455605ef11d68e5a29c75 (complete commit identities are in manifest.json).

Final desktop/mobile preservation checks34/34 PASS. Native actions, turn controls, skin/shirt customization, unavailable-authored fallback, reduced motion and fresh-save guards pass. The earlier exact still-arm reduced-motion assertion failed after action blending; its diagnostic was retained, endpoint settling corrected, and the unchanged assertion passed on both final profiles.

Moving/action geometry12/12 case pairs PASS:744 recorded native poses and2976 weighted-mesh snapshots,0 added near-plane crossings; camera paths match exactly. On/off toggles during moving poses leave body, feet, camera, walk and game state unchanged. No new absolute foot-contact, arbitrary self-intersection, physical-phone or sustained frame-time acceptance is claimed.

Performance remains open: warmed native full-frame CPU/GPU passes5/12 cases;7 exceed the unchanged5% limits. Calls/triangles pass12/12. Some failures also occur with hands hidden in third-person. Live actor/cache state is not an exact cloned snapshot, so the failures are retained without proven attribution to the hands overlay. Two mobile resource-count changes remain unqualified. No gate waiver.

| Profile / mode / case | CPU p95 ms before → after | GPU p95 ms before → after | All gates |
|---|---:|---:|---|
| desktop / first-person / idle | 6.30 → 6.20 | 3.743 → 3.940 | FAIL |
| desktop / first-person / walk | 3.50 → 3.50 | 2.899 → 3.232 | FAIL |
| desktop / first-person / run | 3.70 → 5.00 | 3.283 → 3.045 | FAIL |
| desktop / first-person / actions | 6.10 → 9.10 | 3.028 → 3.318 | FAIL |
| desktop / third-person / walk | 3.40 → 3.90 | 3.003 → 3.250 | FAIL |
| desktop / third-person / run | 3.50 → 3.60 | 3.460 → 3.182 | PASS |
| mobile844 / first-person / idle | 6.30 → 6.40 | 3.351 → 3.837 | FAIL |
| mobile844 / first-person / walk | 5.20 → 3.60 | 3.285 → 3.219 | PASS |
| mobile844 / first-person / run | 7.80 → 3.50 | 3.559 → 3.037 | PASS |
| mobile844 / first-person / actions | 8.70 → 8.40 | 3.587 → 3.167 | PASS |
| mobile844 / third-person / walk | 4.40 → 6.00 | 3.468 → 3.672 | FAIL |
| mobile844 / third-person / run | 3.70 → 3.70 | 3.382 → 3.435 | PASS |

Recorded native canvas footage excludes HUD/audio. The portrait comparison is840×848, about2.76MB: rest2s, walk/stop3s, run/stop3s. Existing source clips are rescaled and labeled; no interpolated character animation or new gameplay/device test. Static images include synthetic game UI. All footage uses fresh isolated test data.

All65 production runtime files and prior frozen evidence remain unchanged. The separate homestead horse-view CPU/draw gate remains unresolved. No real saves, credentials, private machine/profile paths or personal account UI are in this publication. Owner authorized sharing this character footage/report on2026-10-14; visual, performance, integration and release acceptance remain separate.
