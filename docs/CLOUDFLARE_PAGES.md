# Cloudflare Pages Fallback

Demo ComposerのVercel障害・Deployment上限時に使う予備公開先。

## 方針

- GitHubをコードの正本とする
- Vercelは既存の公開先として維持する
- Cloudflare Pagesを第二公開先として追加する
- Productionは`main`
- `develop` / `chatgpt/*` / Pull RequestはPreview確認用
- アプリ本体・Schema・保存方式はCloudflare対応のために変更しない

## Cloudflare Pages設定

Cloudflare Dashboard → Workers & Pages → Create application → Pages → Import an existing Git repository から、以下を設定する。

- Repository: `tamurayuuki46-cpu/demo-composer`
- Project name: `demo-composer` を第一候補とする
- Production branch: `main`
- Framework preset: None / no framework
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root

Demo Composerは既存の`scripts/build-static.mjs`で `index.html` / `src/` / `public/` を`dist/`へコピーするため、Cloudflare専用Buildは追加しない。

## Preview運用

Git連携後は、Pull Requestや非Production branchのPushに対してCloudflare Pages Preview Deploymentを利用する。

想定用途:

1. `chatgpt/*` / `claude/*` branchで実装
2. PR作成
3. Cloudflare Preview URLをAndroid Chromeで開く
4. 実機確認
5. CI / 実機確認後に`develop`へ統合
6. stable条件を満たしたものだけ`main`へ統合

## Vercelとの役割分担

- Vercel: 既存の通常Preview / 公開先
- Cloudflare Pages: VercelのDeployment上限・障害時のFallback、第二Preview環境

片方のHosting障害を理由にRepositoryやアプリ仕様を変更しない。

## 注意

- `main`はstable条件を満たすまで変更しない
- Cloudflareの公開URLを固定URLへ切り替える場合も、Vercel URLを削除しない
- Cloudflare用にFramework導入やSPA Router追加をしない
- Secret / API TokenはRepositoryへCommitしない
- Pages Project作成後、必要ならCloudflare Dashboardの設定を正本として`wrangler`設定を後から取得する。手書きでWrangler設定を先に追加しない

## 復元点

Cloudflare Pages導入前:

- `restore/v0.1-before-cloudflare-pages`

## 最終確認項目

- Cloudflare PagesのProduction buildが成功する
- `*.pages.dev`でHubが表示される
- Android ChromeでHub / Chord / Melody / Rhythmが切り替わる
- Demo Playerが再生できる
- PR Preview URLが発行される
- Vercel側の既存URLが引き続き利用できる
