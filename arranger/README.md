# Arrangement Lab

Demo Composer companion PWA.

## Flow
Demo Composer → Arrangement Lab → Cubasis → Cubase

## v0.4-dev
Demo Composerのproject.jsonを読み込み、A/B/C編曲案を試聴・比較・Mixし、Sectionごとの密度/楽器ON-OFFとリハモ3案を編集して、パート別MIDIとArrangement Plan JSONを書き出す。

## Start
Repository rootをHTTP配信して `/arranger/` を開く。

```bash
python -m http.server 8080
```

`http://localhost:8080/arranger/`

## Test

```bash
node --check arranger/src/core.js
node --check arranger/src/app.js
node arranger/tests/core.test.mjs
```

採用したプランは再読み込みで編集再開できます。編曲プランJSONも同じ入力欄で読み込めます。旧プランは元project.json（同じID/revision）の再選択で復元します。

追加検証: `node arranger/tests/regression.test.mjs`。ブラウザCIは `arranger/tests/browser.test.cjs`。
検証詳細は `docs/VERIFICATION_v0.2.1.md`。

## 7機能の入口
project.json読込後、Sectionカードの「Sectionの編曲ラボ・7つの機能」を開く。
リハモ理論・メロディとの関係、裏メロ5案、Section採用、サビ5案、引き算、主役の受け渡しを試聴して採用する。
`node arranger/tests/features.test.mjs`でNote不変/Section範囲/保存/MIDIを検証。

## 50 musical methods
Sectionの編曲ラボ上部から②Harmony / ③Counter / ④Development / 連動を選択。
素材不足や同一の発音になる候補は理由を表示。適用案は試聴・採用・候補MIDIに共通反映。
テスト: `node arranger/tests/music-labs.test.mjs`。全手法・157適用VariantのNote/Chord/保存/MIDI往復、空素材・異なるPPQを確認。
