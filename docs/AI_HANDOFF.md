# AI_HANDOFF

現在Version:
v0.1-dev

最新安定版:
なし（初期開発段階）

現在実装済み:
- Repository初期構成
- 共通仕様書
- Claude / ChatGPT共同開発ルール
- Hub / Chord / Melody / Rhythm の最小UIシェル
- schemaVersion 1準拠の共通Project State
- Project Validation / Snapshot / Subscription / Revision更新
- HubからProject名 / BPM / Key / Scaleを編集
- Project名をTop Barへ同期

開発中:
- v0.1基本機能

次に実装:
- IndexedDB Save
- Chord入力
- Melody簡易Piano Roll
- Rhythm 16 Step
- Demo Player
- MIDI Export

既知の問題:
- Project Stateは現在メモリ上のみで、リロードすると初期状態へ戻る
- Saveボタンは未実装
- 現在のChord / Melody / Rhythm画面はUI骨格のみ
- Service Worker未実装のため完全なPWAオフライン対応ではない

触らない部分:
- docs/の基本思想
- PPQ=480の方針
- Module責務の分離
- 「DAWを再現しない」というプロダクト境界

最近の重要な設計判断:
- Android Chromeを主対象
- project.jsonをDemo Composer内の正本とする
- Module間は直接依存させない
- 共通Project Stateはsrc/core/project-state.jsで管理する
- ModuleはProjectオブジェクトを直接書き換えず、責務別の更新APIを通す
- State変更ごとにrevisionを増やす
- IndexedDB永続化はsrc/storageへ分離し、Project State自体は保存方式に依存させない
- v0.1ではHub / Chord / Melody / Rhythmを優先
- AIは完全自動作曲ではなく候補提示・先生役
- 将来のBass / Melody等の生成は「3候補 → 選択 → 修正」を基本とする
- 初期生成エンジンはAPI不要のルールベース方式を優先
- 重要仕様はCLAUDE.md / AGENTS.mdではなくdocsへ保存

現在のデータSchema:
schemaVersion 1 / PPQ 480 / 4/4固定。Schema変更なし。

最終更新:
2026-10-10
