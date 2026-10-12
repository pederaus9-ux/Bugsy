# Settings Motion flash — bounded repair

Owner reproduction: while Settings is open, tap any Motion preference (Use device setting / Reduced motion / Full motion). Owner reports a whole-screen flash on each selection and supplied13645.jpg. A still image shows the setting but cannot itself demonstrate the temporal flash.

Branch: `codex/settings-motion-flash`.
Base: `b111d421f628db30af0bbcdee1bc883c816f33a0`, retaining the locally validated R8 result-cache candidate. Main independently re-fetched unchanged at `205b25db0aab877aa6cf9a40adcbc766640c78cf` before this edit.

## Cause and change

The motion handler called renderPanel(), which replaced the entire scrim/dialog/body. The panel CSS starts its opacity/scale opening animation on each new element. Changing the global reduced-motion CSS back to full can also revive that animation on an existing panel.

Repair only the motion handler in game.js: retain the open panel, disable its entrance animation before changing the motion preference, and update the three button classes and aria-pressed values in place. Existing savePrefs()/syncMotion() behavior is preserved. Initial opening animation remains available on newly opened panels. Scroll and focus remain on the original controls.

No horse code, renderer, graphics quality, speed, collision, other animal, farm-save schema, account/cloud/economy or service-worker change. Motion-preference storage continues using its existing local preference record.

## Verification

New settings-motion.browser.cjs executes the real settings handler/CSS in the existing snapshot test-farm fixture. At780x360, it selects seven options per device-motion state (no-preference and reduce),14 clicks total. It checks original scrim/dialog/body identity, unchanged scroll, control focus, no restarted panel animation, selected styling, aria-pressed, persisted preference and resolved root motion attribute; browser errors must be empty.

- Original game.js baseline: FAIL, "motion selection preserves the existing overlay", first full-motion selection. No baseline production files edited.
- Fixed candidate: PASS for both device-motion states; process exit0.
- git diff --check and game.js/test-script syntax checks PASS before packaging.

The browser result proves the identified panel-replacement/animation defect is corrected in this fixture. It is not direct confirmation that all possible phone flicker is gone. Owner must repeat the exact setting switches in the updated authentic private preview. Existing broader browser failures remain separately recorded; no test thresholds or timeouts were loosened.

## Integration

No Bugsy push, hosted CI dispatch or merge authorized/performed. Private phone preview may be updated for owner validation. Keep this bounded UI repair independently reviewable from the horse planner. If phone flashing persists, obtain motion recording and investigate compositor behavior instead of changing graphics quality blindly.

Private deployment SUCCEEDED, Site source `bbe9c50a7d97cc24c231758d6bcae7c27109e7a2`, matching candidate `e565ac4a8f578952cf36f4f654644fcaaacea130`. All405 tracked farm files compared byte-identical before packaging. Saved version `appgprj_6acb7e64bc90819187da2ab652acbb37~appgver_bf3fa668477881918be3880a351af406`; deployment `appgdep_6acc24bb3e908191a1961abd8db39f6c`. Existing owner-only audience preserved.

Phone review: https://sunny-acres-horse-r8-review.ardentanole10.chatgpt.site/farm3d/?testfarm&perf

Reload before repeating all three Motion choices. Owner confirmation that the visible flash is gone remains pending. game.js retains its existing query key to keep the unchanged service-worker precache contract; that worker serves application code network-first, so a fresh online navigation fetches the updated handler. Service worker and loader files were not modified.

## Owner acceptance

Owner replied "Fixed" after testing the updated preview (2026-10-11 19:15:42 America/Chicago). The reported Settings Motion flash is owner-confirmed fixed. This acceptance is limited to that defect; it does not authorize merging or clear the remaining broader browser/device/release gates.
