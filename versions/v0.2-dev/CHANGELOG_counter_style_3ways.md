Version: v0.2-dev
更新日: 2026-10-11

【追加】
- Counter Melody候補を Sparse（隙間型）/ Active（動く型）/ Hook（フック型）の3系統として整理
- 候補説明に小さな参考イメージを追加: Sparse=米津系 / Active=YOASOBI系 / Hook=Oasis系
- 参考名は特定曲のコピー・旋律再現ではなく、裏メロの役割を理解するための分類として明記

【変更】
- Sparse: メインMelodyの休符・隙間へ短いレスポンス
- Active: 8分音符中心でコード感と推進力を追加
- Hook: 3音の覚えやすい輪郭を小節ごとに反復
- 候補IDを `sparse / active / hook` に変更。候補IDはProject Dataへ保存されないため既存Project互換性に影響なし

【修正】
- Counter Melody smoke testを新3系統に合わせて更新

【未対応】
- 裏メロのPiano Roll内直接編集は未対応。細部は現状Cubasis / Cubase側で調整

Schema: 変更なし（schemaVersion 2）
復元点: restore/v0.2-before-counter-style-3ways
作業Branch: chatgpt/v0.2-counter-style-3ways
