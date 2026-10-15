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
- `arranger/VERSION` is `v0.13-dev` on both main and develop, blob SHA `8287f2896ba8c550d34ec5a27953c0a958c0de74`.
- `src/shared/song-project.js` was identical on main and develop before the 2026-10-15 boundary-test-only change; both referenced blob SHA `fe9c650deb2d0369c938f0bdb4f503cf6b805cf4`.
- SongProject v1 canonical contract therefore does not need a speculative rewrite merely to reconcile branch history.
- Project Home workflow behavior is substantially aligned; the main/develop `project-home/workflow.js` difference observed during inspection was comment/documentation-level around unfinished-item ordering, not a reason to overwrite either branch wholesale.

### Known real content differences that require deliberate selection

Do not treat the branches as functionally identical merely because several core files match.

- Composition Sheet latest differs:
  - main: `sheet-app/latest/manifest.json` → `v0.9-dev`, blob `900e705556fdd5ca571410737de2ea0b1d956988`
  - develop: `sheet-app/latest/manifest.json` → `v0.9.1-dev`, blob `46eb2d6f46c872ed3ad134bac200b7ed2dfcf21e`
  - develop also declares `alwaysOpenBeginner: true` and `embeddedSongDataMenu: false`.
- Music Project Home differs at content level:
  - main `project-home/app.js` blob `8551a92610ee64e634d20c4eecf2360e673b3728`
  - develop `project-home/app.js` blob `a59f16f1139769495b5cfab648b7fd65fb723554`
  - main `project-home/index.html` blob `9e795234571cefc1f1f229724ef1cbed1147841d`
  - develop `project-home/index.html` blob `cad04d3abde2d4dcb11df578d5e97ac4dca36a51`
- Therefore reconciliation must preserve main's already-published release fixes while intentionally selecting newer develop behavior where verified; a blind merge/reset is not acceptable.

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

1. Re-check current `main` and `develop` heads before making any integration commit.
2. Start from the current `main` lineage, because it represents the CI-qualified published line.
3. Inventory actual file-level differences against current `develop`; do not infer required work from commit counts alone.
4. Classify each differing file into:
   - already published equivalent / no action
   - develop-only feature that must be carried forward
   - main-only release/CI correction that must be preserved
   - stale metadata/documentation to be regenerated after code reconciliation
5. For Composition Sheet and Project Home, compare behavior/tests rather than choosing by version string alone.
6. Apply only required develop-side deltas onto the integration branch.
7. Run all affected CI suites, including SongProject cross-app boundary regression and the DAW handoff MIDI regression when merged to develop.
8. Verify that published main functionality is not lost.
9. Open a PR for reconciliation; do not directly update main.
10. After main lineage is reconciled, rebuild `develop` into a clean development line without force-overwriting old history. Preserve the current old develop head through the restore branch above.
11. Only then synchronize VERSION / README / package metadata / AI_HANDOFF / VERSION_HISTORY / CHANGELOG.

## Prohibited shortcuts

- no `git reset --hard main` directly on develop without preserving the old head and an explicit replacement plan
- no force-push to main/develop
- no blind `develop -> main` merge while branches are diverged
- no deletion of old restore / backup branches
- no stable tag before Android + required Cubasis/Cubase real-device verification

## Next Work-mode task

Continue from this integration branch with high reasoning. Re-check branch heads first because they may have moved after this note. Treat this document as a snapshot, not as authority over newer repository state.
