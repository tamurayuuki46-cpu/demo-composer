Version: v0.15-dev
更新日: 2026-10-17

## 2026-10-17 — Arrangement Lab v0.15-dev（収束モード統合候補）

【追加】
- 全体 / Section / 個別の採用・まだ迷う・不採用、定型理由、上書き解除、Undo、Recovery。
- 中央保存、dirty共通入口、validation gate、編集済み候補poolの再読込保持。
- 同一projectIdのrebase、Current Plan共通Export、未決定のLab/DAW選択とZIP指示。

【修正】
- 保存失敗でExportまで停止する経路を解消し、state/trackerを保存成功後だけ更新。
- snapshotによるsource revision巻き戻し、曲間Journal混在、再読込時の編集済み判断参照切れを防止。

【互換性・状態】
- Plan Schema 4 / SongProject v1 / Demo Schema 3 / PPQ 480 / 4/4を維持。本体とHomeは変更しない。
- ルートVERSIONはDemo Composer v0.17-devを維持。Labの正本はarranger/VERSION。
- 収束補助状態はPlan JSONだけでは別端末へ移らない。
- develop向けPRのみ。main公開・自動merge・stable認定は行わない。
- Android / Cubasis / Cubase実機未確認。検証結果はdocs/CONVERGENCE_VERIFICATION_v0.15-dev.md。
