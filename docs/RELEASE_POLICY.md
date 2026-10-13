# Release Policy

更新日: 2026-10-13

## Branch / Tag policy

- `develop`: 開発統合用。機能開発・修正は原則としてfeature/chore branchからPRで統合する。
- `main`: 自動テスト合格版。build、既存回帰、SongProject関連CI、対象アプリの主要ブラウザCIが成功した統合版を置く。Android実機やCubasis/Cubase実機が未確認でもmainへ統合してよい。
- `stable tag`: 実機確認済み版。Android実機の保存・再読込・PWA更新・主要操作、およびMIDI出力がある場合はCubasis/Cubase実機取込を確認した版だけに付与する。

## 公開

- GitHub Pagesの公開元は`main`のみとする。
- `develop`へのpushでは公開しない。
- main向けPRではPages Buildを確認し、main merge後にPages Deployを実行する。

## main統合前の必須条件

1. 現在Versionを確認する。
2. mainの現headから復元Branchを作る。
3. developのbuild / syntax / unit / regression / integration / browser CIを可能な範囲で全て成功させる。
4. CHANGELOG / VERSION_HISTORY / 関連docsを更新する。
5. develop→mainはPRで統合し、mainへ直接編集しない。
6. main統合後のCIとGitHub Pages公開結果を確認する。

## stable tag条件

stable tagは次を満たした時点で作成する。

- Android実機で主要画面・主要操作が正常。
- IndexedDB / localStorage保存と再読込が正常。
- PWA更新・オフライン復帰が正常。
- MIDI出力がある場合、Cubasis / CubaseでTrack、Tempo、Time Signature、Marker、Drums ch10等を確認。
- Basic Pitch等の長時間処理がある場合、代表的な実Audioでメモリ・キャンセル・再試行を確認。

実機未確認のmainにはstable tagを付けない。

## Backup

- 大規模変更前、develop→main統合前、stable tag作成前に復元点を残す。
- GitHubはソース復元履歴、Google Driveは検証済みBuild / CHANGELOG / BACKUP_MANIFESTの保存先として使う。
- 過去Branch / Tag / Versionは削除・上書きしない。
