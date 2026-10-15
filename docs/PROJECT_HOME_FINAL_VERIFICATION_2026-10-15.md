# Music Project Home final verification — 2026-10-15

対象: `integration/main-develop-reconcile-20261015`

- 検証開始commit: `35958efd79c39d45c6c893974fd3311056c6abaa`
- Music Project Home: `v0.18-dev`
- Demo Composer: `v0.15-dev`
- Arrangement Lab: `v0.13-dev`
- Composition Sheet latest: `v0.9.1-dev`
- 結果: ローカル最終確認PASS

この確認はmain/develop統合候補のMusic Project Homeを対象にした。コード・Schema・Versionは変更していない。公開済みversion、restore / backup branch、tagは変更していない。

## 確認した導線

- Homeの制作フローは `作曲シート → 必要ならMIDI解析 → Demo Composer → Arrangement Lab → Cubasis / Cubase` の順で表示される。
- 作曲シートはcanonical `../sheet-app/?embed=1`を開き、最新版`v0.9.1-dev`と初心者入力を表示する。
- Home内の作曲シートでは内側の曲データメニューを隠し、Home側の曲データメニューだけを表示する。
- SongProject v1を読み込むと、Project状態に応じた次の工程を表示し、Demo Composerへの一時handoffを同一SongProjectのまま保存する。
- 360 / 390 / 430 / 1440pxで横方向overflowとConsole errorがないことを確認した。

## 保存・再読込

- Homeの「今日決めたこと」「次回やること」を保存し、ページ再読込後に同じSongProjectを開いた時に同じ内容が復元されることを確認した。
- Homeから保存したSongProject JSONを再読込し、JSON valueとして同一であることを確認した。
- 曲データメニューのSong memoを360 / 390 / 430pxで保存・再表示できることを確認した。

## SongProject v1互換性

- SongProject v1 / Demo Project Schema 3 / Arrangement Plan Schema 4 / PPQ 480 / 4/4を維持した。
- Sheet / Demo Composer / Arrangement Labの各境界を通して、`analysis`、`reference`、`assets`、`composition`、`arrangement`、`lineage`、`compatibility`を他appが消さない回帰を確認した。
- 実ブラウザのArrangement Lab → SongProject JSON書き出しでも、Analyzer所有の`analysis` / `reference` / `assets`とDemo Composer所有の`composition`が保持された。

## DAW-ready gate

以下を実ブラウザで連続して確認した。

1. `arrangerProjectId`と採用済みArrangementだけを持つSongProjectをHomeで開く。
2. Homeは「DAWへ渡す準備中」を表示し、「完了」にはしない。
3. Arrangement Labの公式Explore modeで編曲案を画面上から採用する。
4. 表示されている`Song.mid（採用案）`を押し、実際にダウンロードされたファイルの先頭が`MThd`であることを確認する。
5. その後に画面上からSongProject v1を書き出し、`export.lastSongMidiAt`が記録されていることを確認する。
6. 書き出したSongProjectをHomeへ再読込し、「Cubasis / Cubaseで仕上げる段階」へ進むことを確認する。

最初の個別試行ではBeginner modeの非表示領域にある採用ボタンを直接待ってtimeoutした。コードは変更せず、既存ブラウザ回帰と同じ公式Explore modeへ移動し、表示されたボタンを通常clickして再実行した。force click、DOM書き換え、保存データの直接注入は使っていない。

## 実行結果

- 関連静的・build検証: 16 command PASS
  - Home構文、Home workflow、最新版Sheet接続、SongProject v1各境界、曲データメニュー、Song.mid構造、PWA、build cache、公開version資産保持
- 公開build: `198` PWA precache entryで生成成功
- Home + embedded Sheet browser: 360 / 390 / 430 / 1440px PASS
- Home曲データメニュー + memo browser: 360 / 390 / 430px PASS
- Home → Arrangement Lab → 実Song.mid → SongProject → Home browser: 390px PASS
- buildで生じた`dist/`生成差分は検証後に復元し、生成差分をcommit対象に含めていない。

ログ:

- `../reconciliation-evidence/project-home-final-static.log`
- `../reconciliation-evidence/project-home-final-browser.log`
- `../reconciliation-evidence/project-home-final-browser.cjs`
- `../reconciliation-evidence/project-home-final-browser-attempts.md`

## 制限とrelease判定

- 統合候補commitそのもののhosted CIは未実行。push / PR作成後に同一headで確認が必要。
- Android実機のChrome / PWA、Files / Download / Shareは未確認。
- Cubasis実機とCubase実機のImport / 再生 / Tempo / 4/4 / Track / Channel / Marker / Note timingは未確認。
- 旧Composition Sheet v0.6 / v0.8は統合全体の初回browser runで一時失敗し、コード無変更の単独rerunでPASSした。intermittent原因は未確定で、hosted CIで再確認する。
- 以上の実機gateが残るためstableは未認定。stable tag作成不可。

## 結論

Music Project Home `v0.18-dev`は、統合候補上で司令塔として必要な導線、保存再読込、SongProject v1互換、実Song.mid後だけ進むDAW-ready gate、公開build、Android相当幅のローカル回帰を満たした。追加の一般UX変更は行わない。
