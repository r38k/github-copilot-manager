# Web UI (CSR) Overview

- エントリ: `apps/web/`（Vite + React）。
- 開発: `pnpm dev:web`（API は `http://localhost:3000/api` にプロキシ）。
- ビルド: `pnpm build:web` → 成果物は `apps/web/dist/`。
- 配信: サーバー (`src/index.ts`) が `/app/*` で `apps/web/dist` を静的配信。

機能
- 折れ線グラフ: `ユーザー数の推移`（日/週/月/年 切替、累積ユニーク併記）。
- データ取得: 優先 `/api/data`（Honoサーバーの統合データ）。失敗時は `/data.json` にフォールバック。

今後の予定（RSC/SSC）
- Tailwind + shadcn/ui Chart の導入。
- Vite の RSC サポートを評価し、サーバーコンポーネントへ段階移行。

データソースの切替（CSV/API）
- CSV: `data/` にCSVを置くと自動検出（最新ファイルを使用）。`pnpm web:data` で `apps/web/public/data.json` を生成。
- アップロード: `/api/csv/upload` でも登録可（ただし開発中は `data/` 直置きが簡便）。
- API: `.env` に `GITHUB_TOKEN` と `GITHUB_ORG` を設定すると自動でGitHub API経由へ切替（サーバー側）。
