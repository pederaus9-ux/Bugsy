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

The first 7M pass is intentionally isolated in `phase7m.js` and loaded through the already-imported `features.js`. It is presentation-only and does not own gameplay state.

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

`?visuallegacy` disables the 7M layer for direct A/B comparison.

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

This pass uses instancing and avoids new shadow-casting point lights or per-frame allocations. The current target is roughly ten additional draw calls, with only one tiny position-buffer update for the butterfly points when motion is enabled.

Phase 7K remains the comparison baseline. Before merge, rerun the measured farm benchmark and compare mobile-sized/desktop CPU/GPU/resource evidence. Any sustained regression that threatens the established S26 60 FPS baseline blocks merge until corrected.

## Acceptance gates

1. Existing unit/browser/save/analytics/accessibility/Firebase-emulator suites remain green at the exact PR head.
2. New layer loads by default and `?visuallegacy` gives a clean before-state comparison.
3. Overview screenshot is materially stronger in lighting, depth, farm-edge detail and visual hierarchy.
4. First-person screenshot is materially stronger in close-range crop/soil/vegetation readability without obscuring controls/interactions.
5. Reduced Motion leaves butterflies static.
6. Phase 7K benchmark comparison shows no unacceptable regression.
7. Owner performs the final S26 visual/performance acceptance before merge.
