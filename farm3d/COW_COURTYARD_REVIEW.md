# Cow courtyard — implementation checkpoint, not merge-ready

Main: `bf404a2a1261f3c7581025b249f2bd00c4539964` (lights remain live).
Branch: `codex/cow-courtyard-20261020`. No cow PR/merge/deployment yet.
Latest published source checkpoint: `ec84291554cf359b9a8e60a26cfc1d404bb63c12`,
tree `1ff4de350bec2a99e9787a12649edf31719d3dbc`, identical to local`618c736`.
Later drinking/picking/cup and slow-frame travel corrections are being qualified before publication.

The owner approved concept4 and both plans. Cow care uses the unchanged five-cow
cap/prices/rates; stocked30-unit feed, free12-hour water, manual12-second robot and
50-gallon quality-preserving tank. Writer3 is activated only by actual cow care;
ordinaryv1 and lamp-onlyv2 farms retain their existing marker. The stock, job,
receipts and tank live in a pure ledger, independent of render frames.

## Verified locally

- 85 focused assertions pass, no failures/skips/cancellations; a further regression
proves eating cannot mark a drinking visit complete.
- Actual skinned geometry stays above the floor throughout41 lie/stand samples;
folded torso meets authored straw within.005m and muzzle contact within.08m.
- Five actual scene bay center paths avoid model geometry and dock/service/exit;
night/rain do not cancel committed trips, and standing finishes before walking.
- Malformed/mixed envelopes refuse raw-save overwrite; exact predecessor game29
refuses writer3; partial pickup retains milk/quality and cannot repay XP.
- Original chicken, market, decoration and writer contracts remain green in the
focused sweep. Full required hosted checks have not passed on the candidate.

## Native evidence recovered

| Run/head | Observed result | Artifact/digest |
|---|---|---|
|39464917356 /8590394|35domain pass; event modal intercepted Walk before stations|12283899319 /57be0953fb31069503cf07715a880650771021c3a5f7c79b482ffdb3a42486ec|
|39465733521 /5a3c92b|37domain pass; actual feed/water touch pass; tank selected during cow-selection test|12286115306 /c54a7ad61316cc9b6871a2e8dff8165e7d1bc13ff05ee982da5543ff67475485|
|39467800934 /ec84291|Feed/water and Milk request pass; approaching/docking timeout; offline transition/refusal pass but stale raw timestamp comparison fails|12285637635 /8320d23f1513edca6b0d3013de08490b6429a753d0e592a51c88c2cd6e4abaf5|

The first captured day image was modal-obscured. The second revealed poor camera
framing and grass through the foundation; neither is an accepted final preview.
Corrections close the synthetic event fixture, keep a ready cow's selection
stable, clear the foundation reversibly, and follow the uninterrupted robot trip.

## Still required

Actual complete native trip and tank pickup;390/844/1280 day/night and physical
feed/drink/lie/stand footage;20 actual GPU rebuilds with exact warmed baseline;
installed52to53 offline update/old-writer refusal; authenticated cow recovery;
all final exact-head required workflows; final adversarial author self-review;
owner visual acceptance and explicit merge approval. Viewports do not establish
physical-phone sustained performance. No independent external-agent audit exists.

Courtyard fits the existing build radius north of the chicken yard. An occupied
site preserves its paid objects and old enclosure; clear it and reload before
courtyard installation. No land expansion or automatic object relocation occurs.
Horses/sheep retain the old paddock. Other species' physical-care implementation
remains in the approved follow-up plan, gated after the cow milestone.

The latest trace preserves the60-second docking timeout with the cow still
approaching and no tank credit. A new regression reproduces the new adapter's
capped-delta slow walk; bounded physical substeps retain walking pace during
slow draws while discarding hidden-tab catch-up. The accepted wandering AI is
unchanged. The offline raw-byte assertion remains exact; its fixture now uses
the same fixed-clock method as the existing lamp writer-barrier test. No timeout,
contact tolerance or original assertion is relaxed. Historical wardrobe resource
drop remains unassigned and is not claimed fixed here.
