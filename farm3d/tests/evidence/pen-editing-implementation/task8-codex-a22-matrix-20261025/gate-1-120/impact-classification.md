# Sheep4 water approach: unresolved functional-care failure

Original gate relocation, seed1/120Hz, third-night500-second deadline.45animals held overnight beds; Sheep4 (sheep:3) remained at[18.88222061548668,0,-29.508172965541007], drink/approach for sheep-drink-3, empty path, blocked counter0.7416667, label Heading to water. No browser exception. The original result, screenshot and trace remain untouched.

Concrete observation: this one sheep did not complete water/bed progression by the care deadline. The snapshot does not establish how long it occupied this particular position or whether it later recovers. Therefore it is not classified as minor, permanently stuck, or a proven geometry defect. Exact player frequency and subsequent recovery are unknown.

Read-only source trace: remaining-care-controller.js move() replans when path is empty/blocked and nextPlan allows, resets blocked after planning, then increments blocked on an empty result (lines81-84). Thus the subsecond blocked value does not prove a subsecond obstruction or successful route. Existing movement code cannot be assumed correct from its act=moving label.

Disposition: **OPEN_SHEEP_CARE_DIAGNOSIS**. Next finite question is whether the captured custom gate layout leaves a supported route from that exact root to sheep-drink-3, including current stationary actors and objects, and whether ordinary recovery executes it. Use retained installed geometry/task evidence and a bounded targeted diagnostic before any fix; no unchanged full-matrix rerun. No runtime edits or test weakening in this continuation.
