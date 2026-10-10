# PRODUCT_SPEC

## Product Name

Demo Composer

## Purpose

PCを起動する前に、Androidスマホで作曲上の主要な判断を済ませるための作曲支援PWA。

## Target User

- 作曲初心者〜初中級者
- J-POP / ボカロ等の制作を学びながら進めたい人
- Androidスマホで外出先やベッド・ソファでも曲の骨格を作りたい人

## Core Flow

Demo Composer
→ Cubasis
→ Cubase
→ 各種プラグイン
→ 本制作

## v0.1 Scope

- Hub
- Chord
- Melody
- Rhythm
- Project Save
- Demo Player
- MIDI Export

初期UIシェルではHub / Chord / Melody / Rhythmのみ可視化。

## v0.2 Backing Pattern

Chord Module内に、コード進行自体は変えず伴奏の鳴らし方を決める `Backing Pattern` を追加する。

初期Pattern:

- Block
- 8分刻み
- Arpeggio
- Syncopation

目的は「コード進行を決める」だけでなく、「この進行をどんなノリで鳴らすか」までスマホで判断できるようにすること。

選択は通常のProject DataとしてAutoSave / Undo / Redo対象にし、Demo Playerへ反映する。Cubasis / Cubaseへ受け渡せるよう `Chord.mid / Song.mid` のChord Track Note配置にも反映する。

Patternは完成伴奏を自動作曲する機能ではなく、曲の骨子を判断するための少数Presetとする。詳細な伴奏編集やDAW級のArpeggiatorは追加しない。

## v0.2 Melody Candidates

Melody Module内に、現在の1小節へ適用するルールベースのMelody候補を3つ表示する。

初期候補:

- 安定: Chord Tone中心、4分音符主体
- キャッチー: 8分音符中心、短い反復を含む
- 浮遊感: 2度 / 6度などScale Toneも混ぜ、長めの音を含む

生成は外部AI / APIを使わず、現在の Key / Scale / Chord / 表示Octave / Bar位置から説明可能なルールで行う。Chord未設定BarではKey / Scaleを基準にする。

候補をタップすると現在BarのMelodyだけを置き換え、他Barは保持する。適用結果は通常の `tracks[role=melody].notes[]` として保存し、AutoSave / Undo / Redo / Demo Player / Melody.mid / Song.midへ既存処理のまま利用する。適用後はPiano Rollで1音ずつ修正できる。

同じ条件で毎回同じ候補だけにならないよう、`↻ 候補を更新` で4つの有限Variation Setを順番に切り替える。各Setでも `安定 / キャッチー / 浮遊感` の役割は維持し、安定案はChord Tone中心、他案もKey / Scaleに沿う。Variation番号はUI状態だけでProject Dataには保存しない。

目的は「完成メロディの自動作曲」ではなく、初心者が3つの方向性を聴き比べ、選び、直しながらメロディを作ること。初期版では1小節単位に限定し、曲全体の一括自動生成や無制限のランダム再生成は持たせない。

## v0.2 New Project

Hubから `＋ 新規Project` を選ぶと、現在のProjectを端末へ保存した上で、別IDの空Projectへ切り替える。旧Projectは削除しない。目的は、起動時に最後のActive Projectが復元される保存仕様を維持しつつ、ユーザーが明示的に別の曲を開始できるようにすること。

切替時はDemo Playerを停止し、旧Projectの保存完了を確認してからreloadする。reload境界では旧ページのvisibility AutoSaveと競合しないよう、次回bootで `main.js` より先に新ProjectをActiveとして保存する。Project一覧・過去Projectを選んで開くUIはこの初期実装には含めない。schemaVersionは2のまま。

## v0.2 Early Sound Sketch Lite

本来v0.4で予定しているSound Sketchのうち、スマホで「音色の方向性」を決める最小機能だけをv0.2-devへ先行導入する。

対象:

- Chord: Keys / Pad / Piano
- Melody: Lead / Keys / Pluck
- Bass: Soft Bass / Synth Bass / Deep Bass
- Tone: Natural / Bright / Soft / Warm / Dark / Airy / Aggressive

目的は最終音色を作ることではなく、「この曲は柔らかいPad系」「MelodyはBrightなLead系」などの方向をDemo段階で決めること。

Sound選択はDemo Playerの軽量Web Audio仮音へ反映し、MIDI Note / Chord Data / Rhythm Dataは変更しない。最終音色はCubasis / Cubase / 各種Plugin側で作り込む。

## Non-goals

Demo Composerでは以下を本格実装しない。

- Mixing
- Mastering
- 高度なAudio Editing
- Vocal Editing
- Plugin Hosting
- 本格Synth設計
- PC DAWの完全再現
- Sound Sketch内の詳細Synth Parameter / FX Rack / Track Mixer
- DAW級のPattern Sequencer / Arpeggiator
- Melodyの曲全体一括自動完成

## AI Philosophy

AIは完全自動作曲家ではなく、候補提示・学習支援・分析・相談役とする。

基本形:

候補を3つ提示
→ ユーザーが選択
→ ユーザーが修正

## Future Assisted Generation

将来機能として、以下の候補生成を検討する。

- Chord候補
- Bass候補
- Melody候補
- Drum候補
- Counter Melody候補

基本思想は完全自動作曲ではなく、

1. 候補を3つ提示
2. ユーザーが選択
3. 手動修正 / 再生成 / 候補の組み合わせ

とする。

初期実装はAPI不要のルールベース生成を優先し、Key / Scale / Chord / BPM / Kick位置など、既存Project Dataから説明可能な候補を生成する。

例:

- Melody: 安定 / キャッチー / 浮遊感
- Bass: Root中心 / Kick連動 / 動き多め

生成結果は必ず通常のNoteデータとして編集可能にする。
