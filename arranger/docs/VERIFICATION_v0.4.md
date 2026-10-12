# v0.4 verification

Story: source JSON → category/method variants → actual chords/voicing/part notes → scope-aware adoption → shared preview/MIDI → Schema4 save/restore/offline。

- 50 unique methods (14 harmony / 16 counter / 15 development / 5 linked).
- Rich fixture: all 50 families have applicable musical transformations; 157 variants verified. Inapplicable/no-op variants show reasons.
- Unit/integration: exact MIDI Note roundtrip for melody/counter/harmony/bass/drums/A/B, PPQ/channel10, source immutability, unrelated Sections, source melody/bass locks, rhythm preservation, A/B nonoverlap, old Schema3 and old seven tools after Overrides.
- Empty material and PPQ96/960 coverage. Android/Cubasis/Cubase hardware not tested.
- Browser CI: 360px all 50 UI methods, 390/430px categories and representative flows, original/variant audition, scoped adoption, A MIDI, save/reload/offline/console.

## GitHub Actions evidence
- PR #171 / implementation commit b37ed9b938aeaecb7c257b5fa80f8152f78f4cc4。
- Arranger run 38320356468、Demo Composer run 38320356613、Pages PR build 38320356491: success。
- Chromium UI: 360pxで全50手法生成、390/430pxで全カテゴリ・代表案。元/候補試聴、A MIDI、採用、Schema4保存/reload/offline、Console error 0。
- 50手法・157適用Variantの音楽/Note/MIDI契約確認。既存49テストと音声回帰成功。
- 画面画像を目視確認。360pxのカテゴリ/手法/候補/対象Section/MIDI操作ははみ出しなし。
- Screenshots: https://github.com/tamurayuuki46-cpu/demo-composer/actions/runs/38320356468/artifacts/11778376437
