# Phase 7M — Visual makeover

Base: merged Phase 7L main `60021c47cf307f73764e11875a459720917bbc89`.
Branch: `chatgpt/phase7m-max-wow`.

## Owner direction

The owner approved a free-range style change when it materially increases the visual wow factor. The game should remain recognizably **Sunny Acres**, but the art pass is not required to preserve the exact pre-7M rendering style.

Two owner screenshots are the visual before-state gates:

1. **Overview:** red barn/silo, crop plots, fences, path, dense grass/flowers, trees, weather/event HUD and dock.
2. **First person:** yellow-sleeved hands, crop beds, soil, grass/flowers, fence, lantern, joystick and action controls.

The target is a lush, premium, storybook-cozy 3D farm: richer material separation, warm cinematic light, deliberate vegetation, charming ambient life, stronger close-range readability and a cleaner cohesive HUD. The owner-approved generated “MAX WOW” reference is an art-direction ceiling, not a promise of photorealism.

## Implementation strategy

The environment pass is isolated in `phase7m.js`, imported directly by the scene and installed once after farm construction. It is presentation-only and does not own gameplay state. It does not patch the renderer prototype or intercept unrelated scenes. Weather/fog transformations take the current preset as input, avoiding cumulative setter changes.

The layer currently adds:

- a warmer/deeper HUD skin without changing target sizes or layouts;
- subtle vignette/sun wash behind the HUD;
- bounded exposure/fog tuning that still follows the game’s weather/time presets;
- a small warm fill light for character/animal readability;
- richer standard-material highlight separation;
- instanced wildflowers around farm edges;
- instanced barn ivy;
- seven low-cost path/barn lanterns;
- eighteen lightweight ambient butterflies, static under reduced motion;
- subtle ground accents around the hero barn area.

`?visuallegacy` disables this environment/HUD layer. Sculpted hands, cultivated earth and nearby-marker improvements remain enabled; it is not a full pre-7M snapshot. The before evidence instead serves accepted main source with identical camera/field/weather fixtures.

The combined pass includes `scene-polish.js`: six-draw hands with separate fingers, cuffs and action curl/reset; deterministic cultivated earth/path relief; irregular soil mounds; restrained crop glints and a first-person nearby animal icon cap. See `PHASE7M_VISUAL_POLISH.md` for that scope and its evidence.

## Hard safety constraints

- No save schema or progression changes.
- No Firebase/auth/rules/economy/social changes.
- No animal AI, collision or interaction changes.
- No real-money behavior.
- Do not alter `/farm` or unrelated root app files.
- Mobile remains the primary target.
- Reduced Motion must suppress new ambient animation.
- Decorative objects must not become gameplay collision blockers.

## Performance budget

This pass uses instancing and avoids new shadow-casting point lights or per-frame allocations. There are nine additional drawable objects; total composer/shadow draw cost is measured rather than equated to that object count. Only one tiny position buffer updates for the ambient butterfly points when motion is enabled. These are stylized colored ambient points, not rebuilt animated butterfly characters.

Phase 7K remains the comparison baseline. Before merge, rerun the measured farm benchmark and compare mobile-sized/desktop CPU/GPU/resource evidence. Any sustained regression that threatens the established S26 60 FPS baseline blocks merge until corrected.

## Acceptance gates

1. Existing unit/browser/save/analytics/accessibility/Firebase-emulator suites remain green at the exact PR head.
2. New layer loads once by default and `?visuallegacy` disables the environment/HUD layer.
3. Overview screenshot is materially stronger in lighting, depth, farm-edge detail and visual hierarchy.
4. First-person screenshot is materially stronger in close-range crop/soil/vegetation readability without obscuring controls/interactions.
5. Reduced Motion leaves butterflies static.
6. Phase 7K benchmark comparison shows no unacceptable regression.
7. Owner specifically approves the tested PR and reviews actual renders; after approved deployment, verify live source and obtain the S26 visual/performance result. This phase remains open until that physical result is provided.

## Preserved failure

The original head `e934d16` failed the existing offline-shell test because the shell cached `phase7m.js` without a direct scene import. The full hosted failure log/artifact is retained locally. Direct import plus cache release 38 resolves the actual mismatch; the test and all existing thresholds/timeouts remain intact. The original prototype interception and exposure/fog property wrappers were replaced by explicit scene installation and pure preset transformations.
