# UI Migration Plan: CSR → RSC (Single Server)

目的: 単一のサーバー（BFF）で鍵を秘匿しつつ、UIは段階的にCSRからRSC/SSCへ移行する。

フェーズ1: CSR（完了）
- apps/web に Vite + React を作成。
- グラフは Recharts。/api/data をフェッチして描画。
- Hono から /app/* でビルド成果物を静的配信。

フェーズ2: shadcn/ui + Tailwind
- Tailwind, postcss を導入し、shadcn/ui の Chart primitives を採用。
- 既存 Recharts を shadcn スタイルでラップし段階移行。

フェーズ3: RSC/SSC 導入（鍵の秘匿強化）
- Vite の RSC サポートまたは互換プラグインを採用（実験的）。
- /app のデータ取得をサーバーコンポーネントへ移し、機微キーをサーバー側に限定。
- キャッシュ戦略（revalidate）とストリーミングを追加。

フェーズ4: 単一配布
- Hono ビルド時に apps/web をビルドし、dist を同梱配布。
- CI で build:web → start サーバーが dist を配信。

メモ
- 既存の SSR ダッシュボードは残しつつ、新UIは /app で独立。
- 段階移行により機能を止めずに置き換え可能。
