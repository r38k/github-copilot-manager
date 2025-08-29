# ADR-0005: グラフライブラリとしてRechartsを採用

## ステータス
提案中

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

## 移行計画
1. **Phase 1**: 基本的なライングラフの実装
2. **Phase 2**: インタラクティブ機能追加
3. **Phase 3**: パフォーマンス最適化
4. **Phase 4**: カスタムデザインシステム適用

## 参考資料
- [Recharts公式ドキュメント](https://recharts.org/)
- [React Chart Library比較](https://2019.stateofjs.com/data-layer/)