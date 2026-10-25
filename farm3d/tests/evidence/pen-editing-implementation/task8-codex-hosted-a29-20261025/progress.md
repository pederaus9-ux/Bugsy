# A29 hosted qualification preparation

Owner20:17:33UTC Yes approved the precise workflow/check bundle and conditional merge with automatic live publication only after required checks and phone review. Named amendment and pre-edit1843byte workflow/SHA256 were recorded before edits. Current-phone acceptance remains pending; no merge/Site change.

Only .github/workflows/farm3d-release-qualification.yml changes. It appends two workflow_dispatch-only jobs; exact original workflow prefix, conflict job, PR trigger, concurrency and contents:read permissions are preserved. No test/runtime changes. Original49focused checks,5source-control groups,2installedcachetransitions,gate1/120,27recovery and3manual-restore groups remain intact. Job caps20/25minutes; no changed assertions, testlimits, seeds or continue-on-error. Local gate failure is retained and not hidden by the workflow.

Static YAML structure/source preservation checks and all14 Bash syntax blocks PASS. First restricted Git Bash startup failed NtCreateDirectoryObject0xC0000022 before parsing; allowed execution of the same syntax-only check passed. No shell payload executed by the parser. Runtime/test source hashes remain identical. Existing authenticated CLI is available; no login or credential changes. The connected GitHub tools lack initial workflow dispatch, so existing GitHub CLI is the supported fallback.

Manual-restore receipts are copied only if newer than this invocation's marker, preventing an old checked-in PASS from being represented as fresh after an early failure. Original test still writes only the disposable runner checkout; source history remains untouched.

Remote publication branch read before write:9d1ce4d0050578fed42f987d912c5bed72e29aad. Upload and exact-head manual dispatch have not yet executed at this preparation checkpoint. All oversized local archives stay untracked/hashed, no deletion or force-push. Official results pending; current care/wake1/30 and historical/deferred failures unchanged.

Preparation note: a local relay-writing shell inline-JavaScript command failed at parsing before any relay write. A saved script records the relay correctly; no runtime/workflow retry or remote write was involved. Pre-edit JSON intentionally retains original CRLF receipt bytes; git whitespace check reports those carriage returns, not changed logic.
