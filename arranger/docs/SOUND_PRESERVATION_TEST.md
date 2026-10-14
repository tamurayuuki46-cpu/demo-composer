# Sound preservation regression

Version: v0.12-dev
更新日: 2026-10-14

Arrangement Lab の試聴は Demo Composer 由来の Sound Sketch を保持する。

自動確認:

- SongProject v1 の `compatibility.demoComposer.legacyProject.instruments` に Chord / Melody / Bass の Preset / Tone を保持
- Arrangement Lab 変換後の `sourceSnapshot.instruments` を試聴で参照
- Chord=Strings / Bright を渡したケースで、旧固定 triangle ではなく Strings の sawtooth layer が発音されることを確認
- 360 / 390 / 430px Mobile Chromium で A/B/C、Section試聴、リハモ試聴の発音と停止を確認
- 音色情報が無いSongProjectではDemo Composer標準Presetへfallback
- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4は変更しない

実機確認:

- Android端末スピーカーでDemo ComposerとArrangement LabのChord / Melody / Bassの音色が同じ方向に聞こえること
- Cubasis / Cubase確認はstable tag前に実施
