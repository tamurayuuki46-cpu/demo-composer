# 実機確認チェックリスト

更新日: 2026-10-17。Arrangement Lab v0.15-dev統合候補。自動ブラウザ試験とAndroid実機試験を区別する。

## A. 起動
- [ ] Android Chrome / PWAで起動しVersionがv0.15-dev。
## B. 入力
- [ ] Demo Composer Project / SongProject v1 / Planを読み込める。
## C. 比較
- [ ] A/B/C候補試聴とCurrent Plan試聴、部分試聴を聴き比べる。
## D. 保存
- [ ] 採用・保留・不採用・Undo後、端末再起動でも保存内容が残る。
## E. PWA
- [ ] 更新後に旧cacheと混在せず、オフライン再起動できる。
## F. DAW
- [ ] Cubasis / CubaseでPPQ 480、4/4、Tempo、Marker、Drums ch10、各パートを確認する。

## G. 収束モード
- [ ] 全体 / Section / Drums / 裏メロの判断と由来、1タップ上書き解除。
- [ ] 通常判断で確認ダイアログとキーボードが出ない。
- [ ] 同じ曲のrevision更新で判断とPlan IDが残る。
- [ ] snapshot復元後も現在source revisionが維持される。
- [ ] 構成変更の退避、元の構成に戻した時の復元通知、「元の判断のまま採用」。
- [ ] 2曲目で判断が混ざらない。
- [ ] アプリデータ削除後、判断履歴のあるPlanを読み込むと「収束判断が見つかりません」。
- [ ] この警告中は黙ってExportされない。
- [ ] Current PlanとSong.midが一致する。
- [ ] 未決定ゼロでは未決定確認が出ない。
- [ ] 「DAWで決める」がZIPの03_notes/SECTION_INSTRUCTIONS.mdへ出る。
- [ ] 保存容量不足でもJSON / MIDIを書き出せる。
- [ ] 360 / 390 / 430px縦画面で固定バーが主要操作を隠さず片手で押せる。

制約: **収束補助状態はPlan JSONだけでは別端末へ移らない。**
実機の各項目は未確認。Android / Cubasis / Cubase実機確認後にのみstableを認定する。
