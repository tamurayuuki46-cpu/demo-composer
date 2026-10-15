# Mobile-first Workflow — main公開版

更新日: 2026-10-14

公開mainの基本導線は次の5段階とする。

`⓪ 作曲シート → ① MIDI解析（任意） → ② Demo Composer → ③ Arrangement Lab → ④ DAW`

## ⓪ 作曲シート

公開mainではProject HomeのClaude Artifact登録欄を入口とする。develop-onlyの内蔵Sheet Moduleはmainへ持ち込まず、存在しない`/sheet-app/`へリンクしない。

## ① MIDI解析

任意工程。参考MIDIや素材を分析したい場合だけMIDI Analyzerを使用する。飛ばして②へ進める。

## ② Demo Composer

作曲工程。受け渡しカードでは次に必要な操作だけを主ボタンとして強調する。MIDI Analyzerからの受け取りは自動反映せず、「受け取った曲を反映」をユーザーが押す。

## ③ Arrangement Lab

編曲工程。Sectionがまだ無くても、SongProject v1にメロディ/コード/ベース/ドラム等の音楽素材があれば、変換Adapter内で1〜32小節のスケッチSectionを一時補完して開始できる。1小節の場合は「1小節スケッチ」。元SongProjectのcompositionへSectionを自動書き戻ししない。

## ④ DAW

Cubasis / Cubase等で本制作へ進む。stable tagはAndroid実機と必要なDAW実機確認後のみ作成する。

## 互換性

Demo Composer Project Schema 3 / SongProject v1 / Arrangement Plan Schema 4は変更しない。JSONファイルはバックアップとして保存し、同じChromeのlocalStorageは補助的な一時受け渡しに限定する。
