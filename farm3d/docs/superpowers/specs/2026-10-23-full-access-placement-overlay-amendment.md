# Amendment A5: full cow access reservation and placement ground overlay

Owner authority received through the parent delegation on 2026-10-23, after clean cb4759d7.

> Assistant, Sentinel_6aacc166bfd4819199c09258db29a6be: Blocked: the editor can accept a cow-gate placement that later disables cow care because its access area overlaps the horse yard.
>
> I recommend making the editor reject those placements before saving, keeping the existing access protections unchanged. That means fewer valid gate locations, but avoids accepting a layout that breaks care. Approve that approach?
>
> User, Sentinel_5db4f62b1d848191b043c17c1d6ddba7: Yes but make ground where you are able to place it highlighted so player know where they can and can't place it

This approves adding validation restrictions that enforce the existing full cow-yard access reservation before saving. It does not approve reducing the runtime guard, narrowing its geometry, ignoring obstacles or changing clearance. The exact formerly accepted combined occupied-feed draft must now be rejected before persistence; retain all historical REDs and distinguish a separate valid functioning layout.

It also approves an in-game ground placement overlay for the selected operation. Derive valid/blocked results from the authoritative Apply constraints, including selected footprint/orientation, ownership, objects, full access, care and routes. Unknown or pending locations cannot appear valid. Show blocked reasons and non-color-only state/legend with readable mobile UI. Hover and preview do not save or mutate the draft. Bound work/resources, reject stale results and always revalidate Apply.

Implementation follows the existing editor/validator/preview architecture in small tested checkpoints. Real in-game phone/desktop previews precede owner visual acceptance. A1/A2/A3 exact bytes and A4 containment-only remain. No terrain/path/rig/default-cow-speed/economy/auth change or new locked-file digest is authorized. No merge, deployment or visual approval is inferred.
