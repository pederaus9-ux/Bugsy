# Amendment A3: bounded cow turn release

Owner authorization received through the parent delegation on 2026-10-23.

> Assistant: Needs your attention: may I change only the cow’s heading and hoof-release/recovery logic in cow3d.js? Its appearance, joint solver, gait constants, and collision limits will stay unchanged. The risk is affecting accepted turning/contact behavior, so the original motion tests and real previews remain required.
> User: Okay

The parent explicitly restricts this exception to farm3d/cow3d.js::updateCow3D heading and hoof reach/release/recovery logic, original lines 259–290 at 9db7d6d8424cf008926106aa3ceb5bc060a138a4. All other bytes remain protected, including buildTemplate, poseCowLeg, COW_GAIT, face/tail behavior, solver, skin, anatomy, collision, terrain/path and paid/account/save systems. This does not authorize a broad animation rewrite, weaker tests, merge, deployment or visual approval. Validator roaming discrepancy is separate and deferred.

Frozen predecessor SHA256: 4d6c180cc70b8695a7e47ca792d7ddaf9311b9987b8ea34ad6a1e3821db87e44. The exact reviewed successor digest will be registered through animal-pen-authorized-adapters.json after the candidate satisfies this checkpoint's acceptance. Existing protected fixture stays frozen. Negative lock controls must reject further edits and any expansion beyond the approved block.

Evidence and acceptance: tests/evidence/pen-editing-implementation/task7-codex-cow-turn-fix-20261023/progress.md. Real rendered local browser evidence remains separate from hosted qualification, physical devices, final owner visual acceptance and engineering readiness.

Reviewed candidate SHA256: 2d0be792fa13d5a12eb9dd48e011d5d74557e943df580cdb70e7538eb4e3fb01. The registry also pins SHA256 of every byte before the allowed block and from the unchanged B13 face/tail section onward. Six negative controls execute the real production lock test against in-memory alterations, including excluded solver/face changes even with a replaced whole-file digest.
