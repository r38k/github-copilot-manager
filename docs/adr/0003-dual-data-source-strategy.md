# ADR-0003: GitHub APIとCSVのデュアルデータソース戦略

## ステータス
提案中

## コンテキスト
GitHub Copilot Managerは2つの異なるデータソースを扱う必要がある：

1. **GitHub API**: リアルタイムのユーザーシート情報とアクティビティステータス
2. **CSVファイル**: 詳細なクレジット消費データ（手動エクスポート）

これらのデータは相補的な関係にあり、完全な利用状況把握には両方が必要。しかし、更新頻度や取得方法が異なるため、統合戦略が必要。

## 検討した選択肢

### 選択肢1: API優先アプローチ
- **方式**: APIデータをメインとし、CSVはオプション
- **メリット**
  - 常に最新データを表示
  - 実装がシンプル
- **デメリット**
  - クレジット消費の詳細が見られない
  - 不完全な分析

### 選択肢2: CSV必須アプローチ
- **方式**: CSV uploadを必須とする
- **メリット**
  - 完全なデータが保証される
  - 詳細な分析が可能
- **デメリット**
  - UXが悪い（手動アップロード必須）
  - リアルタイム性の欠如

### 選択肢3: ハイブリッドアプローチ（プログレッシブエンハンスメント）
- **方式**: APIデータで基本機能を提供し、CSVで機能を拡張
- **メリット**
  - 段階的な価値提供
  - ユーザーの選択を尊重
  - 最小限の機能は常に利用可能
- **デメリット**
  - 実装が複雑
  - データ整合性の管理が必要

### 選択肢4: 定期同期アプローチ
- **方式**: バックグラウンドでCSVを自動取得
- **メリット**
  - 完全自動化
- **デメリット**
  - 技術的に不可能（CSVは手動DLのみ）

## 決定
**選択肢3: ハイブリッドアプローチ（プログレッシブエンハンスメント）を採用する**

## 理由
1. **ユーザビリティ**: 基本機能はすぐに使え、詳細機能は必要に応じて有効化
2. **実用性**: GitHub APIの制限を認識した現実的なアプローチ
3. **拡張性**: 将来APIが改善された場合の移行が容易
4. **データ品質**: 可能な限り最新かつ詳細なデータを提供

## 影響

### ポジティブ
- CSVがなくても基本的なコスト管理が可能
- CSVアップロード時に詳細な分析が追加される
- ユーザーが必要とする粒度でデータを管理できる

### ネガティブ
- 2つのデータソースの整合性管理が必要
- UIでデータソースの状態を明確に示す必要がある
- データマージロジックの複雑性

## 実装詳細

### データモデル

```typescript
// 統合データモデル
interface IntegratedUserData {
  // APIから取得
  basic: {
    userId: string;
    username: string;
    seatStatus: 'active' | 'pending' | 'inactive';
    lastActivity: Date;
    assignedAt: Date;
  };
  
  // CSVから取得（オプション）
  detailed?: {
    creditsConsumed: number;
    creditsRemaining: number;
    breakdown: CreditBreakdown;
    lastUpdated: Date;
  };
  
  // データソース情報
  meta: {
    source: 'api' | 'csv' | 'merged';
    apiLastFetched: Date;
    csvLastImported?: Date;
    dataQuality: 'complete' | 'partial' | 'stale';
  };
}
```

### データ統合戦略

```typescript
class DataIntegrationService {
  // APIデータとCSVデータのマージ
  mergeUserData(apiData: APIUser[], csvData?: CSVRecord[]): IntegratedUserData[] {
    const merged = apiData.map(apiUser => {
      const csvRecord = csvData?.find(csv => 
        csv.username === apiUser.username
      );
      
      return {
        basic: extractBasicInfo(apiUser),
        detailed: csvRecord ? extractDetailedInfo(csvRecord) : undefined,
        meta: {
          source: csvRecord ? 'merged' : 'api',
          apiLastFetched: new Date(),
          csvLastImported: csvRecord?.importedAt,
          dataQuality: this.assessDataQuality(apiUser, csvRecord)
        }
      };
    });
    
    return merged;
  }
  
  // データ品質の評価
  assessDataQuality(api: APIUser, csv?: CSVRecord): DataQuality {
    if (!csv) return 'partial';
    
    const csvAge = Date.now() - csv.importedAt.getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    if (csvAge > 7 * ONE_DAY) return 'stale';
    if (csvAge > ONE_DAY) return 'partial';
    return 'complete';
  }
}
```

### UI表示戦略

```typescript
// コンポーネントでの表示
const UserMetrics: FC<{ user: IntegratedUserData }> = ({ user }) => {
  return (
    <Card>
      {/* 常に表示（APIデータ） */}
      <BasicInfo data={user.basic} />
      
      {/* CSVデータがある場合のみ表示 */}
      {user.detailed ? (
        <DetailedMetrics data={user.detailed} />
      ) : (
        <UploadPrompt message="詳細な分析にはCSVをアップロード" />
      )}
      
      {/* データ品質インジケーター */}
      <DataQualityBadge quality={user.meta.dataQuality} />
    </Card>
  );
};
```

### キャッシュ戦略

```typescript
interface CacheStrategy {
  api: {
    ttl: 5 * 60 * 1000,  // 5分
    storage: 'memory'
  },
  csv: {
    ttl: 7 * 24 * 60 * 60 * 1000,  // 7日
    storage: 'localStorage'
  },
  merged: {
    ttl: 60 * 1000,  // 1分
    storage: 'memory'
  }
}
```

## 移行計画

1. **Phase 1**: API統合の実装
2. **Phase 2**: CSVインポート機能の追加
3. **Phase 3**: データマージロジックの実装
4. **Phase 4**: UI改善（データ品質表示）

## 参考資料
- [GitHub Copilot Metrics API制限](https://docs.github.com/en/rest/copilot/copilot-metrics)
- [Progressive Enhancement Pattern](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)