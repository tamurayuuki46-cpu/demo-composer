# Arrangement Lab CHANGELOG

Version: v0.15-dev
更新日: 2026-10-17

【追加】
・「収束モード / Current Plan」を追加し、曲全体 / Section / Drums / 裏メロ単位で「採用 / まだ迷う / 不採用」を記録できるようにした
・Claude純関数コアの `recordEdit` / `applySave` / `resolveCurrentPlan` / Recovery / structure backup を既存Arrangement Labへ統合
・スマホ縦画面用の下部固定判断バー、由来表示、上書き解除、Undo、定型理由、Recoveryの1タップ復元を追加
・same-project rebaseを追加し、Demo Composer往復でrevisionが変わってもPlan IDと生存SectionのCandidate編集を保持。追加Sectionは新source用候補から補い、削除Sectionは落とす
・未決定項目を「Labで決める / DAWで決める」に分け、DAW持ち越しをZIPの `03_notes/SECTION_INSTRUCTIONS.md` 冒頭へ記録
・収束統合専用のNode回帰とMobile Chromium回帰を追加

【変更】
・Plan保存を中央保存経路へ集約。収束補助状態を先、Planを続け、Journalを最後に保存する
・Candidate編集は共通入口で編集前後のfingerprintを比較し、採用中で実発音が変わった枠だけdirtyにする
・Preview / Song.mid / DAW ZIP / Arrangement Plan JSON / SongProject出力は `resolveCurrentPlan` が返す同じCurrent Plan Candidateを使用する
・Drum Fill表示、比較試聴、Exportなど従来の暗黙保存も中央保存経路を通す
・snapshot復元はsourceを古いrevisionへ巻き戻さず、Candidate部分だけを現在sourceへ適用する
・Arrangement Plan Schema 4 / SongProject v1 / Demo Project Schema 3 / PPQ 480 / 4/4を維持する

【修正】
・保存失敗時に新しい収束state / trackerを確定してしまう可能性をなくし、旧state / dirty trackerと保存済み補助状態を保持・復元する
・中央保存の外で変更されたCandidateを通常編集として誤認せず、外部変更としてRecoveryへ送る
・収束補助状態が欠落 / 破損した場合に警告なしで書き出せる経路をなくす
・画面のCurrent PlanとSong.mid / DAW ZIPで別Candidateが使われる経路を統一する

【未対応】
・Android Chrome実機での片手操作、固定下部判断バー、PWA再読込の最終確認
・Cubasis / Cubase実機でのCurrent Plan Song.mid / DAW ZIP取込確認
・収束補助状態は端末localStorage専用のため、Plan JSON単体では別端末へ移らない
・stable tagは実機確認完了まで作成しない
