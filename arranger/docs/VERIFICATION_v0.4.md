# v0.4 verification

Story: source JSON → category/method variants → actual chords/voicing/part notes → scope-aware adoption → shared preview/MIDI → Schema4 save/restore/offline。

- 50 unique methods (14 harmony / 16 counter / 15 development / 5 linked).
- Rich fixture: all 50 families have applicable musical transformations; 157 variants verified. Inapplicable/no-op variants show reasons.
- Unit/integration: exact MIDI Note roundtrip for melody/counter/harmony/bass/drums/A/B, PPQ/channel10, source immutability, unrelated Sections, source melody/bass locks, rhythm preservation, A/B nonoverlap, old Schema3 and old seven tools after Overrides.
- Empty material and PPQ96/960 coverage. Android/Cubasis/Cubase hardware not tested.
- Browser CI: 360px all 50 UI methods, 390/430px categories and representative flows, original/variant audition, scoped adoption, A MIDI, save/reload/offline/console.
