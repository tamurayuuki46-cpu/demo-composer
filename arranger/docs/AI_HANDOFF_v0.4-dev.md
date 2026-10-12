# Arrangement Lab v0.4-dev — Work/Cloud restart checkpoint

更新日: 2026-10-13
Repository: tamurayuuki46-cpu/demo-composer
Base: develop / 3d92f60922114aa9686207764a1cb323bdae91df
Work branch: chatgpt/arranger-v0.4-music-labs
Restore: restore/arranger-v0.3-before-music-labs
Published version: v0.3-dev / PR #170. This checkpoint is NOT complete and must not be deployed as-is.

## User goal
Implement ALL proposed musical functions in categories ② harmony, ③ counter melody, ④ development, and their linked sets. User chose musical transformation depth before final comparison/record/export UI improvements (①⑤⑥).

The authoritative inventory is arranger/src/music-lab-catalog.js:
- 14 harmony methods
- 16 counter methods
- 15 development methods
- 5 linked sets
Every applicable method must alter actual chords/notes/voicing/timing and feed shared preview, Plan persistence and MIDI. Methods lacking required material must show applicability conditions rather than pretending to have changed music.

## Completed checkpoint work
- Fetched latest develop and isolated a new work branch.
- Archived arranger/ from v0.3 in versions/arranger-v0.3-before-music-labs/arranger_v0.3-dev.tar.gz.
- Created 50-method catalog with Japanese labels, descriptions and variant choices.
- Added music-lab-utils.js: immutable candidate contexts, chord/scale utilities, part reading/writing, range trimming and note summaries.
- Added harmony-lab.js implementing the 14 harmony transformation families as initial rules. This is not yet integrated into app.js or tested for musical invariants.
- Extended core.js toward independent Arrangement Plan Schema 4: generalized partOverrides, explicit chord.voicing, counter A/B note labels and separate MIDI parts. Source snapshots remain immutable. Import accepts old 1/2/3 plus 4.
- JavaScript syntax checks passed for core/catalog/utils/harmony modules.

## Pending work, in order
1. Review and test harmony transforms: preserve intended anchors, clip Section boundaries, valid qualities/pitches, explicit warnings for chromatic inner notes and melody-fixed modulation proposals. Common-tone variants must actually retain the designated tone; avoid identical candidates where an alternative is feasible.
2. Implement the 16 counter methods (including original preservation vs reharm adaptation, contour, rhythm, motion, response, motif, register, collision repair, cross-Section development and A/B handoff).
3. Implement the 15 development methods (including actual transitions, silence boundaries, multi-chorus/later-chorus operations, multi-axis density, intro recall and endings).
4. Implement the 5 linked sets using composable musical operations.
5. Add orchestration to create/apply candidates with declared affectedSectionIds. Applying a multi-Section candidate must not overwrite unrelated Sections or later edits.
6. Add category/method/variant controls inside Section workshops, original/candidate audition, applicability messages and real musical deltas. Preserve the existing v0.3 seven tools.
7. Update localStorage to v0.4 with v0.3/v0.2/v0.1 read fallbacks. Add new modules to a versioned SW cache. Update arranger/VERSION, CHANGELOG, PRODUCT_SPEC, VERSION_HISTORY, schema/migration docs.
8. Update assertions for v0.4/schema4 while retaining explicit old-schema restoration tests. Add coverage for ALL 50 catalog entries, pitches/timing/Section isolation/source immutability, transformation semantics, MIDI read-back and Plan reload. Include empty/short Sections and non-default PPQ.
9. Run all 49 Demo Composer test scripts, audio regression, syntax, build/cache and 360/390/430px browser CI. Local Chromium download previously failed; GitHub Actions Playwright checks worked successfully for v0.3.
10. Commit -> PR to develop -> all checks -> merge -> Pages deployment -> public URL/version check. main is stable-only; do not write/push main. User already authorized develop integration and Pages publication for this app.

## WIP cautions
core.js already reports v0.4/schema4 but arranger/VERSION and app storage/SW/UI remain v0.3. This is deliberate incomplete work; synchronize them before testing release. No current v0.4 functionality is visible in the published app.
Voicing and original-chord display must remain truthful: chromatic inner embellishments can differ from the symbolic chord; mark this explicitly. Tonicization and modulation suggestions are proposals, not automatic proof that a key change has been established. Drums MIDI must remain channel 10.

## Existing source entry points
AGENTS.md, README.md, docs/AI_HANDOFF.md, docs/DATA_SCHEMA.md, docs/ARCHITECTURE.md, arranger/docs/PRODUCT_SPEC.md.
Tests: arranger/tests/core.test.mjs, regression.test.mjs, features.test.mjs, browser.test.cjs.
Build: scripts/build-static.mjs must keep arranger/ in dist/arranger/.

## Access / Git
Shell git clone/fetch works, but git push lacked credentials. Connected GitHub tools successfully create blobs/trees/commits and update refs with expected_sha and force=false; preserve every historical branch. Local commits made for verification can differ from connector-created commits with identical trees: preserve local branch checkpoints rather than force overwriting history.

Public URL: https://tamurayuuki46-cpu.github.io/demo-composer/arranger/
