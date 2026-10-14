# Music Project Home

## 目的

Music Project Homeはアプリ一覧ではなく、1曲について「今どこまで進んだか」「何が未決定か」「次に何をするか」を5秒で確認するための司令塔です。

## 画面の優先順位

1. 今ここ
2. 未決定（最大3件）
3. 次にやること（1件）
4. 制作フロー
5. 今日決めたこと / 次回やること

詳細情報は下へ送り、スマートフォンでは上から見れば次の行動が分かる構成を優先します。

## 制作フロー

作曲シート → 必要ならMIDI Analyzer → Demo Composer → Arrangement Lab → 必要ならCubasis → Cubase / PC DAW

MIDI AnalyzerとCubasisは必須工程ではありません。

## SongProject v1との境界

Project HomeはSongProject v1を読み取り、現在地と未決定を表示します。Project Homeの都合でSongProject v1のSchemaや各アプリの所有権境界を変更しません。

「今日決めたこと / 次回やること」はHome専用localStorageに保存します。

- Key: `demo-composer.project-home.notes.v1:<project-id>`
- SongProject本体へ自動書き込みしない
- 曲の品質や作曲能力の評価には使用しない

Demo Composerへの受け渡しは、ユーザーが明示的にSong Project JSONを開き「読み込んだ曲をDemo Composerへ」を押した場合だけ行います。

## 公開main互換

公開mainのProject Homeは、mainに存在しない開発専用モジュールへ依存しません。作曲シートは公開済みURLを利用し、未公開のRepository内パスを公開画面から参照しません。

## Android-first UI

主要操作は48px以上のタップ領域を維持し、現在地・未決定・次の一手を最上段に配置します。ドラッグや長押しだけに依存する操作はProject Homeでは採用しません。

## Stable条件

mainへの公開はCI/build/回帰合格を条件とします。stable tagは以下の実機確認後のみ作成します。

- Android実機で主要表示・操作
- Song Project JSON読込 / Backup / 再読込
- Demo Composerへの受け渡し
- 必要なCubasis / Cubase実機引き継ぎ

最終更新: 2026-10-15
