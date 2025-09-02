# CLAUDE.md

このファイルは、本リポジトリでコード作業を行う際の Claude Code（claude.ai/code）向けガイダンスです。

## プロジェクト概要

GitHub Copilot Managerプロジェクト。TypeScript/Node.jsベースで開発。

## 開発コマンド

### TypeScriptファイルの実行
```bash
npx tsx src/index.ts
```

### TypeScriptのコンパイル
```bash
npx tsgo
```

### パッケージ管理（pnpm使用）
```bash
pnpm install  # 依存関係のインストール
pnpm add <package>  # 依存関係の追加
pnpm add -D <package>  # 開発依存関係の追加
```

## TypeScriptコーディング規約

**必須ルール:**
- `any`型の使用は厳禁。すべての型を明確に定義すること
- `let`の使用を避け、`const`を使用すること
- 純粋関数をベースに実装すること
- 副作用のある関数では`Result<T, E>`型を使用してエラーハンドリングを行うこと
- `class`は使用せず、関数とオブジェクトで実装すること

## プロジェクト構造

- `/src/` - TypeScriptソースコード
- `/src/index.ts` - メインエントリーポイント
- `tsconfig.json` - TypeScript設定（strict mode有効）
- `package.json` - 依存関係とスクリプト定義

## TypeScript設定

- モジュールシステム: `nodenext`
- ターゲット: `esnext`
- Strictモード有効
- 追加の厳格チェック: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`

## 開発方針

### 実装フロー（重要）
1. **テストファースト開発**: 新機能実装前に必ずテストを書く
2. **TODO.mdの更新**: 実装の進捗を小まめに記録する
3. **Result型の徹底**: すべてのI/O操作でResult<T,E>型を使用

### テストコマンド
```bash
pnpm test          # テスト実行
pnpm test:watch    # ウォッチモード
```

### サーバー起動
```bash
pnpm tsx src/server.tsx  # 開発サーバー起動（http://localhost:3000）
```

## 進捗記録

### 2025-08-30 実装状況
- ✅ SSR/サーバ基盤（Hono + React）実装完了
  - Honoサーバー、APIエンドポイント、SSRページ
- ✅ データモデル/統合サービス実装完了
  - IntegratedData型、統合サービス、Result型でのエラーハンドリング
- ✅ 基本的なUIでのデータ表示実装完了
  - 座席サマリ、利用状況、課金見積もり、ユーザー一覧
- 🚧 テストカバレッジ拡充中
  - integration.test.ts作成済み、追加テスト必要
- ⏳ CSVレジストリ拡張（アップロード機能）未着手
- ⏳ 実GitHub API接続（octokit）未着手
- ⏳ チャート表示（recharts）未着手

### 次の実装予定（テストファースト）
1. ✅ CSVアップロードサービスのテスト作成済み
2. ✅ WebAPIエンドポイントのテスト作成済み  
3. ✅ データ統合サービスのテスト作成済み
4. ⏳ 実装フェーズ開始予定

### テスト作成完了項目
- `src/services/csv-upload.test.ts` - CSV アップロード機能
- `src/server.test.ts` - index.ts のサーバー機能テスト
- `src/services/data-integration.test.ts` - データ統合サービス

### 実装する機能仕様（テストで定義済み）
1. **CSVアップロード機能**
   - ファイルバリデーション（CSV形式、重複チェック）
   - メタデータ管理（ID、ハッシュ、アップロード日時）
   - CRUD操作（アップロード、リスト、取得、削除）

2. **Web API**  
   - `GET /api/health` - ヘルスチェック
   - `GET /api/data` - 統合データ取得
   - `POST /api/csv/upload` - CSVアップロード
   - `GET /api/csv/list` - CSVリスト
   - `DELETE /api/csv/:id` - CSV削除
   - `GET /` - HTMLダッシュボード

3. **データ統合サービス**
   - 座席データ + CSV利用データの統合
   - 課金見積もり計算
   - データソース状態管理
