# ADR-0005: グラフライブラリとしてRechartsを採用

## ステータス
承認済み

## コンテキスト
GitHub Copilot Managerでは、利用者数の推移グラフが中核機能の一つとなる。以下の要件を満たすグラフライブラリが必要：

- 時系列データの可視化（日次/週次/月次/年次）
- インタラクティブ機能（ズーム、ホバー、ツールチップ）
- レスポンシブデザインサポート
- TypeScriptサポート
- パフォーマンス（1000+データポイント）
- SSRサポート

## 検討した選択肢

### 選択肢1: Chart.js + react-chartjs-2
- **メリット**
  - 成熟したライブラリ（10年以上の実績）
  - 豊富なプラグインエコシステム
  - カスタマイズ性が高い
  - Canvas描画で高性能
- **デメリット**
  - Reactとの統合が煩雑
  - 命令型API（React的でない）
  - TypeScript対応が不十分
  - SSRで追加設定が必要

### 選択肢2: Recharts
- **メリット**
  - React専用設計で統合が自然
  - 宣言型API（Reactらしい）
  - TypeScriptサポートが優秀
  - 軽量（~170KB）
  - SSRサポート内蔵
- **デメリット**
  - Chart.jsより機能が限定的
  - 複雑なカスタマイゼーションは困難
  - 大規模データセットでパフォーマンス課題

### 選択肢3: Victory
- **メリット**
  - React専用設計
  - モジュラー構成
  - SVG描画でスケーラブル
  - アニメーション機能
- **デメリット**
  - 学習曲線が急
  - バンドルサイズが大きい（~300KB+）
  - パフォーマンス課題（SVG描画）

### 選択肢4: D3.js + React
- **メリット**
  - 最大のカスタマイズ性
  - 高性能
  - 豊富な可視化パターン
- **デメリット**
  - 学習コストが極めて高い
  - 開発工数が大幅増加
  - 保守が困難

### 選択肢5: Nivo
- **メリット**
  - React専用で高品質
  - TypeScriptサポート
  - 美しいデフォルトデザイン
- **デメリット**
  - バンドルサイズが大きい
  - 時系列特化機能が不足

## 決定
**選択肢2: Rechartsを採用する**

## 理由
1. **React統合**: Reactコンポーネントとして自然に扱える
2. **TypeScript**: 優れた型定義により開発体験が良い
3. **学習コスト**: チーム全員が短期間で習得可能
4. **バランス**: 機能性とシンプルさの良いバランス
5. **SSR対応**: サーバーサイドレンダリングが簡単

## 影響

### ポジティブ
- React開発者にとって自然な実装
- TypeScriptによる型安全な実装
- コンポーネントの再利用性が高い
- SSR対応によりSEO向上

### ネガティブ
- 極めて複雑なカスタマイゼーションは困難
- 大規模データセット（10k+ポイント）でのパフォーマンス制限
- Chart.jsと比較して機能の制約

## 実装詳細

### 基本的な時系列グラフ

```typescript
interface ChartDataPoint {
  date: string;
  activeUsers: number;
  engagedUsers: number;
  newUsers?: number;
}

const UsageChart: FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => format(new Date(value), 'MM/dd')}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => format(new Date(value), 'yyyy/MM/dd')}
          formatter={(value, name) => [value, name === 'activeUsers' ? 'アクティブユーザー' : '利用ユーザー']}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="activeUsers" 
          stroke="#8884d8" 
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="engagedUsers" 
          stroke="#82ca9d" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### インタラクティブ機能

```typescript
const InteractiveUsageChart: FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DateRange | null>(null);
  const [zoomDomain, setZoomDomain] = useState<DateRange | null>(null);
  
  const handleBrushChange = (brushData: any) => {
    if (brushData?.startIndex !== undefined && brushData?.endIndex !== undefined) {
      const start = data[brushData.startIndex].date;
      const end = data[brushData.endIndex].date;
      setZoomDomain({ start, end });
    }
  };
  
  return (
    <div className="chart-container">
      {/* メインチャート */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={data}
          onMouseDown={handleBrushChange}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            domain={zoomDomain ? [zoomDomain.start, zoomDomain.end] : ['dataMin', 'dataMax']}
            type="number"
            scale="time"
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Line dataKey="activeUsers" stroke="#8884d8" />
          <Brush 
            dataKey="date" 
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* 期間選択ボタン */}
      <PeriodSelector onChange={setSelectedPeriod} />
    </div>
  );
};
```

### カスタムツールチップ

```typescript
const CustomTooltip: FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="custom-tooltip">
      <h4>{format(new Date(label), 'yyyy年MM月dd日')}</h4>
      {payload.map((entry, index) => (
        <div key={index} className="tooltip-item">
          <span 
            className="color-indicator" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="label">{getMetricLabel(entry.dataKey)}:</span>
          <span className="value">{entry.value}名</span>
        </div>
      ))}
      <div className="growth-rate">
        <span>前日比: {calculateGrowthRate(payload[0].payload)}%</span>
      </div>
    </div>
  );
};
```

### パフォーマンス最適化

```typescript
// 大量データ対応
const OptimizedChart: FC<{ rawData: ChartDataPoint[] }> = ({ rawData }) => {
  // データサンプリング（LTTB アルゴリズム使用）
  const sampledData = useMemo(() => {
    if (rawData.length <= 1000) return rawData;
    return sampleDataLTTB(rawData, 1000);
  }, [rawData]);
  
  // 仮想化による部分レンダリング
  const visibleData = useMemo(() => {
    const viewport = getViewportDateRange();
    return sampledData.filter(point => 
      isDateInRange(point.date, viewport)
    );
  }, [sampledData]);
  
  return (
    <ResponsiveContainer>
      <LineChart data={visibleData}>
        {/* チャート設定 */}
      </LineChart>
    </ResponsiveContainer>
  );
};
```

## 制限事項と対策

### データ量制限
- **制限**: 3000ポイント以上でパフォーマンス低下
- **対策**: データサンプリング、仮想化

### カスタマイゼーション制限
- **制限**: 複雑なビジュアルカスタマイズが困難
- **対策**: CSS-in-JSによるスタイリング、必要に応じてD3.jsパーツ使用

```typescript
// テーマシステム
const chartTheme = {
  colors: {
    primary: '#0366d6',
    secondary: '#28a745',
    grid: '#e1e4e8',
    text: '#24292e'
  },
  fonts: {
    base: 'system-ui, -apple-system, sans-serif'
  }
};
```

## デザイン/Tailwind併用方針

本ADRで選定した Recharts は SVG/コンポーネント指向のAPIであり、ユーティリティCSSの Tailwind と併用可能。役割分担と実装パターンは以下の通り。

- 役割分担:
  - Tailwind: レイアウト/余白/タイポグラフィ/コンテナ装飾/テーマ変数の定義
  - Recharts: グラフ自体の描画（`stroke`/`fill`/`grid` などは props で制御）

- 推奨パターン（CSS変数経由）:
  - Tailwind でコンテナに色のCSS変数を与え、Recharts はその変数を参照。
  - ダークモードやテーマ切替は、親要素へ変数上書きクラスを付与して一括反映。

```tsx
// 使用例: Tailwind + Recharts（色はCSS変数で一元管理）
export const UsageChartCard = ({ data }: { data: ChartDataPoint[] }) => (
  <section
    className=
      "p-4 rounded-md bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 " +
      // テーマ変数（任意色は Tailwind の arbitrary properties を利用）
      "[--chart-primary:#2563eb] [--chart-secondary:#16a34a] [--chart-grid:#e5e7eb] " +
      "dark:[--chart-primary:#60a5fa] dark:[--chart-secondary:#34d399] dark:[--chart-grid:#374151]"
  >
    <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">利用者推移</h3>
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="activeUsers" stroke="var(--chart-primary)" dot={false} />
          <Line type="monotone" dataKey="engagedUsers" stroke="var(--chart-secondary)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </section>
);
```

- 注意点:
  - Recharts内部のSVG要素は Tailwind のユーティリティで直接スタイルしづらい（`className` が内部要素に伝播しないケースがある）。色/線幅等は Recharts コンポーネントの props（`stroke`/`fill`/`strokeWidth` 等）で指定するか、上記のように CSS 変数参照を用いる。
  - レジェンド/ツールチップ等、ラッパーはHTML要素なので Tailwind クラスで自由に装飾可能。カスタムツールチップは通常の React コンポーネントとして Tailwind を適用。
  - 大規模データ時のパフォーマンスは Tailwind とは独立の関心（サンプリング/仮想化で対処）。

### Tailwind 導入の最小手順（要約）
1. 依存導入: `pnpm add -D tailwindcss postcss autoprefixer`
2. 初期化: `npx tailwindcss init -p`（`tailwind.config.ts`/`postcss.config.cjs`）
3. 対象設定: `content` に SSR/CSR のテンプレート（`src/**/*.{ts,tsx}` など）を指定
4. エントリCSS: `src/ui/styles.css` を作成し `@tailwind base; @tailwind components; @tailwind utilities;` を記述
5. レイアウト/エントリで CSS を読み込み（SSR ではビルド済み CSS を `<link>` で提供）
6. ダークモード: Tailwind の `class` 戦略を採用し、`<html class="dark">` またはルートに `dark:` 系クラスを適用

補足: SSR（ADR-0001）と併用可。ビルドは Vite/RSBuild/Rspack 等の任意ツールで問題なく運用できる。JIT のクラスパージのため、任意生成クラスを使う場合は `safelist` の検討を推奨。

## 移行計画
1. **Phase 1**: 基本的なライングラフの実装
2. **Phase 2**: インタラクティブ機能追加
3. **Phase 3**: パフォーマンス最適化
4. **Phase 4**: カスタムデザインシステム適用

## 参考資料
- [Recharts公式ドキュメント](https://recharts.org/)
- [React Chart Library比較](https://2019.stateofjs.com/data-layer/)
