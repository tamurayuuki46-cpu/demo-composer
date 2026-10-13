# Sound Module

Sound Sketch Liteをv0.2-devへ先行実装済み。

- Chord: Keys / Pad / Piano
- Melody: Lead / Keys / Pluck
- Bass: Soft Bass / Synth Bass / Deep Bass
- Tone: Natural / Bright / Soft / Warm / Dark / Airy / Aggressive

選択結果は既存 `project.instruments[]` に保存し、Undo / Redo・AutoSave対象とする。
Demo Playerの仮音色だけへ反映し、MIDI Note / Chord Data / Rhythm Dataは変更しない。
Section再生でも同じSound設定を使う。

v0.4ではLiteを基礎にPreset分類を整理するが、本格Synth / FX / Mixer / Plugin Hostingは作らない。
最終音色の作り込みはCubasis / Cubase / 各種Pluginへ任せる。
