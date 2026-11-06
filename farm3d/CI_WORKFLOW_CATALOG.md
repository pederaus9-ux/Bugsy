# Sunny Acres workflow catalog - 2026-11-06

Source snapshot: main `1d427a91f99804ca91b6cfa5d592f360430313bd`. These are definitions and observed trigger scopes, not a fresh claim that every job passed or that branch protection requires every listed job. The workflows API listing was unsupported during the audit, so enabled/disabled registration state is not independently established here.

## Current gate definitions to retain

| Workflow file under `.github/workflows/` | ID | Scope and purpose |
|---|---:|---|
| `farm3d-regression.yml` | 372081893 | Main PRs, scoped main pushes and manual dispatch; core, animal, save/recovery and browser regression coverage. |
| `farm3d-art-candidate.yml` | 374585993 | Scoped PRs and manual dispatch; cow reference, barn and authored-hands checks. |
| `farm3d-release-qualification.yml` | 382687805 | Scoped PR checks and explicit manual qualification selections. Manual-only skips are not evidence those journeys ran. |
| `field-support-qualification.yml` | 397459291 | Scoped PR/main events; preserves immutable historical field coverage at `0d0542bf93e4e010b5543e81a40fae4bca2dd5f9` separately from current rollback coverage. |
| `pages-package-validation.yml` | 396438442 | Scoped main PRs; actual Pages/Jekyll package validation. |

GitHub-managed Pages deployment is separate: workflow ID `367398822`, path `dynamic/pages/pages-build-deployment`. It is not one of the repository's ten YAML files and is not a cleanup target.

## Retained historical branch-only diagnostics

These five definitions have push triggers restricted to the branches below, with additional path filters where specified in their source. They have no main/PR/scheduled trigger. Merely retaining their files does not consume runner time. No disable, deletion or rerun is authorized by this catalog.

| Workflow | ID | Push branch or branches | Last observed run |
|---|---:|---|---:|
| `chicken-update-fix.yml` | 389403311 | `codex/chicken-update-fix-20261019` | 39255926028 |
| `cow-cloud-recovery-diagnostic.yml` | 391012332 | `codex/cow-courtyard-20261020` | 39500639998 |
| `cow-courtyard-diagnostic.yml` | 390816395 | `codex/cow-courtyard-20261020`, `codex/north-land-seasons-20261021`, `codex/chicken-physical-care-20261020`, `codex/cow-double-room-20261021`, `codex/remaining-animal-care-20261021` | 39686306481 |
| `chicken-physical-care-diagnostic.yml` | 391242866 | `codex/chicken-physical-care-20261020`, `codex/cow-double-room-20261021`, `codex/remaining-animal-care-20261021` | 39686306478 |
| `remaining-care-diagnostic.yml` | 392157035 | `codex/remaining-animal-care-20261021` | 39686306402 |

The ten definitions contain no local reusable-workflow call or workflow-run dependency. That bounded source check does not establish that there are no external consumers.

## Retention and later owner decisions

- Keep required gates, frozen fixtures, failed/cancelled receipts and deployment history. Historical results do not substitute for candidate checks.
- A later proposal may ask the owner to disable the five old branch-only diagnostics, after checking current consumers and retaining needed receipts. Disabling is reversible; deleting run history is not. This correction performs neither action.
- Three fully merged documentation branch pointers may be proposed separately for retirement: `docs/bot-roster-coordination-20261030` (#102, head `09bd59cf6d7229de20168beadb96163ed2edf7f9`), `docs/registry-v86-v88` (#108, head `4b23999c222a39eef440c81d28e9ac665dbc9f36`), and `docs/retire-roadmap-20261030` (#106, head `2be38de5a053dba211771f86edbc4ab97ad0801d`). Each head is an ancestor of this main snapshot with zero unique commits. No branch is deleted here; verify external consumers and preserve the PR/head evidence before any owner-approved deletion.
- Retain unclassified branches, closed-unmerged branches and their evidence. Absence of an open PR is not proof that a branch is disposable.

Official behavior: [disable/enable workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows), [delete workflow runs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/delete-a-workflow-run), [delete/restore PR branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/deleting-and-restoring-branches-in-a-pull-request).
