# Phone pen editor menus: bounded acceptance

Owner's physical-phone report: after selecting a pen to move, the editor menus obscure the ground even though movement works. The supplied Library JPEG `libfile_5e834dbaa5cc8191b4cbed35ac225994` could not be inspected locally: the required Library helper downloaded it but failed at `os.setxattr` on Windows before materialization. No claim is made about the screenshot's pixels. Reproduce on a landscape phone viewport before edits and retain a RED image/measurement.

Acceptance, without changing geometry, care, saves, economy, or placement validation:

1. On phone landscape, selecting a movable pen item collapses the full editor and placement-guide panels. The selected item and ground guide remain visible. A compact dock retains reachable Apply, Cancel, and Options controls and shows the current validation status/reason. It does not cover most of the scene.
2. Options reopens the full selectors, move/fence/gate controls, guide and error details without changing the draft. Choosing another item or beginning a move returns to the compact view. Keyboard focus moves to a visible control on collapse/reopen.
3. Cancel discards the draft; valid Apply persists and reloads; invalid Apply remains disabled with an understandable reason. The original authoritative Apply check stays intact. Pointer/touch cancellation ends only the gesture, never silently applies or loses the draft.
4. Portrait phone orientation still exposes the compact controls and a way back to options. Desktop behavior stays usable. Existing seeds, limits, protected systems, and historical evidence remain unchanged.

Evidence will distinguish local Chromium phone emulation from the owner's physical device and the hosted private preview. Only focused UI checks are in scope.

## Retained RED before implementation

At 844×390 CSS pixels with touch-enabled local Chromium, selecting Horse → shelter left the editor panel visible at x12/y105, 360×273 and the placement-guide panel visible at x502/y12, 330×207.671875. The focused assertion failed: both panels visible, no compact dock. No page errors; only the Google Fonts stylesheet was requested externally. Exact screenshot and machine record: `red/selected-horse-844x390.png` and `.json`. The screenshot is local emulation evidence, not the owner's Library JPEG or physical-phone pixels.

## Focused local result

The `final-local` run passed in pinned Chromium 151 / Playwright 1.62.1 with the isolated preview. Selecting a Horse shelter at 844x390 hides both full panels and leaves the game/ground guide in view; the bottom dock retains selected item, validation reason, Options, Apply and Cancel. Options restores the original draft and full controls. A native nudge returns to the compact view. Cancel leaves saved revision 0 unchanged. A valid Cat nudge Applies from revision 0 to 1 and reloads as revision 1. An invalid overlapping nudge disables Apply, explains the overlap, and Cancel leaves revision 1 unchanged. A browser touchStart/move/touchCancel ends the gesture without applying or losing the draft. At 390x844, all dock buttons are in bounds and Options reopens. Dirty Escape exposes exit choices; Keep editing preserves the draft and focuses a visible selector. No page errors were recorded; the only external request was the font stylesheet. Exact machine records and real rendered local screenshots are under `final-local/`.

The game itself still shows its landscape-rotation prompt in portrait. This focused check establishes reachable controls beneath that prompt, not a portrait gameplay endorsement. The hosted private preview and owner's physical-phone retest remain separate gates. The existing care/shelter continuation failures and broader Task 7/8 qualification remain unresolved.
