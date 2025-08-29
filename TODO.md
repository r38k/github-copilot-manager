# TODO

> ADRに準拠し、最小価値から順に実装。副作用ポイントは Result<T,E> で明示的に扱う。

## 1. SSR/サーバ基盤（ADR-0001/0006）
- [ ] 依存追加: `hono`, `@hono/node-server`, `react`, `react-dom`
- [ ] Honoサーバ骨格: `/api/*` と `/*`（SSR）
- [ ] 初期データ埋め込み: サーバで統合→`<script type="application/json">`
- [ ] ハイドレーション最小化（島構成）
- [ ] エラーモデル: サーバ応答も `Result` 相当で整形

## 2. データモデル/統合（ADR-0003）
- [ ] `src/models/` に統合型: `IntegratedUserData`, `SeatSummary`, `UsageSummary`, `BillingSummary`
- [ ] 統合サービス: API(座席/メトリクス) + CSV（詳細）をマージ
- [ ] データソース状態: CSV最新アップロード日時/未提供時のフラグを付与
- [ ] すべてのI/O戻り値を `Result<T,E>` 化（API/CSV/Registry）

## 3. CSVレジストリ拡張
- [ ] API/ファイルアップロード対応（保存+メタ保持）
- [ ] メタ: `id, filename, size, contentHash, uploadedAt, uploadedBy`
- [ ] 最新選択ロジック/任意選択のエンドポイント
- [ ] ストレージ差し替え可能な抽象（FS/DB）

## 4. APIアダプタ（スタブ→実API）
- [ ] 依存追加: `octokit`
- [ ] Metrics API: 認証/ページネーション/レート制御/リトライ
- [ ] User Management API（Seats）: 同上
- [ ] `.env` 読み取り（`GITHUB_TOKEN`, `GITHUB_ORG`）とバリデーション
- [ ] ネットワーク呼び出しはテストでスタブ化（契約テスト）

## 5. 課金推定UI（ADR-0004）
- [ ] サーバ集計値をSSRで表示（カード + ディスクレーマ）
- [ ] 単価/期間のUI指定（フォーム/クエリ）
- [ ] 集計式/前提のヘルプ表示

## 6. チャート（ADR-0005）
- [ ] 依存追加: `recharts`
- [ ] 時系列（アクティブ/利用ユーザー）SSR対応
- [ ] 期間選択（daily/weekly/monthly）と簡易インタラクション

## 7. CLI/ユーティリティ強化
- [ ] `src/index.ts` にオプション: `--month YYYY-MM`, `--price 19`
- [ ] 出力フォーマット（json/pretty）切替
- [ ] 非0終了コードの定義（致命エラー時）

## 8. セキュリティ/設定
- [ ] `.env` 必須項目のチェックと起動時警告
- [ ] トークンスコープのドキュメント補強（README/docs）
- [ ] ローカル優先フラグ（オフラインモード）

## 9. テスト/品質
- [ ] パーサ境界・異常系（クォート/カンマ/空行/欠損）
- [ ] 統合/マージのユニットテスト（CSVなし/ありの分岐）
- [ ] APIアダプタのモックテスト（リトライ/失敗シナリオ）
- [ ] SSRレンダの最小スナップショットテスト
- [ ] CI（GitHub Actions）で `pnpm test`/型チェック

## 10. ドキュメント
- [ ] README: 現状機能/実行手順/CLIオプション更新
- [ ] ADR-0006: 採用後に「承認済み」へ更新
- [ ] デモ手順とスクリーンショット/CLI出力例の追記

## Optional（将来）
- [ ] CSVパースの堅牢化（`csv-parse` 導入）
- [ ] Lint/Format（Prettier/ESLint）導入検討（規約に沿って最小に）
- [ ] SSE/WebSocket による軽微なリアルタイム化（別ADR）

