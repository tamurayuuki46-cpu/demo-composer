# 主旋律1小節のA/B比較（v0.2-dev）

Aは比較開始時の現在案、Bは既存のメロディ候補。候補ごとの「現在案とA/B比較」から開始する。従来の直接適用と「聴く」は保持する。

## 動作
- 同じ小節、伴奏、BPM、音色でA/Bを試聴する。切替は小節の頭から再生する。
- 差分は音高・開始位置・長さ・Velocityを比較し、同じ音／取り除く音／加える音の数を示す。Note IDだけの違いは差にしない。
- 試聴・A採用・閉じるはProject、revision、Undo、AutoSaveを変更しない。
- B採用だけ既存のupdateMelodyNotesを通し、Undo1手で戻す。対象小節以外と他Trackを保持する。同じ音の候補は採用ボタンを無効にする。
- 任意のProject編集（Undo/Redo/Import/Key変更を含む）で比較を破棄する。採用・試聴時にもProject IDとrevisionを照合する。
- 小節・編集Track・画面の切替で比較を閉じ、試聴を停止する。reload/Project切替でも比較は残らない。
- Aが空でも比較できる。伴奏がある場合はAでは伴奏だけ鳴る。

## 保存と責務
比較状態はメモリのみ。schemaVersion 2 / PPQ 480 / 4/4 / project.json正本 / IndexedDB DB_VERSION 1を維持する。MIDIは採用した通常Noteだけ出力する。
Coreのmelody-comparison.jsが比較と仮Projectを作る。MelodyのUIから共通auditionイベントで再生を依頼し、Module間の直接呼出しを増やさない。

## 対象外
永続候補、採用理由の保存、設計メモUI、最後の2音の変形、コード・裏メロ・音色A/Bは次工程。Android実機とCubasis/Cubase実機確認は別途必要。

## 復元点
24e4ffedd6f48a36b0b13b8c6ca83dfda6d56b9e
restore/v0.2-before-melody-ab-20261012

## 確認
npm run test:melody-ab / test:syntax / test:history / test:melody / test:css / test:midi / test:import / build
