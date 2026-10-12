# Sheep capture reset correction

Base main9245b95062fe3dec6ea6a2a6376f675377bc9d08. Owner approved the merged sheep stopping change (Approve,2026-10-12 00:55:50 America/Chicago). No device model, session duration or measured phone performance supplied.

Postmerge regression184 (38202494722) failed1/7jobs:Six-species visual job114658711651, page.evaluate:Error:sheep capture world contact error. All11sheep Node tests and isolated54pose gallery/render budget passed in that job before actual-farm staging failed; six other jobs passed. Production tree77b5c7f836c5aaa5aab5eeba2e62686fb67e0401 is identical to premerge tested tree. Pages deployed successfully.

Failure artifact11725634360 SHA256baf7b01bd15c20282d3cd29c3ea91e701b744678deb3bf6a17c6cb99b51fd2ac. No unchanged reruns performed.

Reproduction: create sheep1.2 at(6,-2);walk0.78m/s1second;idle1frame to create recovery; copy original neutral staging(root0,z14,modelyaw0,statephase0,clearplantedflags);idle24frames and recenter. Foot-target error17090.6–17419.6mm because old recovery world targets survive the teleport. Actual farm travel can finish moving or idle, so the same source tree follows different fixture initialization paths. This is a test-state reset defect; no production rig correction proposed.

Test-only resetSheepEvidencePose clears active recovery and animation amount/phase, places root/model, clears planted flags and initializes neutral legs through the existing idle updater. Both isolated and actual-farm sheep staging use it. Articulated pose translation and every original2mmcontact assertion remain. New negative control captures the old stale-cache failure; reset test checks neutral feet against fresh rigs at0.9/1.2 and subsequent movement/recentering contacts.14/14selectedsheeptests passed; syntax/diffchecks pass. New exact-head hosted browser validation pending. Production files unchanged. Owner approval retained; no new merge authorization presumed.
