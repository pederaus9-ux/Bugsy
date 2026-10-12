# Dog face correction preflight

Main:ae30cc0c2dcf43145654de6bc7ce5413b807bb5e.
PR76 parent:7097ca1ae3e6e8d6e6ac66f52ef4d24ffe4428ec (regression1877/7,art643/3).
Local worktree/branch:codex/dog-face-correction;owner:ChatGPT/Codex.
Owner authorized head correction before merge:yes,2026-10-12T07:12:50-05:00.
Previous motion capture approval andstop/restart gameplay acceptance apply to
parent7097ca1. New face must be rendered and owner reviewed;no merge authorized.

Source cause:shared geometry builder places two small nostril ovals on every
quadruped's broad pale muzzle. Actual owner photos14397/14399 show pig-like nose.
Correct dog head geometry only:single central black nose,narrower forward muzzle,
visible mouth andlower jaw. Shared build has a dog-only branch;its gait updater,
all rest bones/specs,dog3d.js contact correction andallotheranimalgeometry remain
unchanged. No whole-dog anatomy rewrite or art-style change.

Edit targets:quadruped3d.js dog head surfaces only;new dog-face tests/baseline;
core runner andnew close-up capture support;relay/review records.
Protected:all non-head dog geometry/skin weights/rest bones;otheranimal meshes;
updateQuadruped/dog3d.js movement;gameplay/speeds/collision;saves/cloud/auth/economy;
public exports/interfaces;serviceworker;previous accepted/frozen evidence.

Proof:actual skinned bind vertices have one centered black nose intersecting
muzzle,forward narrowed muzzle,mouth andjaw;allprotected mesh attributes andrest
bones match frozen7097checksums. Existing contact/sole/continuity tests unchanged.
Hosted fullregression andreal front/side/three-quarter closeups with old/new exact
head references;owner acceptance of new face before merge.

## Local candidate evidence

Face-identity test fails onparent7097 (singleblacknose absent),then passes with
new head geometry. All49selected tests pass,including protected mesh/rest hashes,
actual triangle attachment checks,existing dog stop/restart/staging,andunchanged
sheep/species/live/version checks. No existing threshold is changed.
New capture keeps33motion/rest views andadds3focused face views withindividual
PNG files;head framing usesactual head/ear vertices,whileexisting full-body
framing and0.98limit remain unchanged. Local browser unavailable;hosted renders
required before visual claims. Previous approved renders are frozen separately.

All4original six-species geometry/contact/cadence assertions also pass in
isolated processes. Geometry grows3360→3704triangles (+344);same20bones,one
skinned mesh andmaterial. No per-frame geometry work ormotion changes added.
Phone performance impact is not measured;hosted rendering budgets remain intact.
