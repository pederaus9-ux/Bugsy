# Phase 7M actual renderer evidence

Before serves accepted main `60021c4`; after is the combined hands/environment pass. These are real game captures, not generated concept art.

Capture profiles: 844x390 and 1280x720, DPR 1, hardware ANGLE D3D11 Chrome. Test farm; no account/network calls or player-save writes. Noon/golden/rain; overview yaw -.55, pitch .35, distance 32, target (0,1,5); Walk position (-1.4,22), yaw .7, pitch -.48. Crops repeat wheat/corn/carrot/tomato, fully grown. Same camera/field/weather; live animal poses/events/order notices can differ. All 12 after captures were visually inspected; these five paired views are curated.

Performance uses the unchanged optional performance7k browser script: 25 loaded-farm scenarios at 844x390 DPR2 and 1280x720 DPR1. Two-second samples and ten-second rain window run alone. Raw async GPU queries reject disjoint samples. Headless dispatch is not display FPS, phone acceptance, battery or thermal proof. The comparison retains a one-texture exception; do not call all resource windows stable.

The focused browser suite also tests idempotent environment installation, motion suppression, weather drift, layer disablement, six skin tones, hands/action reset, icon cap and 30 stable wardrobe changes. Current exact-head hosted results and owner acceptance are separate gates. Earlier attempts, rejected framings and the original cache-test failure remain preserved in local outputs.
