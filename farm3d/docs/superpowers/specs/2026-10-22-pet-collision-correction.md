# Bounded pet collision correction — owner authority and acceptance

Owner approval received after evidence checkpoint `6e3b40159347a99b7069e1eecc6495c2312c0ab9`:

> Assistant: Do you approve those narrowly scoped pet-movement changes? No terrain, path, animal-model, economy, or account changes.
> Owner: Yes.

Approved scope: ordinary dog/cat collision and pen projection in `index.html` (`Beast.update` and route handoff), and matching continuous care-controller/navigation corner checks. Preserve original roaming decisions, other species, speeds, body separation, solid fences, whole footprints, default/custom pen exclusion, rigs, economy, saves, auth and exact A1/A2 bytes. No merge/deploy authority. This explicitly resolves the previous controller-only scope blocker; it does not broaden any protected-byte registry.

Acceptance, recorded before the fix:

1. Reproduce seeds23/26/41/62/69 on exact checkpoint runtime, with the unchanged Beast body,15000 steps/500s per goal, three nights and1200-step/40s wakes; retain original RED separately.
2. Actual ordinary dog/cat movement at30/60/120Hz must not introduce building/fence/pen/animal penetration, including when steering or final projection pushes toward a blocked point. No teleport or increased displacement. A blocked route has no direct-through-obstacle fallback.
3. Retained corner62/69 must plan and physically reach the original care goal within500s at30/60/120Hz; every physical step respects the point predicate and continuous full-clearance geometry. Cover default convex mitered and customized concave/radial boundaries without relaxing either.
4. Negative controls reject the0.5m barn/fence gap, new footprint penetration, closed fences/pens and occupied segments; retain the proven seed41 cage as an impossible escape. Fix the ordinary source of the invalid position, not its clearance.
5. Run original seeds4242/1 and full diagnostic2–81 with every original assertion, seed and deadline unchanged. New guard checks supplement existing tests. Run all original core Node suites, index consumers, protected-byte/default-render checks, versions and targeted care/geometry regressions. Preserve all failed attempts.
6. Record changed files, source/head, evidence, resource/runtime limits, and update relays at a clean checkpoint. Local Node/browser evidence is not hosted CI or physical-device clearance. Real game preview and owner visual approval remain later Task7/8 gates.

No new index.html digest is substituted into an existing lock: that file already has scoped pen adapters and is not in the protected-byte fixture. This document records the new ordinary-pet exception. All twenty pinned protected files and six registered reviewed adapters retain their current hashes. Final patch self-review must verify the exception's exact scope.
