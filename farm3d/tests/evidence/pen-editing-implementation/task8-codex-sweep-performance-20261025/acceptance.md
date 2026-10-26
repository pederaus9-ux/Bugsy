# Finite swept-query performance step

Baseline: 525cdccf4afc52346603aaa0802498fb31204472. Test-only changes; runtime integration remains held.

1. Profile the existing evolving near-fixture stress before optimizing. Preserve raw profile/results and identify actual dominant operations.
2. Change only measured traversal/allocation/cache overhead. Keep original interval bounds, outward guard, root padding, complete triangle coverage, cache invalidation and uncertainty/refinement behavior. No geometry/fidelity or accepted-test changes.
3. Compare baseline and candidate on the same capacity-valid five-cow fixture (two feed docks, drink, robot and a separate free supported cow). Check distinct station occupancy, >=0.85m root separation and actual query clearance. This is a cost fixture, not live-herd qualification.
4. Report complete query median/p95/worst, allocation/retained-memory observations and cost exclusions. Separate Node/desktop from browser/phone. Compare with documented project performance requirements; do not invent a new release budget.
5. Recheck affected 21 controls and 11 containment cases. If numerical/traversal predicates change, verify directly affected successful route/contact cases with unchanged limits. Preserve failures; no blind retries. End at a clean local checkpoint, no upload/Site/merge/deployment.
