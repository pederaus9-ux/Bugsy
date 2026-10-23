# Amendment A4: contained animals and player gate access

Owner authority received through the parent delegation on 2026-10-23, at clean implementation checkpoint1ab18b466bbda574b10582d6e6a0472f200843a6.

> Assistant (Sentinel_30adc553d2108191a56b9337fb96bb45): One correction to my question: this version has one pen per species, so pen-to-pen transfers would be a separate feature. For this update, I recommend keeping animals contained and allowing the player through gates, while you move or reshape the existing pens. Is that what you want?
>
> User (Sentinel_2b9ca117784481919a7bac48bd91f742): Okay

This precise approval changes the product scope for this update:

- Penned animals remain inside their species enclosure. Existing dog/cat free-roaming and forbidden-pen contracts remain unchanged.
- Players can traverse real yard gate gaps. Moving/reshaping the existing enclosure and its allowed assemblies remains in scope; the chicken whole-yard fixed rule remains.
- Directed animal exterior passage, automatic out-and-back excursions, outside waiting and pen-to-pen transfers are deferred features. There is still one saved site per species. No new passage mechanic, second pen, herd reassignment or gate open/close gameplay is authorized.

This supersedes only the directed **animal exterior passage** requirements in the approved design's line108, Task4 gate-passage qualification, and Task8 exterior player/animal passage qualification. It does not defer interior gate routes, either coop doorway, ordinary containment, player passage, mixed in-pen care traffic, current clearances/turn/contact/support limits, saved-layout rebind/rollback, maximum ownership or any other integration/recovery check.

The eight recorded exterior scene-route REDs in `tests/evidence/pen-editing-implementation/task7-codex-gate-traffic-20261023/` remain immutable historical evidence. They establish the absence of the now-deferred capability; they are not relabeled PASS, deleted, or added to a skip list. That diagnostic was not a registered canonical suite. All remaining tests retain their assertions/seeds/deadlines. The separately proven empty-route recovery defect was corrected and qualified at1ab18b4; it is not deferred.

The prior pending product decision in the gate diagnosis/recovery checkpoint is resolved by this amendment. The former proposed out-and-back operation is not approved. No protected-file exception or successor digest is added: A1/A2/A3 remain exactly bounded. No visual, merge or deployment approval is implied.
