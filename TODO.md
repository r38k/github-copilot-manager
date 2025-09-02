# TODO

> ADRに準拠し、最小価値から順に実装。副作用ポイントは Result<T,E> で明示的に扱う。

## 進捗状況 (2025-08-30)

### ✅ 完了済み（2025-08-30実装完了）
- **基本データ処理**: CSV解析、座席データ読み込み、課金見積もり
- **Result型エラーハンドリング**: すべてのI/O操作でResult<T,E>を使用
- **テストファースト設計**: 主要機能のテスト仕様作成・実装完了
- **データ統合サービス**: `src/services/data-integration.ts` 実装完了（テスト6件成功）
- **Webサーバー**: index.tsをCLI→Webサーバーエントリーポイントに変換完了
- **CSVアップロードサービス**: `src/services/csv-upload.ts` 実装完了（テスト12件成功）
- **HTMLダッシュボード**: レスポンシブダッシュボード実装完了
- **APIエンドポイント**: 全エンドポイント実装完了（health, data, csv操作）

### 🎯 現在の状況
- **Webサーバー**: http://localhost:3000 で動作中
- **テストカバレッジ**: 35/35テスト成功 ✅
- **機能**: 座席管理、CSV処理、課金見積もり、ダッシュボード表示すべて動作
- **コマンド**: `pnpm tsx src/index.ts` でサーバー起動

## 実装完了項目

### 1. ✅ SSR/サーバ基盤（ADR-0001/0006）
- [x] 依存追加: `hono`, `@hono/node-server`, `react`, `react-dom`
- [x] index.tsをCLI→サーバーエントリーポイントに変更
- [x] Honoサーバ骨格: `/api/*` と `/*`（HTMLダッシュボード）
- [x] データ統合サービス実装
- [x] HTMLレスポンス実装

### 2. ✅ データモデル/統合（ADR-0003）
- [x] テスト設計済み: `src/services/data-integration.test.ts`
- [x] データ統合サービスの実装 (`src/services/data-integration.ts`)
- [x] 統合型定義: `IntegratedData`, `DataIntegrationService`

### 3. ✅ CSVレジストリ拡張
- [x] テスト設計済み: `src/services/csv-upload.test.ts`
- [x] CSV アップロードサービス実装 (`src/services/csv-upload.ts`)
- [x] メタデータ管理: `id, filename, size, contentHash, uploadedAt, uploadedBy`
- [x] CRUD操作: アップロード、リスト、取得、削除

## 次の実装候補（優先度順）

### 🟡 中優先（機能拡充）
1. **実GitHub API接続** - octokitによる実際のGitHub API呼び出し
2. **チャート表示機能** - recharts利用によるデータ可視化
3. **CSV統合機能** - アップロードしたCSVをデータ統合に使用
4. **ユーザー認証・権限管理** - セキュリティ強化

### 🔵 低優先（運用・保守性向上）
5. **エラー監視・ログ機能** - 本格運用に向けた可観測性
6. **設定ファイル管理** - 環境別設定の外部化
7. **APIドキュメント** - OpenAPI/Swagger対応
8. **Docker化** - コンテナ運用対応

### 🔄 継続的改善
- **テストカバレッジ向上** - エッジケースの追加テスト
- **パフォーマンス最適化** - 大量データ処理対応
- **UI/UX改善** - より使いやすいダッシュボード

## アーカイブ（実装判断待ち）

<details>
<summary>元のTODO項目（参考用）</summary>

- APIアダプタ（スタブ→実API）
- 課金推定UI（ADR-0004）  
- チャート（ADR-0005）
- CLI/ユーティリティ強化
- セキュリティ/設定
- テスト/品質拡充
- ドキュメント整備
- Optional機能

</details>

