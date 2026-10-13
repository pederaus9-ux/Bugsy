# Bounded render-stage timing investigation

Base main: `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`, tree
`55e8e13146e2c78fc0647d2b07e97c6cfbf1ef5b`.
Branch: `codex/ambient-render-stage-diagnostic`. ChatGPT is the only implementer.

The completed original full sequence passed (run38338910516) with the same
sparse callback pattern as the isolated run. It did not reproduce main199's
ambient-resume failure. These runs are frozen evidence; do not rerun them.

The owner said okay to the proposed next render-timing investigation. This
new experiment runs **one original complete scene fixture**, without preceding
character programs. It is not another full-suite retry. No game correction or
merge is authorized.

## Falsifiable hypothesis

Long synchronous rendering or delays before the next game frame account for
the sparse draws. Alternatives: expensive game update outside rendering, a
frame that skips rendering, or a drawn butterfly using the wrong motion state.

Source evidence: `index.html` schedules the next frame after update/render work.
`phase7m.js` updates butterflies only in their actual `onBeforeRender` callback.
Prior observation shows only one drawn update in each full-mode 700 ms window.
That is supporting context, not proof of the original failing cause.

## Smallest new measurements

Before the original twenty weather GPU fences, install temporary observational
wrappers around requested callbacks named `frame`, the cached EffectComposer
render method, and renderer.render. Record start/end spans, request-to-delivery
delay, nesting, visibility and quality state. Observe browser long tasks.
Native receiver, arguments, return value, errors and request IDs are preserved;
no extra draw, forced fence, altered frame rate or artificial load is introduced.

Reuse the prior butterfly callback and motion marker logger at the original
pause/resume checks. Spans are bounded to 256 entries; callback data to 128.
Capture both original assertions after execution. Restore every observed method
once the full-motion assertion is captured, including on assertion failure.
One initial already-queued game frame can precede RAF wrapping; do not claim
complete startup timing coverage. Nested wrapper cost is part of the observed
run and cannot be assumed zero.

Compare frame time with composer time, renderer pass time, and delivery delay.
A frame with no composer call distinguishes skip/no-draw from expensive drawing.
A full-motion callback with unchanged geometry would implicate update/state.
If the failure does not recur, report measurements as diagnosis of sparse
rendering only, not a retrospective root-cause proof.

## Preserved contract and stop

Original `scene-polish.browser.cjs` remains byte-identical; source SHA256
`88f0a77329ee7129ab5701ee07cf72e08714d4931dcfc4572296df4e84e6f435`.
All cases/assertions, both 700 ms waits, pinned dependencies, browser harness,
viewport/drawing buffer, original 20-minute job limit and fail-fast behavior
remain unchanged. No production file, save/cloud/economy, animal, renderer API
source or service worker is edited.

Stop after this single execution and preserve failures. No automatic retry,
threshold change, production fix, merge or release. Report verified evidence,
likely causes and unknowns before deciding any correction.

Status: static syntax and unchanged-source guards passed; hosted result pending.
