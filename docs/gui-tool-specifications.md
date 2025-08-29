# GitHub Copilot Manager GUI ツール仕様書

## 概要
GitHub Copilot Managerは、組織のGitHub Copilot利用状況を可視化し、コスト管理を支援するWebベースの管理ツールです。

## 技術スタック

### フロントエンド
- **フレームワーク**: React + Vite
- **UIライブラリ**: 検討中（Tailwind CSS / Material-UI）
- **チャート**: Recharts / Chart.js
- **状態管理**: Zustand / Context API

### バックエンド
- **フレームワーク**: Hono
- **ランタイム**: Node.js
- **TypeScript**: 厳格な型定義

### アーキテクチャ
- **レンダリング**: SSR（Server-Side Rendering）
- **API設計**: RESTful API
- **データソース**: GitHub API + CSVインポート

## 主要機能

### 1. ダッシュボード

#### 概要カード
- **現在のアクティブユーザー数**: リアルタイム表示
- **今月の推定コスト**: 自動計算・更新
- **クレジット消費状況**: 残量と消費率
- **非アクティブユーザー数**: 30日以上未使用

### 2. 利用者数推移グラフ

#### グラフ仕様
```typescript
interface UsageChart {
  type: "line" | "area";
  xAxis: {
    type: "date";
    format: "YYYY-MM-DD";
    range: DateRange;
  };
  yAxis: {
    type: "number";
    label: "ユーザー数";
  };
  datasets: {
    activeUsers: number[];
    engagedUsers: number[];
    pendingUsers?: number[];
  };
}
```

#### 表示モード
| モード | 期間 | データポイント | 用途 |
|--------|------|---------------|------|
| 日次 | 30日 | 1日単位 | 詳細な変動確認 |
| 週次 | 12週 | 1週単位 | トレンド把握 |
| 月次 | 12ヶ月 | 1月単位 | 長期傾向分析 |
| 年次 | 5年 | 1年単位 | 成長率確認 |

#### インタラクション
- ズーム/パン機能
- データポイントホバーで詳細表示
- CSVエクスポート機能

### 3. 請求管理テーブル

#### テーブル構造
```typescript
interface BillingTable {
  columns: [
    "請求月",
    "アクティブユーザー",
    "ユーザーリスト",
    "ライセンス-month",
    "推定コスト",
    "実際の請求額",
    "差分"
  ];
  features: {
    sorting: true;
    filtering: true;
    pagination: true;
    expandableRows: true;
  };
}
```

#### データ表示例
| 請求月 | アクティブユーザー | ライセンス-month | 推定コスト | 状態 |
|--------|------------------|-----------------|------------|------|
| 2024-08 | 25名 | 20.5 | $389.50 | 確定 |
| 2024-09 | 28名 | 28.0 | $532.00 | 処理中 |
| 2024-10 | 30名 | 30.0 | $570.00 | 予測 |

#### ユーザーリスト展開
- クリックで展開し、該当月の全ユーザーを表示
- 各ユーザーの参加日/離脱日を表示
- 日割り計算の詳細を表示

### 4. ユーザー詳細ビュー

#### 表示項目
```typescript
interface UserDetail {
  basicInfo: {
    username: string;
    email: string;
    team: string;
    joinDate: Date;
    lastActivity: Date;
  };
  usage: {
    monthlyCredits: number;
    remainingCredits: number;
    consumptionRate: number;
  };
  breakdown: {
    codeCompletion: number;
    chat: number;
    pullRequests: number;
    other: number;
  };
}
```

#### ビジュアライゼーション
- クレジット消費の円グラフ
- 日別使用量の棒グラフ
- モデル別使用比率

### 5. コスト分析ダッシュボード

#### コスト計算ロジック
```typescript
const calculateCost = (billingCycle: BillingCycle): Cost => {
  const daysInCycle = getDaysInCycle(billingCycle);
  const userDays = users.map(u => getUserDaysInCycle(u, billingCycle));
  const licensMonths = userDays.reduce((sum, days) => 
    sum + (days / daysInCycle), 0
  );
  return {
    estimated: licensMonths * PRICE_PER_LICENSE,
    breakdown: generateBreakdown(userDays)
  };
};
```

#### 表示要素
- 月別コスト推移グラフ
- 部門別コスト配分
- ROI計算（生産性向上指標との比較）
- コスト予測（3ヶ月先まで）

## データ管理

### データソース

#### 1. GitHub API（リアルタイム）
- ユーザーシート情報
- アクティビティステータス
- 基本的な使用メトリクス

#### 2. CSVインポート（手動）
- 詳細なクレジット消費データ
- モデル別使用状況
- 期間指定の集計データ

### データ更新戦略
```typescript
interface DataRefreshStrategy {
  api: {
    interval: "5min" | "15min" | "1hour";
    endpoints: string[];
    cache: boolean;
  };
  csv: {
    notification: "表示時に最新CSVのアップロードを促す";
    validation: "CSVフォーマットの検証";
    merge: "既存データとのマージロジック";
  };
}
```

### データ保存
- ローカルストレージ: 設定とキャッシュ
- セッションストレージ: 一時的なデータ
- サーバーDB（将来）: 履歴データの永続化

## UI/UX設計

### レイアウト
```
┌─────────────────────────────────────────┐
│  ヘッダー（ロゴ、組織名、設定）           │
├──────────┬──────────────────────────────┤
│          │                              │
│  サイド  │    メインコンテンツエリア      │
│  ナビ    │  - ダッシュボード             │
│          │  - グラフ                    │
│  ・概要   │  - テーブル                  │
│  ・分析   │  - 詳細ビュー                │
│  ・設定   │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

### レスポンシブデザイン
| デバイス | ブレークポイント | レイアウト |
|---------|---------------|------------|
| デスクトップ | 1200px以上 | 3カラム |
| タブレット | 768px-1199px | 2カラム |
| モバイル | 767px以下 | 1カラム |

### カラースキーム
```css
:root {
  --primary: #0366d6;      /* GitHub Blue */
  --success: #28a745;      /* 緑：正常 */
  --warning: #ffc107;      /* 黄：注意 */
  --danger: #dc3545;       /* 赤：警告 */
  --background: #ffffff;
  --text: #24292e;
  --border: #e1e4e8;
}
```

## アラート機能

### アラート条件
| 種類 | 条件 | アクション |
|------|------|-----------|
| コスト超過 | 予算の90%到達 | 通知＋ハイライト |
| 非アクティブ | 30日以上未使用 | リスト表示 |
| クレジット枯渇 | 残10%以下 | 警告表示 |
| データ未更新 | CSV7日以上古い | 更新促進 |

### 通知方式
- アプリ内通知（トースト/バナー）
- メール通知（オプション）
- Slack連携（将来機能）

## パフォーマンス要件

### レスポンス時間
| 操作 | 目標時間 | 最大許容時間 |
|------|---------|-------------|
| ページ読み込み | < 2秒 | 3秒 |
| API呼び出し | < 1秒 | 2秒 |
| グラフ描画 | < 0.5秒 | 1秒 |
| CSV処理 | < 3秒 | 5秒 |

### データ量制限
- 最大ユーザー数: 10,000
- グラフデータポイント: 365日分
- CSVファイルサイズ: 50MB

## セキュリティ

### 認証・認可
```typescript
interface AuthConfig {
  provider: "github-oauth";
  scopes: ["read:org", "admin:org"];
  session: {
    duration: "24hours";
    refresh: true;
  };
}
```

### データ保護
- APIトークンの暗号化保存
- HTTPS通信の強制
- CSRFトークンの実装
- XSS対策（入力サニタイゼーション）

## エラーハンドリング

### エラー種別と対処
```typescript
enum ErrorType {
  API_ERROR = "APIエラー",
  AUTH_ERROR = "認証エラー",
  DATA_ERROR = "データエラー",
  NETWORK_ERROR = "ネットワークエラー"
}

interface ErrorHandler {
  display: "トースト" | "モーダル" | "インライン";
  retry: boolean;
  fallback: () => void;
}
```

## 将来の拡張機能

### Phase 2（3-6ヶ月後）
- 複数組織の統合管理
- カスタムレポート生成
- 自動化ワークフロー
- 予算アラート強化

### Phase 3（6-12ヶ月後）
- AI推奨によるコスト最適化
- 生産性メトリクスとの統合
- チーム別ダッシュボード
- モバイルアプリ対応

## 開発環境セットアップ

### 必要要件
```json
{
  "node": ">=20.0.0",
  "pnpm": ">=8.0.0",
  "typescript": ">=5.0.0"
}
```

### 起動コマンド
```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# プロダクション起動
pnpm start
```

### 環境変数
```env
# .env.example
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_ORG=your-org
API_BASE_URL=https://api.github.com
PORT=3000
NODE_ENV=development
```

## テスト戦略

### テストカバレッジ目標
- ユニットテスト: 80%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: クリティカルパス100%

### テストツール
- Vitest: ユニットテスト
- Testing Library: コンポーネントテスト
- Playwright: E2Eテスト