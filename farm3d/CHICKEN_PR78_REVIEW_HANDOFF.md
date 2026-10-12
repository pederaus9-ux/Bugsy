# Sunny Acres — AI_RELAY handoff

Agent: ChatGPT/Codex, sole implementer and self-reviewer.
Task: Chicken coordinated motion repair; ready for owner device review.
Base main: `d87658e3ee97f0dabc372f4cbaf8c99a8d36e65d`.
Tested PR78 head: `935f6d2ffb2349f1de0ccbd2da98185f00470813`.
Tested tree: `0643a15bc0a7144d3ca1e2dcd8e40a262e62f6fb`.
Implementation branch: `codex/chicken-coordinated-motion`.
PR: https://github.com/pederaus9-ux/Bugsy/pull/78 — draft, unmerged.
This checkpoint: `codex/chicken-pr78-review-evidence`; runtime code unchanged from tested candidate.

## Verified

One chicken-specific controller owns support, swing, landing, stopping, restart and reset. Both hips remain attached to one body-height adjustment. Common120Hz planning normalizes physical feet at30/60/120Hz and handles the real0.1second frame cap without changing the public gameplay root. Geometry, skin buffers and factory rest transforms match frozen main.

Local:40selected checks, four original six-species assertions,96turn cells,45seeded sessions/900simulated seconds,96additional long-frame stop/restart cases passed. Original thresholds are unchanged. No remaining failure is known in these tested cases; this does not prove every possible input.

Hosted regression195/run38321403461:7/7SUCCESS on the tested head. Art70/run38321403465:3/3SUCCESS on that head. Older1d98ec9/9a0b138 results are superseded.

Node CPU: six rigs, seven alternating samples after warm-up, median1.680microseconds per update versus1.042on main,1.612x. Resources/geometry unchanged; vectors and states reused. This is not a phone measurement.

Actual skinned-body probes:2,520thigh origins remain inside torso triangles, minimum4.983mm clearance. Abrupt roaming can lower the common body0.123641local units; deepest-crouch seed403,h0.72,30Hz,t15.810738s actual leg mesh minimum-1.449mm, within2mm tolerance. Running retains support rather than adding intentional flight. Crouch/cadence need owner judgement.

## Authentic visual evidence

Artifact11779735112 from regression195, ZIP SHA256`cbf8265234cf86eeee22295a1b85b5a55372fbf172017bcb048f34af367ae04d`; full ZIP expires2026-10-19. Selected untouched PNGs and metrics are frozen under`tests/evidence/chicken-pr78-195/` on this checkpoint branch.

The48-pose gallery covers rest front/side/rear, face, continuous walk/stop/restart/run/run-stop,90degree turn and180degree reversal. Nonuniform run samples show distinct poses. Actual farm views inspected. Maximum capture contact error9.930e-16m, browser errors0. This is ChatGPT inspection, not owner acceptance or an independent external-agent audit.

## Phone preview and unknowns

https://sunny-acres-chicken-pr78-review.ardentanole10.chatgpt.site/farm3d/?testfarm&debug&preset=noon

Owner-private deployment succeeded. Source commit`83aa396600fc520764f1e18d2c35b29037bd2e9a`;453tracked farm3d files byte-identical to the tested head. Project`appgprj_6acd61ca7e6081918a39490e9cdbf4b9`, deployment`appgdep_6acd6c084ac48191a6ff2547fc3ea189`. Test farm: nothing saved. Managed local browser-origin QA unavailable; hosted exact-code browser qualification and native deployment verification are recorded separately.

Owner visual/gameplay/device acceptance and phone performance are unknown/pending. No merge or release approval. Release-wide long-session/device qualification remains separate.

## Exact next action and boundaries

Owner authorized the coordinated repair (“Repair it”), not merge. Ask for review of walking, running, turning, stopping, posture and smoothness in this exact preview. Record the decision and scope. If accepted, obtain explicit merge authorization, re-fetch main/PRhead and all exact-head checks, then integrate only the reviewed candidate. If rejected, pin the observed defect and correct it within scope; never weaken tests or advance automatically.

Main remainsd87658e. PR78 head remains935f6d2. This evidence branch updates notes/images only and is not a competing code candidate. Protected: shared updater, accepted cow/horse/sheep/dog/cat, saves/cloud/auth/economy, root/speeds/collision, public exports and serviceworker. Stop for protected-system expansion or a major new architecture decision.
