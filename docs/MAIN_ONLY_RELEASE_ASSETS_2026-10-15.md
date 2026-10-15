# main-only release assets audit — 2026-10-15

Snapshot for branch reconciliation. Re-check current branch heads before acting.

## Why this matters

A reverse comparison (`develop` as base, `main` as head) confirms that `main` contains release/publication-specific history and files that are not simply represented by the current develop lineage.

Therefore:

- do not replace main with develop wholesale
- do not reset develop/main blindly
- preserve release/publication behavior deliberately

## Main-side assets observed in reverse comparison

Important examples include:

### Release / CI

- `.github/workflows/ai-monitoring-release-ci.yml`
- main-specific changes in `.github/workflows/arranger-ci.yml`
- main-specific changes in `.github/workflows/ci.yml`
- main-specific `sheet-app-ci.yml` / `song-project-ci.yml` release history

### Release documentation / public records

- `docs/CURRENT_RELEASE.md`
- `docs/MOBILE_FIRST_WORKFLOW_MAIN.md`
- `CHANGELOG_public_v0.10.md`
- `CHANGELOG_v0.9.md`
- `docs/SONG_DATA_MENU_PUBLIC_v0.9.md`
- `docs/SONG_MEMO_PUBLIC.md`

### Project Home publication metadata

- `project-home/VERSION`
- main-side Project Home changelog / app / workflow publication history

### Public-specific regression coverage

- `scripts/song-data-menu-public-smoke-test.mjs`
- main-side release variants of Composition Sheet / Project Home tests

## Reconciliation rule

For every release/publication-specific file:

1. Determine whether it is still required by current main deployment / Pages / release CI.
2. If required, carry it forward explicitly into the reconciled lineage.
3. If superseded, document what replaced it before removing or retiring anything.
4. Never infer that a develop file with a newer version number automatically supersedes a main-only release file.

## Suggested Work checks

Use a local clone in high-reasoning Work and inspect at minimum:

```text
git merge-base main develop
git log --graph --decorate --oneline --all
git log develop..main --name-status
git log main..develop --name-status
git diff --name-status main..develop
git diff --name-status develop..main
```

Then classify files into:

- same/equivalent behavior
- main-only release infrastructure to preserve
- develop-only verified feature to carry forward
- stale generated/version metadata to regenerate
- uncertain: requires test or manual review

## Current safety principle

`main = published / CI-qualified lineage` does not mean `main = stable`.

Stable remains unrecognized until Android + Cubasis + Cubase physical-device gates pass.
