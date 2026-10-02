# Rollback: production Firestore rules before the Phase 7I release

`production-rules-before-7I-2026-10-02.rules` is the exact ruleset that was live in production (project
`fir-config-18b64`, database `default`) before the Phase 7I release. Austin copied it from the Firebase console on
2026-10-02. SHA-256: `5ff061fd76d0e2d97185abcb46159e0bd88c6c9b85794f1dead1350b3613d92c`. It loads in the Firestore emulator.

**To roll back:** Firebase console › Firestore Database › `default` › Rules › paste this whole file › Publish.

Note: these older rules let the owner account (matched by email) read, and so also list, every player's farm. They
also accept client-written market listings against phone coins. Publishing the 7I rules (`../firestore.rules`) closes
both.
