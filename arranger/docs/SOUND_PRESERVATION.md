# Arrangement Lab — Sound Sketch preservation

更新日: 2026-10-14

Demo Composer から SongProject v1 / project.json を介して Arrangement Lab へ曲を渡した場合、Arrangement Lab の試聴では元の Demo Composer Project に保存されている Sound Sketch を優先する。

対象:

- Chord: Demo Composer の Chord Preset / Tone
- Melody: Demo Composer の Melody Preset / Tone
- Counter Melody: Melody と同じ Preset / Tone を使用し、音量のみ控えめにする
- Bass: Demo Composer の Bass Preset / Tone
- Drums: Demo Composer Demo Player と同系統の簡易 Kick / Snare / Hi-Hat 音を使用する

SongProject v1 の Schema は変更しない。Demo Composer 由来の音色情報は既存の `compatibility.demoComposer.legacyProject.instruments` から復元され、Arrangement Lab の `sourceSnapshot.instruments` として参照される。

音色情報が存在しない SongProject（MIDI Analyzer 等から直接来たデータ）では Demo Composer の標準 Sound Preset をフォールバックとして使用する。

Arrangement Lab の A/B/C 比較、Section 試聴、リハモ試聴では比較しやすさのため出力音量のノーマライズは維持するが、Preset / Tone による波形・Filter・Attack / Release・Layer・Vibrato・Formant は元設定を保持する。
