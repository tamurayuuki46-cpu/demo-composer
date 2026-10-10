# GitHub Pages Fallback

## 目的

VercelのDeployment上限・障害時でも、Android ChromeでDemo Composerを実機確認できる第二公開先としてGitHub Pagesを利用する。

GitHubをコードの正本とし、Vercelは削除しない。

## 方針

- 開発確認用の公開元は `develop`
- `main` はstable専用のため、この導入では変更しない
- アプリ本体 / Project Data / Schema / MIDI構造は変更しない
- 既存の静的Build `npm run build` → `dist/` を再利用する
- GitHub PagesはVercelのFallbackとして扱う

## Workflow

設定ファイル:

`.github/workflows/pages.yml`

通常フロー:

1. `develop` へPush / Merge
2. Node.js 22で `npm run build`
3. `dist/index.html` の存在を確認
4. `dist/` をGitHub Pages ArtifactとしてUpload
5. GitHub PagesへDeploy

Pull RequestではBuild確認のみ行い、PagesへのDeployは行わない。

## 想定URL

GitHub Pagesが有効な場合の標準URL:

`https://tamurayuuki46-cpu.github.io/demo-composer/`

実際の公開URLはGitHub Actionsの `github-pages` Environmentに表示されるURLを正とする。

## Private Repositoryについて

このRepositoryはPrivate。

GitHub PagesのPrivate Repository対応はGitHubの契約プラン条件に依存する。プランが対応していない場合はPagesを有効化できない。

その場合はアプリ側の問題ではないため、Vercelを継続利用するか、Netlify等の別Fallbackへ切り替える。

## 初回だけ必要なGitHub設定

GitHub Actionsからの初回自動有効化は `Resource not accessible by integration` で失敗したため、Repository側でPagesを一度だけ有効化する。

1. GitHubで `tamurayuuki46-cpu/demo-composer` を開く
2. `Settings`
3. 左メニューの `Pages`
4. `Build and deployment` のSourceを `GitHub Actions` にする
5. 保存後、`develop`へのPush / MergeでWorkflowを再実行する

この初回設定後は、通常はGitHub Actionsが自動Deployする。

## 動作確認結果

GitHub Actions run `38046796252` で以下を確認済み。

- Checkout: 成功
- Node.js 22 setup: 成功
- `npm run build`: 成功
- `dist/index.html` 検証: 成功
- Pages初回作成: GitHub App権限制約により失敗

つまり、静的Build自体は正常で、残りはGitHub Pagesの初回有効化だけ。

## 触らない部分

- `main`
- `milestone/v0.1-feature-complete`
- schemaVersion 1
- PPQ 480
- 4/4固定
- Module Ownership
- `project.json`を正本とする方針
- Demo Player / MIDI / Storageの実装

## 復元点

GitHub Pages導入前:

`restore/v0.1-before-github-pages`

## Vercelとの使い分け

- Vercel: 自動配信は停止中（`vercel.json` の `git.deploymentEnabled: false`）。設定は残してあり、必要なら再開できる
- GitHub Pages: 現在の公開確認先（Android確認）
- GitHub Repository: コードと履歴の正本

どちらのHostingを使ってもアプリ本体の仕様は同一とする。
