# 作曲シート v0.6
原文31枚のうち `01_作曲シート_記入用` を先頭へ移動する。原文とセル座標は変更しない。
保存は既存SongProject v1の `compatibility.compositionSheet.fullWorkbook` に保持する。Schema変更なし。
簡易版は現在の曲から読み取り専用で表示。空欄は非表示。曲を取り違えないよう別Projectの端末保存は参照しない。
非公開SitesとGitHub Pagesは別originのため、JSONを保存・読み込みして引継ぐ。自動同期しない。
Driveはユーザーの共有画面選択で保存。JSON内容を .json.txt / text/plain として共有し、同じファイルを復元できる。共有キャンセルで保存済みとは表示しない。非対応時は通常JSONダウンロードとアップロード案内。
