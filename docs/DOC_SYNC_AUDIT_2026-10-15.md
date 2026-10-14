# VERSION / README / AI_HANDOFF sync audit — 2026-10-15

Snapshot only. Use after main/develop reconciliation, not before it.

## Why this exists

The repository already has a correct top-level `VERSION`, but README / package metadata / AI_HANDOFF contain older version labels. Editing them before branch reconciliation risks doing the work twice or documenting the wrong lineage.

## Development-side snapshot (`develop`)

- Demo Composer: `VERSION` = `v0.15-dev`
- Arrangement Lab: `arranger/VERSION` = `v0.13-dev`
- Music Project Home: `project-home/CHANGELOG.md` top entry = `v0.18-dev`
- Composition Sheet latest manifest = `v0.9.1-dev`
- `package.json` = `0.15.0-dev`
- SongProject = v1
- Demo Composer internal Project Schema = 3
- Arrangement Plan Schema = 4
- PPQ = 480
- time signature policy = 4/4

Known stale development docs:

- develop `README.md` still says `v0.14-dev`
- develop `docs/AI_HANDOFF.md` contains newer prepend notes but also an older `現在Version: v0.9-dev` section

## Published/main-side snapshot

- top-level `VERSION` = `v0.15-dev`
- Arrangement Lab `arranger/VERSION` = `v0.13-dev`
- Music Project Home CHANGELOG top entry = `v0.17-dev`
- Composition Sheet latest manifest = `v0.9-dev`
- main `package.json` still says `0.10.0-dev`
- main `README.md` still says `v0.5-dev`
- main `docs/AI_HANDOFF.md` begins with `v0.5-dev`

The published code has moved far beyond the labels in main README / package / AI_HANDOFF. Those labels must not be used as evidence of actual implementation state.

## Required sync after branch reconciliation

When the integration lineage is fixed, update these as one coordinated documentation change:

1. `VERSION`
2. `package.json`
3. `README.md`
4. `docs/AI_HANDOFF.md`
5. `VERSION_HISTORY.md`
6. `CHANGELOG.md`
7. `arranger/README.md` / `arranger/VERSION` / `arranger/VERSION_HISTORY.md` if the selected lineage changes them
8. `project-home/CHANGELOG.md` only if a new Home version is intentionally declared
9. Composition Sheet latest manifest / changelog only if the selected lineage changes the sheet release

## README / AI_HANDOFF wording rule

Do not use one ambiguous label such as `Current Version` for everything. Separate at least:

- **development version** — what `develop` is building now
- **published main version** — what GitHub Pages/main currently exposes
- **stable version** — only a tag that passed Android + required Cubasis/Cubase physical-device verification

If stable is not certified, say `stable: 未認定` explicitly.

## Workflow that must be documented consistently

`作曲シート → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → Cubasis / Cubase → 完成`

Roles:

- Composition Sheet = 決める
- MIDI Analyzer = 集める・理解する（任意）
- Demo Composer = 作る
- Arrangement Lab = 育てる / Final Song.midを書き出す
- Music Project Home = 案内する / 次にやることを示す
- Cubasis / Cubase = 本制作・完成

## Stable rule

Never describe `main` as `stable` merely because CI passes.

Stable requires:

- Android physical-device pass
- Cubasis physical import/playback pass
- Cubase physical import/playback pass
- SongProject v1 cross-app regression pass
- affected CI pass
- verification result recorded in the repository

See `docs/DAW_HANDOFF_VERIFICATION.md` once that develop-side verification work is merged.
