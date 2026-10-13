# Song Project統合後 回帰確認記録

更新日: 2026-10-13
対象Branch: `develop`
基準Commit: `0f67fb8713a457bb55ac3bad8b3d6e74d2c52c44`

## 対象Version

- Demo Composer: `v0.4-dev`
- Arrangement Lab: `v0.5-dev`
- Song Project: `schemaVersion: 1`

## 復元ポイント

変更前:
- `backup/v0.3-dev_v0.4.1-dev_before_songproject`

統合後:
- `backup/v0.4-dev_v0.5-dev_songproject-integrated`

## 自動回帰確認

### Demo Composer

- Project list / Open / Duplicate / Delete
- Save / Reload
- Chords / Melody / Counter Melody / Bass / Drums
- A/B comparison
- Undo / Redo
- MIDI import / Draft.mid export
- project.json import
- Static build

### Song Project v1

- Empty project creation
- Demo Project → SongProject conversion
- JSON export / import
- Demo → Arrangement read
- Arrangement ownership-safe writeback
- SongProject再Export
- Demo再読込
- composition保持
- arrangement保持
- Legacy snapshot保持
- final Song.mid generation

### Arrangement Lab v0.5

- 既存core / regression / features / music-labs
- v0.5 six-room workflow tests
- v0.5 decision/history workflow tests
- Song.mid / Section Marker
- Static build
- Mobile Chromium 360 / 390 / 430px
- offline PWA
- PWA update regression

## CIとは別のBuild Artifact確認

GitHub Pages artifactをダウンロードし、ZIP整合性を確認。

- Build ZIP SHA-256: `edeec99eb1fae06c13536470a40625ea0b45b61b9afe78783d41909f2eab47bd`
- 展開ファイル: 180
- JavaScript syntax: 119 files checked
- HTTP static open: `/`, `/arranger/`, `/project-home/` = 200

## Google Drive backup

- Demo Composer: `versions/v0.4-dev_songproject_integrated_2026-10-13/`
- Arrangement Lab: `versions/v0.5-dev_songproject_integrated_2026-10-13/`
- 各Versionに Build ZIP / CHANGELOG / BACKUP_MANIFEST を保存
- `latest/`にも最新Buildを保存

## 実機確認として残す項目

以下はCI/クラウド環境だけでは完了扱いにしない。

- Android Chrome実機のTouch / Scroll / Rotation
- 実AndroidでのIndexedDB / localStorage再読込
- 実Android PWA install / update
- Cubasis / Cubaseで`Draft.mid` / `Song.mid`読込
- Tempo / Time Signature / Section Marker / Track配置確認

mainへの統合・安定版認定は、上記実機確認後に判断する。
