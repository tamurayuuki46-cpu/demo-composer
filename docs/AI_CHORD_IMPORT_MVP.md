# AIコード進行8案 Import（試聴専用MVP）

## 目的
ChatGPTが提案したS001などの8小節×2コード候補を、Demo ComposerのHubでまとめて読み込み、スマホで1案ずつ試聴する。人間の比較・選定の前段として利用する。

## Owner・対象外
- 入力: chord-candidate-batch / schemaVersion 1のJSON
- Preview: 既存Demo Playerへ一時Projectを渡す
- 保存: このMVPでは既存Demo Composer Projectを一切変更しない
- 対象外: 本格音源、MIDI/WAV本制作、編曲、採用後のProject編集
- SongProject v1 / Demo Project Schema 3 / IndexedDB DB Versionは変更しない

## 操作
1. Hubの「AIコード進行 Import」から「候補JSONを読み込む」
2. examples/S001_ai_chord_candidates_v1.jsonなどを選択（最大128KB）
3. C01〜C08の「▶」で候補を再生・切替
4. 「再生停止」で停止。「候補を閉じる」で読み込みを解除
5. Reload後は候補は消える（比較セッションの保存は将来対応）

## 受入条件
- 1〜8候補・1候補16コード・8小節・拍1と3・4/4・PPQ480を検査
- 対応Qualityはmaj7 / m7 / 7 / maj9 / m9 / m7b5
- 不正JSON・不正配置・未対応コードは明示的エラーで停止する
- root/quality → Demo Composer内部の数値root/qualityに変換
- 既存曲を変更せず、候補間を共通BPMと仮音色で比較する
- 文字列はHTMLエスケープし、任意のHTMLを差し込まない
- Android PWAでファイル選択・音出し・停止・切替・Reloadを実機確認する

## 既知の制限
- MIDI Importの1小節コード推定は利用せず、JSONを直接使う
- Demo Playerの既定Block奏法は発音をコード長の約0.92倍としており、指定MIDI音価1.8拍と完全一致しない。音楽的な仮試聴に限定する
- 既存Chord編集画面やSection操作の一部は1小節1コード前提である。保存/編集/採用はこのMVPでは提供しない
- Cubase Pro 12の実機スモーク合格まで8案のMIDI/WAV本制作は始めない
- main公開/stable認定はRelease Policyに従う

## テスト
- npm run test:ai-chord-import
- npm run test:import
- npm run test:syntax
- npm run build
- Android実機の操作チェック（未実施）
