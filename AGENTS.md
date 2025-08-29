# リポジトリ ガイドライン

## プロジェクト構成とモジュール構成

- `src/`: TypeScript のソース。エントリは `src/index.ts` から開始。
- `docs/`: API 仕様やアーキテクチャのメモ（例: Copilot API など）。
- `data/`: ローカル検証用のデモ入力（`demo-usage.csv`, `demo-*.json`）。
- 予定モジュール（README 参照）: `src/api/`, `src/models/`, `src/services/`, `src/ui/`。

## ビルド・テスト・開発コマンド

- 依存関係のインストール: `pnpm install`
- 開発実行（TS を直接実行）: `npx tsx src/index.ts`
- TypeScript のビルド: `npx tsgo`
- ビルド成果物の実行: `node dist/index.js`
- 依存追加: `pnpm add <pkg>`、開発依存: `pnpm add -D <pkg>`
- テスト: `pnpm test`（プレースホルダ）。テストランナー追加までは `data/` のデモデータと手動実行で確認。

## コーディングスタイルと命名規則

- 言語: TypeScript（strict）。`module: nodenext`、`target: esnext`。
- `any` は禁止。`const` を優先。純粋関数を使用。副作用がある場合は `Result<T, E>` を返す。
- `class` は避け、関数 + プレーンオブジェクトを使用。
- インデント: 2 スペース。行幅: およそ 100–120。
- 命名: ファイルは `kebab-case.ts`、関数/変数は `camelCase`、型は `PascalCase`、環境変数は `UPPER_SNAKE_CASE`。
- 型チェック: `npx tsc -p tsconfig.json`。リンターは未設定のため、整形を一貫させる。
- 本リポジトリ固有の厳格なルールは `CLAUDE.md` を参照。

## テストガイドライン

- フレームワーク: 未設定。推奨: `ts-node/tsx` と併用する `vitest` または `jest`。
- テスト命名（追加時）: ソース近傍または `src/` を反映した `tests/` 配下に `*.spec.ts`。
- `data/` のフィクスチャを用いて、パース、メトリクス、ユーザー管理フローを検証。
- パース、サービスロジック、API アダプタのカバレッジを目標とする。

## コミットおよびプルリクエストのガイドライン

- コミット: Conventional Commits（`feat:`、`fix:`、`docs:`、`chore:`、`refactor:`）に従う。メッセージは命令形・スコープ付き（例: `feat(api): add seats fetch`）。
- PR に含める内容: 明確な説明、動機、変更前後のノート、関連 Issue、主要フローの CLI 出力/スクショ。`data/` を用いたテストノートやデモ手順も追加。
- 変更は小さく焦点を絞る。挙動や API が変わる場合は `README.md`/`docs/` を更新。

## セキュリティと設定

- `.env.example` から `.env` を作成し、`GITHUB_TOKEN` と `GITHUB_ORG` を設定。
- シークレットはコミットしない。トークンのスコープは README 記載の範囲に限定。
- 開発ではローカルのデモデータを優先。テストではネットワーク呼び出しをスタブ化。
