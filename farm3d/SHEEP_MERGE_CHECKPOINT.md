# Sheep engineering merge checkpoint

PR74 merged by explicit owner instruction (2026-10-11 23:04:44 America/Chicago). Main9245b95062fe3dec6ea6a2a6376f675377bc9d08. Reviewedhead724021d4a9b9c130ff983e345915bc28cd832360. Main tree77b5c7f836c5aaa5aab5eeba2e62686fb67e0401 matches the exact tested/reviewed source tree.

Premerge regression183 (38199312717):7/7SUCCESS. ArtCandidate63 (38199312704):SUCCESS. Artifact11724853452 digest6b4ebb732b624c5c07aba5b2feb26c66005a7174e94aa870d6eda2438070ccdd verified. Actual15-viewidle/walk/stop sheet inspected; no cropped geometry or visible first-stop foot snap; no browsererrors; horizontal contact residual1.8874e-12mm; allfourhooves landed bystopframe40. Local31selectedtests passed, including48stop/restart/teleport scenarios and12turn-stop cases.

Production change is sheep3d.js only. Geometry/restdefinitions and shared solver, horse/cow, speeds/collision, cloud/saves/economy, renderer and serviceworker are unchanged. Node benchmark:stopped6sheep cost~0.020ms vs~0.0105ms before; device cost unknown. No externalagent audit; implementation+selfreview byChatGPT.

Postmerge regression38202494722 andPages38202494120 active at checkpoint. Owner phone/gameplay acceptance and broader sheep anatomy/style acceptance remain unverified. Engineering merge does not close full sheep quality or release gates. Next:verifydeployment andmainregression, then actualphone review. This documentation-only checkpoint branch is not separately merged; carry current evidence into the next authorized phase PR without changing qualified runtime.
