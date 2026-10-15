# main/develop reconciliation candidate — 2026-10-15

This is a review candidate, not a publication or stable certification. Remote
`main` and `develop` have not been changed by this work.

## Verified starting points

- main: `28f85e64adeed26da1d40fc491723438ffecd2f9`
- develop: `b322cb47282261db720bf3b74caf455cb56c9cf7`
- Existing staging branch: `integration/main-develop-reconcile-20261015`
- Staging starting commit: `427bd37` (main ancestry plus six planning commits)
- Merge base: `365b577685cf74c512d5f84e3c78ca6ecfb0e7e9`
- Before reconciliation: develop ahead 397 / behind 114.
- GitHub API confirmed PR #252, #253 and #254 merged to develop at the recorded
  merge commits. No open PR existed for the staging branch at inspection time.

## History strategy

Continue the existing staging branch and record an ordinary two-parent merge of
the verified develop head. Resolve content deliberately, retaining both histories.
This does not use a replacement tree, reset, squash, rebase, or force push.

After this candidate passes hosted CI and receives release approval, merge its PR
into main **with a merge commit**. Then open a separate main-to-develop PR. Since
both original heads are ancestors of the candidate, develop can catch up without
rewriting or discarding its 397 commits. Do not squash/rebase this reconciliation:
that would lose the ancestry relationship needed to resolve the divergence.

Do not merge main back into develop before the candidate is approved/published.
Later commits on either branch must be inspected again before promotion.

## Content selection and the 33 conflicts

| Conflict group | Selection and reason |
| --- | --- |
| `arranger-ci.yml`, `ci.yml`, `sheet-app-ci.yml`, `song-project-ci.yml` | Develop's newer coverage and isolated browser stages; re-add main's public menu regression and retain main-only AI release CI. |
| `VERSION_HISTORY.md` | Develop development history; preserve the entire original main record in `RECONCILIATION_MAIN_VERSION_HISTORY_2026-10-15.md` for the following metadata-sync task. |
| `arranger/index.html`, `arranger/src/workflow-boundary-ui.js` | Develop loads the menu through the workflow entry, with direct canonical sheet navigation. Public menu regression follows this actual import chain. |
| `arranger/tests/song-data-menu-browser.test.cjs` | Develop's stable app IDs, scroll-before-click and isolated target handling. |
| `docs/BEGINNER_MODE.md` | Main: retain the published optional-detour explanation. |
| `index.html` | Develop PWA/handoff entries; preserve main's single AI entry wrapper through `app-entry.js`, removing duplicate direct AI JS/CSS entries. |
| `package.json`, `src/core/project-schema.js` | Develop script coverage and development metadata, without schema change; version-label synchronization follows separately. |
| Six `project-home` files (app, index, sheet-connection, song-data-menu-entry, workflow, CHANGELOG) | Develop's canonical embedded latest sheet, Archive/Analyzer label, existing handoff support and actual-MIDI-export readiness from #253. |
| `scripts/build-static.mjs` | Develop's root PWA build; published AI entry and all historical assets remain included. |
| Six scripts (composition-sheet-app, composition-sheet-tabs-browser, project-home-claude-link, project-home-sheet-browser, sheet-beginner-latest-home, song-data-menu smoke tests) | Develop's v0.9.1/embedded sheet and export-readiness assertions. Main's public menu test remains separately active. |
| `sheet-app/CHANGELOG_v0.7.md`, `sheet-app/CHANGELOG_v0.8.md` | Main: published historical records remain intact. |
| `sheet-app/index.html`, `sheet-app/latest/composition_sheet_latest.html`, `sheet-app/latest/manifest.json` | Develop's v0.9.1 canonical redirect that preserves `embed=1`. |
| Two existing `sheet-app/versions/v0.7` files | Main byte-for-byte; keep its self-contained published v0.7 and all associated JS/CSS/data. |
| `src/hub/app-entry.js` | Main: keep its published AI bootstrap and build-query propagation. |

Other nonconflicting develop additions include root PWA/cache isolation, optional
lyrics/vocal composition fields, composition-sheet handoff, SongProject boundary
tests (#252), and MIDI timing tests (#254). Shared SongProject implementation,
Demo Schema 3, Arrangement Plan Schema 4, PPQ 480 and 4/4 remain unchanged.

## Preservation evidence

- `reconciliation-preserved-assets.json` records Git blob IDs for all 38 files
  under main's `versions/`, `arranger/versions/`, and `sheet-app/versions/`.
- `scripts/reconciliation-preservation-smoke-test.mjs` checks every recorded file,
  including the binary recovery archive; only text CRLF checkout conversion is
  normalized if the raw blob does not already match.
- Existing published version paths have no modified/deleted entries in the
  candidate diff. New develop-only version paths are additive.
- Develop's differing historical files remain reachable through its original head
  and the merge's second-parent history; none of its commits is rewritten.
- Main-only release docs, public changelogs, `project-home/VERSION`, AI release
  workflow and `src/hub/ai-monitoring-entry.js` remain present. Main's historical
  VERSION_HISTORY content is additionally preserved in full as noted above.
- Existing remote restore/backup refs and tags were inventoried before work.
  No remote ref has been deleted or overwritten.
- Local additional restore refs point to the exact current heads:
  `restore/local-main-before-reconciliation-20261015` and
  `restore/local-develop-before-reconciliation-20261015`.

## Why the test updates preserve their guarantees

The PWA test now traces the retained published AI bootstrap instead of requiring
a second direct script in index.html. It still verifies the implementation and
stylesheet in the generated PWA precache, now also checking the bootstrap itself.
The preservation test rejects a duplicate direct AI initialization. Thus the
change prevents duplicate monitoring sessions/listeners rather than relaxing
feature availability.

The public menu test traces Arrangement Lab's HTML → workflow entry → menu entry
and retains its menu/export assertions. Its version assertion follows VERSION
instead of requiring the obsolete v0.10 label.

Audio and full-sheet source tests normalize CRLF to LF before source comparison;
all original anti-click and workbook-content assertions remain. This is a Windows
checkout portability fix, not a change to audio or historical sheet behavior.

## Validation and remaining gates

Local static checks: 178 commands passed (174 initially, four affected checks
passed after the test-entry and CRLF corrections). Static build and all 38
published-file preservation checks passed. Browser results are recorded in the
completion entry below.

Local runtime: Node 24.19.0; bundled Playwright 1.62.1 / Chromium 151. Hosted CI
uses Node 22 / Playwright 1.58.2 and must still run against the exact pushed head.
Local results do not substitute for a hosted CI result.

At preparation time GitHub connector tools were unavailable and local Git had no
noninteractive credentials. A remote PR/CI run cannot be claimed until a push and
PR creation succeed. Continue the next scoped tasks from this candidate locally.

Metadata synchronization remains a separate following task: README, AI_HANDOFF,
package/APP_VERSION, published release labels, Home VERSION and consolidated
history still require coordinated review. No new stable version is declared.

Android, Cubasis and Cubase device gates remain unchecked in
`DAW_HANDOFF_VERIFICATION.md`. They were not performed in this task and stable is
**not eligible**. Device testing and further UX work are outside the current scope.

## Local completion evidence

- 17 browser invocations passed: Home (360/390/430/1440px), MIDI export,
  Arrangement core/one-bar/v05/v06/PWA update, sheet full/tabs/v06/v08/v09/v091,
  and the four isolated song-data-menu app targets.
- First browser run: 15/17 passed. Historical sheet v0.6 timed out waiting for
  its heading and v0.8 observed zero cards immediately after submit. Both passed
  on unchanged-code isolated reruns. The first failures are retained in the logs;
  their intermittent cause is not proven and hosted CI must confirm the result.
- GitHub API independently confirmed all recorded checks on the heads of
  #252 (2), #253 (4), #254 (3), and main (3) succeeded. These are historical
  checks, **not CI for the new candidate**. Develop's merge head has no direct
  Actions runs because its workflows primarily run on PRs.
- 162 pre-existing remote restore/backup/tag refs inventoried. All retained.
- Noninteractive `git push --dry-run` failed because no GitHub username/credential
  was available. It did not update remote refs. No PR or candidate hosted CI exists
  yet; attach the PR to the chat after authenticated creation succeeds.

Local evidence lives in the sibling `work/reconciliation-evidence/` directory:
remote refs, protected blob lists, both branch histories, static/browser logs,
rerun logs, and historical CI JSON. Subsequent tasks should preserve this evidence.
