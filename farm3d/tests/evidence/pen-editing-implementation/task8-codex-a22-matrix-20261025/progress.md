# Current-runtime A22 care/wake matrix

24/30 PASS; 6 FAIL (3 severity-deferred, 3 classified open, 0 unclassified); 0 not run. Updated 2026-10-25T13:16:45.844Z. Source/harness hashes exactly match unchanged A22 runtime from1e7cd6a. Two earlier post-A22 cases carried forward without rerun; all older A18/A19/A20results remain historical.

Original46identities/unique bed slots, three nights,500sbed/departure and40scontinuouswake, paid/save/revision, containment andbrowsererror assertions retained. Programmatic validated/saved editor Apply, not new native pointer qualification. Test-only runner adds isolated process/log/status bookkeeping, no timeout/seed/oracle/runtime modification.

| Exact case | Result | Launch head | Three cycles: bed / departure / wake seconds |
|---|---|---|---|
| wholePen-1-30 | PASS | 4b8033e | 298.10 / 291.00 / 331.00; 288.63 / 314.20 / 354.20; 291.73 / 310.47 / 350.47 |
| wholePen-1-60 | PASS | bc31808 | 281.50 / 288.77 / 328.77; 297.62 / 317.37 / 357.37; 269.15 / 318.75 / 358.75 |
| wholePen-1-120 | PASS | 2f11383 | 270.09 / 281.99 / 321.99; 311.70 / 294.90 / 334.90; 293.77 / 300.07 / 340.07 |
| wholePen-4242-30 | PASS | 1e7cd6a | 287.70 / 296.67 / 336.67; 330.80 / 320.30 / 360.30; 324.10 / 303.20 / 343.20 |
| wholePen-4242-60 | PASS | 8633ff2 | 282.65 / 292.22 / 332.22; 301.40 / 296.13 / 336.13; 252.67 / 292.18 / 332.18 |
| wholePen-4242-120 | PASS | 2f11383 | 275.38 / 288.88 / 328.88; 294.20 / 297.93 / 337.93; 294.30 / 292.52 / 332.52 |
| assembly-1-30 | PASS | c5a6460 | 298.10 / 286.80 / 326.80; 295.07 / 310.37 / 350.37; 320.67 / 308.83 / 348.83 |
| assembly-1-60 | PASS | 8633ff2 | 281.50 / 287.15 / 327.15; 269.17 / 317.45 / 357.45; 263.30 / 294.95 / 334.95 |
| assembly-1-120 | PASS | c4d7805 | 267.63 / 287.25 / 327.25; 313.01 / 307.60 / 347.60; 310.89 / 296.97 / 336.97 |
| assembly-4242-30 | PASS | c5a6460 | 289.97 / 295.87 / 335.87; 277.50 / 303.30 / 343.30; 296.57 / 308.63 / 348.63 |
| assembly-4242-60 | PASS | 8633ff2 | 275.60 / 292.30 / 332.30; 302.83 / 309.63 / 349.63; 253.23 / 285.53 / 325.53 |
| assembly-4242-120 | FAIL / OPEN_NIGHT_TRAFFIC | 2f11383 | 275.38 / 290.66 / 330.66 |
| boundary-1-30 | FAIL / DEFERRED_RECOVERABLE_TRAFFIC | 4b8033e | 298.10 / 285.30 / 325.30; 287.37 / 280.43 / 320.43 |
| boundary-1-60 | FAIL / DEFERRED_RECOVERABLE_TRAFFIC | fd17920 | 281.50 / 287.40 / 327.40; 286.77 / 285.95 / 325.95 |
| boundary-1-120 | PASS | 4325863 | 277.99 / 287.06 / 327.06; 316.68 / 292.07 / 332.07; 255.10 / 312.37 / 352.37 |
| boundary-4242-30 | PASS | c5a6460 | 289.97 / 295.90 / 335.90; 309.27 / 304.23 / 344.23; 330.23 / 333.33 / 373.33 |
| boundary-4242-60 | PASS | fd17920 | 275.60 / 292.00 / 332.00; 317.60 / 302.02 / 342.02; 319.43 / 313.73 / 353.73 |
| boundary-4242-120 | FAIL / OPEN_NIGHT_TRAFFIC | 4325863 | 275.38 / 290.93 / 330.93; 279.48 / 290.15 / 330.15 |
| interior-1-30 | PASS | 4b8033e | 298.10 / 287.77 / 327.77; 302.30 / 302.23 / 342.23; 280.67 / 305.60 / 345.60 |
| interior-1-60 | PASS | fd17920 | 281.50 / 285.23 / 325.23; 301.88 / 299.63 / 339.63; 295.98 / 312.82 / 352.82 |
| interior-1-120 | PASS | 4325863 | 273.68 / 287.52 / 327.52; 302.36 / 295.59 / 335.59; 292.90 / 292.17 / 332.17 |
| interior-4242-30 | PASS | bc31808 | 289.97 / 296.20 / 336.20; 297.77 / 316.37 / 356.37; 272.37 / 336.17 / 376.17 |
| interior-4242-60 | PASS | dfb3220 | 275.60 / 294.15 / 334.15; 319.08 / 332.58 / 372.58; 301.47 / 305.77 / 345.77 |
| interior-4242-120 | PASS | 3e2fd3a | 270.83 / 295.37 / 335.37; 285.63 / 304.23 / 344.23; 321.63 / 321.08 / 361.08 |
| gate-1-30 | PASS | 1e7cd6a | 298.10 / 290.70 / 330.70; 299.47 / 286.87 / 326.87; 311.67 / 300.00 / 340.00 |
| gate-1-60 | PASS | dfb3220 | 284.98 / 288.30 / 328.30; 310.53 / 302.80 / 342.80; 279.63 / 285.73 / 325.73 |
| gate-1-120 | FAIL / OPEN_SHEEP_CARE_DIAGNOSIS | 3e2fd3a | 264.21 / 286.41 / 326.41; 269.94 / 307.94 / 347.94 |
| gate-4242-30 | PASS | bc31808 | 289.97 / 296.67 / 336.67; 330.80 / 320.30 / 360.30; 324.10 / 303.20 / 343.20 |
| gate-4242-60 | PASS | dfb3220 | 275.60 / 292.22 / 332.22; 301.40 / 296.13 / 336.13; 252.67 / 292.12 / 332.12 |
| gate-4242-120 | FAIL / DEFERRED_RECOVERABLE_TRAFFIC | 3e2fd3a | 275.38 / 289.68 / 329.68 |

Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes.

All owned cases finished at this checkpoint. Originalfailed evidence remains untouched. No fullskin/hoof/contact/continuous/phone-performance claims arise from this matrix. Rejected expensive collision experiments remain unintegrated.
