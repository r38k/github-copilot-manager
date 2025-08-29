# ADR-0004: 請求サイクル計算の単純化アプローチ

## ステータス
承認済み

## コンテキスト
GitHub Copilotの請求は複雑な仕組みを持つ：

- 組織の利用開始日を起点とした独自サイクル
- 月途中の参加/脱退による日割り計算
- ライセンス-monthという概念
- 実際の請求額との誤差

正確な請求額を計算するには複雑な日付計算が必要だが、ユーザーは大まかな推定値で十分な場合も多い。

## 検討した選択肢

### 選択肢1: 完全正確計算
- **アプローチ**: GitHubと同じロジックで正確に計算
- **メリット**
  - 実請求額との誤差が最小
  - 信頼性が高い
- **デメリット**
  - 実装が複雑（時差、土日、月末処理など）
  - GitHub側の仕様変更リスク
  - パフォーマンスへの影響

### 選択肢2: 単純化推定
- **アプローチ**: 請求サイクル内のアクティブユーザー数で単純計算
- **メリット**
  - 実装がシンプル
  - 理解しやすい
  - 高速処理
- **デメリット**
  - 実請求額との誤差
  - 日割り計算の精度不足

### 選択肢3: ハイブリッド計算
- **アプローチ**: 基本は簡素化、詳細表示では正確計算
- **メリット**
  - 用途に応じた精度選択
  - UXと正確性の両立
- **デメリット**
  - 2つの計算ロジック維持
  - データ表示の一貫性課題

### 選択肢4: 外部サービス利用
- **アプローチ**: 請求計算を外部APIに委譲
- **メリット**
  - 専門性の高い計算
- **デメリット**
  - 外部依存
  - コスト発生
  - GitHub仕様への対応速度

## 決定
**選択肢2: 単純化推定を採用し、誤差を許容する**

## 理由
1. **実用性**: ユーザーの主要関心事は「大体いくらか」であり、厳密性より理解しやすさが重要
2. **保守性**: シンプルな計算ロジックは保守が容易
3. **透明性**: 計算方法を明確に示すことで、誤差の存在を明示
4. **迅速性**: 概算で十分な意思決定を迅速にサポート

## 影響

### ポジティブ
- 実装・保守が容易
- リアルタイム計算でUXが向上
- 計算ロジックの透明性が高い
- GitHub仕様変更への影響を最小化

### ネガティブ
- 実請求額との誤差（通常5-15%程度）
- 厳密な予算管理には不向き
- ユーザーの信頼性に対する懸念

## 実装詳細

### 計算ロジック

```typescript
interface SimplifiedBillingCalculation {
  // 基本方針: 請求サイクル内のアクティブユーザー数 × 単価
  method: "active_users_count";
  assumptions: [
    "月の途中参加者も1ヶ月分として計算",
    "日割り計算は無視",
    "土日・祝日は考慮しない"
  ];
}

// 簡易請求推定（関数ベース）
function calculateMonthlyCost(
  users: User[],
  cycleStart: Date,
  cycleEnd: Date
): BillingEstimate {
  // アクティブユーザーをカウント
  const activeUsers = users.filter(user => isActiveInCycle(user, cycleStart, cycleEnd));

  // 単純計算
  const baseCost = activeUsers.length * COPILOT_PRICE_PER_MONTH;

  return {
    activeUserCount: activeUsers.length,
    estimatedCost: baseCost,
    confidence: "medium", // 誤差15%程度
    calculationMethod: "simplified",
    users: activeUsers.map(u => u.username),
    disclaimers: [
      "概算値です。実際の請求額と差異が生じる可能性があります",
      "日割り計算は含まれていません",
      "月途中の加入・脱退による調整は反映されていません"
    ]
  };
}

function isActiveInCycle(user: User, start: Date, end: Date): boolean {
  const assignedAt = new Date(user.copilotSeat.assignedAt);
  const cancelledAt = user.copilotSeat.pendingCancellationDate
    ? new Date(user.copilotSeat.pendingCancellationDate)
    : null;

  // シンプルな重複判定
  return assignedAt <= end && (!cancelledAt || cancelledAt >= start);
}
```

### UI表示

```typescript
const BillingEstimate: FC<{ estimate: BillingEstimate }> = ({ estimate }) => {
  return (
    <Card>
      <div className="estimate-header">
        <h3>月間推定コスト</h3>
        <ConfidenceBadge level={estimate.confidence} />
      </div>
      
      <div className="cost-display">
        <span className="amount">${estimate.estimatedCost}</span>
        <span className="method">（簡易計算）</span>
      </div>
      
      <div className="breakdown">
        <p>{estimate.activeUserCount}名 × ${COPILOT_PRICE_PER_MONTH}</p>
      </div>
      
      {/* 重要: 制限事項の明示 */}
      <DisclaimerSection disclaimers={estimate.disclaimers} />
      
      <AccuracyNote>
        実際の請求額は日割り計算により±15%程度の誤差が生じる可能性があります
      </AccuracyNote>
    </Card>
  );
};
```

### 精度向上のための拡張

```typescript
// 将来的な拡張オプション
interface EnhancedCalculationOptions {
  // より正確な計算が必要な場合のオプション
  enableDailyProration: boolean;  // 日割り計算を有効化
  considerWeekends: boolean;      // 土日を考慮
  applyTimezoneAdjustment: boolean; // タイムゾーン調整
  
  // ユーザー向け設定
  preferAccuracy: "speed" | "precision"; // 速度優先 or 精度優先
}
```

## 代替案の検討結果

### 精密計算を選ばなかった理由
- GitHub側の内部実装詳細が不明
- 時差、土日処理、月末日の扱いなど複雑な要素
- 計算結果の検証が困難

### ハイブリッド計算を選ばなかった理由
- 2つの計算方法による混乱
- どちらを信用すべきか判断が困難
- 実装・テストコストの増大

## 監視とフィードバック

```typescript
interface AccuracyMonitoring {
  // 実請求額との比較（ユーザー入力）
  actualBillTracking: {
    userReported: boolean;
    variance: number; // 実績値との差異率
    sampleSize: number;
  };
  
  // 計算精度の改善
  calibration: {
    adjustmentFactor: number; // 統計的補正係数
    confidenceInterval: [number, number];
  };
}
```

## 参考資料
- [GitHub Copilot Pricing](https://github.com/pricing)
- [Software Cost Estimation Best Practices](https://en.wikipedia.org/wiki/Software_development_effort_estimation)
