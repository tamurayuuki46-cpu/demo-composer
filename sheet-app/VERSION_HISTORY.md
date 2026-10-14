# 作曲シート Version History

## v0.7 — 2026-10-14
- 31シート版を公開用の自己完結版として公開
- アイデア帳「ベース」に The Cardigans / The Weeknd の共通するベース発想を追加
- 「裏メロ兼グルーヴ・フック」として整理し、休符・裏拍、3度/5度/経過音、短いモチーフ反復、キックとのずらしを記載
- SongProject v1、JSON保存、Drive共有、Demo Composer受け渡しを維持
- v0.3〜v0.6は開発過程の版としてmain公開版には残さず、v0.1/v0.2はそのまま保持
- stableタグはAndroid実機＋Cubasis/Cubase確認後まで保留

復元ポイント:
- `restore/main-before-sheet-v0.7-20261014`

公開Branch:
- `chatgpt/public-sheet-v0.7-cardigans-weeknd`

## v0.2-dev — 2026-10-13
- アプリ間の交換JSONを `SongProject v1` に統一
- 作曲シートは `intent` とBPM/Keyだけを更新し、他アプリ領域を保持
- 旧 `demo-composer-project` / `composition-sheet-handoff` / Demo Composer `project.json` をImport時に自動変換
- MIDI / Audioなどの実ファイルはJSONへ埋め込まず `assets.files` で外部参照する方針へ統一

復元ポイント:
- `restore/develop-before-songproject-unification-20261013`

開発Branch:
- `feature/songproject-unification`

## v0.1-dev — 2026-10-13
- 新デザインで作曲シートを再構築
- 必須入力を2項目に明確化
- 共通Project JSONの読み込み／保存に対応
- 任意項目を折りたたみ化

復元ポイント:
- `restore/develop-before-sheet-app-20261013`

開発Branch:
- `feature/composition-sheet-json-v0.1`
