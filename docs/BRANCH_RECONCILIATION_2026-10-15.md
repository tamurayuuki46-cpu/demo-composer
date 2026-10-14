# main / develop reconciliation — 2026-10-15

This file is a staging note for the dedicated integration branch `integration/main-develop-reconcile-20261015`.
It must not be treated as a release declaration by itself.

## Safety points created first

- `restore/main-before-songproject-branch-sync-20261015`
- `restore/develop-before-songproject-branch-sync-20261015`

Do not delete or overwrite existing restore / backup branches, tags, or past versions.
Do not force-push `main` or `develop` as part of reconciliation.

## Current divergence snapshot

At the time of this note:

- base: `main`
- head: `develop`
- status: `diverged`
- develop ahead of main: 358 commits
- develop behind main: 114 commits
- merge base: `365b577685cf74c512d5f84e3c78ca6ecfb0e7e9`
- main head used by comparison: `28f85e64adeed26da1d40fc491723438ffecd2f9`

The large history divergence is partly caused by selective publication/cherry-pick-style release work. Do not assume commit counts equal functional distance.

## Important content-level findings

### Already aligned / low-risk core

- `VERSION` is `v0.15-dev` on both main and develop.
- `src/shared/song-project.js` was identical on main and develop before the 2026-10-15 boundary-test-only change; both referenced blob SHA `fe9c650deb2d0369c938f0bdb4f503cf6b805cf4`.
- SongProject v1 canonical contract therefore does not need a speculative rewrite merely to reconcile branch history.
- Project Home workflow behavior is substantially aligned; the main/develop `project-home/workflow.js` difference observed during inspection was comment/documentation-level around unfinished-item ordering, not a reason to overwrite either branch wholesale.

### Metadata / documentation drift that must be fixed after branch reconciliation

Current files are inconsistent even though `VERSION` is already `v0.15-dev`:

- main `README.md` still declares `v0.5-dev`.
- develop `README.md` declares `v0.14-dev`.
- main `package.json` declares `0.10.0-dev`.
- develop `package.json` declares `0.15.0-dev`.
- main `docs/AI_HANDOFF.md` begins with `v0.5-dev` current state.
- develop `docs/AI_HANDOFF.md` contains newer prepend notes but also an older `現在Version: v0.9-dev` section that can be mistaken for current state.

Therefore VERSION / README / package metadata / AI_HANDOFF must be synchronized only after the code lineage selected for reconciliation is fixed.

## SongProject v1 safety gate completed before reconciliation

PR #252 was merged to `develop` after both `Demo Composer CI` and `Song Project Integration CI` passed.
It adds `scripts/song-project-cross-app-boundary-smoke-test.mjs` and CI coverage for:

- MIDI Analyzer-shaped `analysis` / `reference` / `assets`
- JSON normalization and round-trip
- Demo Composer editing without erasing Analyzer-owned data
- Arrangement Lab editing without erasing Analyzer- or Demo-owned data
- Composition Sheet editing without erasing Analyzer-, Demo-, or Arrangement-owned data
- final round-trip after all app edits

This is a required safety gate for future reconciliation.

## Reconciliation strategy

Use `integration/main-develop-reconcile-20261015` as the staging branch.

1. Start from current `main` lineage, because it represents the CI-qualified published line.
2. Inventory actual file-level differences against current `develop`; do not infer required work from commit counts alone.
3. Classify each differing file into:
   - already published equivalent / no action
   - develop-only feature that must be carried forward
   - main-only release/CI correction that must be preserved
   - stale metadata/documentation to be regenerated after code reconciliation
4. Apply only required develop-side deltas onto the integration branch.
5. Run all affected CI suites, including SongProject cross-app boundary regression.
6. Verify that published main functionality is not lost.
7. Open a PR for reconciliation; do not directly update main.
8. After main lineage is reconciled, rebuild `develop` into a clean development line without force-overwriting old history. Preserve the current old develop head through the restore branch above.
9. Only then synchronize VERSION / README / package metadata / AI_HANDOFF / VERSION_HISTORY / CHANGELOG.

## Prohibited shortcuts

- no `git reset --hard main` directly on develop without preserving the old head and an explicit replacement plan
- no force-push to main/develop
- no blind `develop -> main` merge while branches are diverged
- no deletion of old restore / backup branches
- no stable tag before Android + required Cubasis/Cubase real-device verification

## Next Work-mode task

Continue from this integration branch with high reasoning. Re-check branch heads first because they may have moved after this note. Treat this document as a snapshot, not as authority over newer repository state.
