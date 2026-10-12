# v0.2.1-dev verification — 2026-10-13

Story: project.json → A/B/C・Mix・Section編集・リハモ → 試聴/MIDI/保存JSON → 再読込・オフライン再開。

- Base: develop c941a4f; received v0.2 commit 4313a42。
- Restore: restore/arranger-v0.1.1-before-v0.2 (c941a4f) を確認。追加 restore/arranger-v0.2-before-work-review (4313a42)。
- ローカル: Syntax / core / MIDI読戻し・リハモ・保存互換 regression成功。
- Demo Composer: package.jsonの全49 test:*、audio-playback-smoke-test、build成功。lint/typecheck専用設定なし。
- MIDI: Type 0 header、960 PPQ fixture、tempo、4/4、5パートNote On/Offとdeltaを既存独立readerで再解析、ch10、OFF境界、リハモ特徴音を検証。
- 元Project不変・旧Plan復元・異なるrevision拒否を検証。
- Local Playwrightブラウザ取得は環境のdownload制約で失敗。モバイル操作テストはGitHub Actionsで実行し、結果と画像をartifactへ保存する。
- ブラウザCI: 360/390/430px、3スタイル、ABC試聴/停止/終了、Mix、密度/Toggle、リハモ採用解除、5 MIDI download、JSON current state、reload、offline、他PWA cache保持、Console errors。
- Android実機、Cubasis/Cubaseアプリそのものの実機検証は未実施。SMF構造の検証と区別する。

## GitHub Actions evidence
- PR #169 / commit d9fcb3f44908ded725f9312c4d3a75f827c0f9df。
- Arrangement Lab CI run 38295695232: PASS。360/390/430px全フロー成功、Console error 0。
- Demo Composer CI run 38295695032: PASS。Pages PR build run 38295695106: PASS。
- 画面証跡: https://github.com/tamurayuuki46-cpu/demo-composer/actions/runs/38295695232/artifacts/11768796533
- 360pxスクリーンショットを目視確認。横はみ出しなし、カード/Toggle/MIDI/JSON操作を確認。
