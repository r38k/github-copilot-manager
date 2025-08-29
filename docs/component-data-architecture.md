# コンポーネント・データアーキテクチャ設計書

## 設計思想
コンポーネントとデータを密結合させ、各コンポーネントが必要なデータと振る舞いを明確に定義する。

## データフロー図
```
GitHub API ─┐
            ├─→ DataProvider ─→ Store ─→ Components ─→ UI
CSV Import ─┘                     ↑
                                  │
                              LocalCache
```

## コアデータ型定義

```typescript
// 基本型定義
type UserId = string;
type TeamId = string;
type DateString = string; // ISO 8601 format

// ユーザーエンティティ
interface User {
  id: UserId;
  username: string;
  email: string;
  teamId?: TeamId;
  copilotSeat: {
    assignedAt: DateString;
    lastActivityAt: DateString;
    lastActivityEditor: string;
    pendingCancellationDate?: DateString;
  };
}

// 使用状況データ
interface UsageData {
  userId: UserId;
  date: DateString;
  credits: {
    consumed: number;
    remaining: number;
    limit: number;
  };
  breakdown: {
    codeCompletion: number;
    chat: number;
    pullRequests: number;
    other: number;
  };
}

// 請求データ
interface BillingData {
  cycleStart: DateString;
  cycleEnd: DateString;
  users: UserId[];
  licensMonths: number;
  estimatedCost: number;
  actualCost?: number;
}
```

## コンポーネント設計

### 1. DashboardCard コンポーネント

```typescript
interface DashboardCardProps {
  data: DashboardMetrics;
}

interface DashboardMetrics {
  activeUsers: number;
  monthlyEstimatedCost: number;
  creditUsage: {
    total: number;
    used: number;
    percentage: number;
  };
  inactiveUsers: User[];
}

// データ取得フック
const useDashboardMetrics = (): DashboardMetrics => {
  const users = useStore(state => state.users);
  const usage = useStore(state => state.usage);
  const billing = useStore(state => state.billing);
  
  return useMemo(() => ({
    activeUsers: calculateActiveUsers(users),
    monthlyEstimatedCost: calculateMonthlyCost(billing),
    creditUsage: calculateCreditUsage(usage),
    inactiveUsers: findInactiveUsers(users)
  }), [users, usage, billing]);
};

// コンポーネント実装
const DashboardCard: FC<DashboardCardProps> = ({ data }) => {
  return (
    <Card>
      <MetricDisplay label="アクティブユーザー" value={data.activeUsers} />
      <MetricDisplay label="推定月額コスト" value={data.monthlyEstimatedCost} />
      <CreditGauge usage={data.creditUsage} />
      <InactiveUsersList users={data.inactiveUsers} />
    </Card>
  );
};
```

### 2. UsageChart コンポーネント

```typescript
interface UsageChartProps {
  data: ChartData;
  config: ChartConfig;
}

interface ChartData {
  points: DataPoint[];
  dateRange: DateRange;
}

interface DataPoint {
  date: DateString;
  activeUsers: number;
  engagedUsers: number;
  newUsers: number;
  churnedUsers: number;
}

interface ChartConfig {
  view: "daily" | "weekly" | "monthly" | "yearly";
  metrics: MetricType[];
  interactive: boolean;
}

// データ取得と変換フック
const useChartData = (config: ChartConfig): ChartData => {
  const rawData = useStore(state => state.historicalData);
  
  return useMemo(() => {
    const aggregated = aggregateByPeriod(rawData, config.view);
    const filtered = filterMetrics(aggregated, config.metrics);
    return formatChartData(filtered);
  }, [rawData, config]);
};

// コンポーネント実装
const UsageChart: FC<UsageChartProps> = ({ data, config }) => {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  
  return (
    <ChartContainer>
      <LineChart
        data={data.points}
        onPointClick={config.interactive ? setSelectedPoint : undefined}
      />
      {selectedPoint && <PointDetail data={selectedPoint} />}
    </ChartContainer>
  );
};
```

### 3. BillingTable コンポーネント

```typescript
interface BillingTableProps {
  data: BillingRow[];
  onRowExpand: (rowId: string) => void;
}

interface BillingRow {
  id: string;
  month: string;
  users: UserSummary[];
  metrics: {
    totalUsers: number;
    licensMonths: number;
    estimatedCost: number;
    actualCost?: number;
    variance?: number;
  };
  expanded: boolean;
}

interface UserSummary {
  userId: UserId;
  username: string;
  daysActive: number;
  contribution: number; // ライセンス-monthへの寄与
}

// データ取得と整形フック
const useBillingData = (): BillingRow[] => {
  const billing = useStore(state => state.billing);
  const users = useStore(state => state.users);
  
  return useMemo(() => {
    return billing.map(cycle => ({
      id: `${cycle.cycleStart}-${cycle.cycleEnd}`,
      month: formatMonth(cycle.cycleStart),
      users: calculateUserContributions(cycle, users),
      metrics: calculateBillingMetrics(cycle),
      expanded: false
    }));
  }, [billing, users]);
};

// コンポーネント実装
const BillingTable: FC<BillingTableProps> = ({ data, onRowExpand }) => {
  return (
    <Table>
      <TableHeader columns={["請求月", "ユーザー数", "推定コスト", "実績", "差分"]} />
      <TableBody>
        {data.map(row => (
          <Fragment key={row.id}>
            <TableRow
              data={row.metrics}
              onClick={() => onRowExpand(row.id)}
              expandable={true}
            />
            {row.expanded && (
              <ExpandedRow>
                <UserContributionList users={row.users} />
              </ExpandedRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
};
```

### 4. UserDetailView コンポーネント

```typescript
interface UserDetailViewProps {
  userId: UserId;
  dateRange: DateRange;
}

interface UserDetailData {
  profile: UserProfile;
  usage: UserUsageStats;
  activity: ActivityTimeline;
  cost: UserCostAnalysis;
}

interface UserProfile {
  userId: UserId;
  username: string;
  email: string;
  team: string;
  status: "active" | "inactive" | "pending";
  joinDate: DateString;
  lastActivity: DateString;
}

interface UserUsageStats {
  totalCredits: number;
  consumedCredits: number;
  dailyAverage: number;
  peakUsage: number;
  breakdown: CreditBreakdown;
  trend: TrendData;
}

// 統合データフック
const useUserDetail = (userId: UserId, dateRange: DateRange): UserDetailData => {
  const user = useStore(state => state.users[userId]);
  const usage = useStore(state => state.usage[userId]);
  const activity = useStore(state => state.activity[userId]);
  
  return useMemo(() => ({
    profile: buildUserProfile(user),
    usage: calculateUsageStats(usage, dateRange),
    activity: buildActivityTimeline(activity, dateRange),
    cost: calculateUserCost(user, usage, dateRange)
  }), [user, usage, activity, dateRange]);
};

// コンポーネント実装
const UserDetailView: FC<UserDetailViewProps> = ({ userId, dateRange }) => {
  const data = useUserDetail(userId, dateRange);
  
  return (
    <DetailContainer>
      <ProfileCard profile={data.profile} />
      <UsageStatistics stats={data.usage} />
      <ActivityChart timeline={data.activity} />
      <CostBreakdown analysis={data.cost} />
    </DetailContainer>
  );
};
```

## データストア設計（Zustand）

```typescript
interface AppStore {
  // 状態
  users: Record<UserId, User>;
  usage: Record<UserId, UsageData[]>;
  billing: BillingData[];
  historicalData: HistoricalData;
  
  // 読み込み状態
  loading: {
    users: boolean;
    usage: boolean;
    billing: boolean;
  };
  
  // エラー状態
  errors: Record<string, Error>;
  
  // アクション
  fetchUsers: () => Promise<void>;
  fetchUsage: (dateRange?: DateRange) => Promise<void>;
  fetchBilling: () => Promise<void>;
  importCSV: (file: File) => Promise<void>;
  
  // 計算されたゲッター
  getActiveUsers: () => User[];
  getInactiveUsers: (days: number) => User[];
  getCurrentMonthCost: () => number;
  getUserMetrics: (userId: UserId) => UserMetrics;
}

// ストア実装
const useStore = create<AppStore>((set, get) => ({
  users: {},
  usage: {},
  billing: [],
  historicalData: {},
  
  loading: {
    users: false,
    usage: false,
    billing: false
  },
  
  errors: {},
  
  fetchUsers: async () => {
    set({ loading: { ...get().loading, users: true } });
    try {
      const data = await githubAPI.fetchSeats();
      const users = normalizeUsers(data);
      set({ users, loading: { ...get().loading, users: false } });
    } catch (error) {
      set({ 
        errors: { ...get().errors, users: error },
        loading: { ...get().loading, users: false }
      });
    }
  },
  
  getActiveUsers: () => {
    const users = get().users;
    return Object.values(users).filter(user => 
      isUserActive(user.copilotSeat.lastActivityAt)
    );
  },
  
  getCurrentMonthCost: () => {
    const billing = get().billing;
    const currentCycle = getCurrentBillingCycle(billing);
    return currentCycle?.estimatedCost ?? 0;
  }
}));
```

## データ同期戦略

```typescript
interface DataSyncManager {
  // APIとの同期
  syncWithAPI: {
    interval: number;
    endpoints: string[];
    strategy: "full" | "incremental";
  };
  
  // CSVインポート
  csvImport: {
    parser: CSVParser;
    validator: DataValidator;
    merger: DataMerger;
  };
  
  // キャッシュ管理
  cache: {
    storage: "localStorage" | "sessionStorage";
    ttl: number;
    invalidation: CacheInvalidationStrategy;
  };
}

// 同期実装
class DataSync {
  private syncInterval: NodeJS.Timer | null = null;
  
  startSync(config: DataSyncConfig) {
    this.syncInterval = setInterval(async () => {
      await this.syncUsers();
      await this.syncUsage();
      await this.syncBilling();
    }, config.interval);
  }
  
  async syncUsers() {
    const cached = this.getCached('users');
    if (this.isFresh(cached)) return cached;
    
    const fresh = await githubAPI.fetchUsers();
    this.updateCache('users', fresh);
    store.setUsers(fresh);
    return fresh;
  }
  
  handleCSVImport(file: File) {
    const parsed = this.parseCSV(file);
    const validated = this.validateData(parsed);
    const merged = this.mergeWithExisting(validated);
    store.updateUsage(merged);
  }
}
```

## リアクティブ更新パターン

```typescript
// データ変更の伝播
interface DataUpdateFlow {
  // 1. APIからデータ取得
  api: {
    fetch: () => Promise<RawData>;
    transform: (raw: RawData) => NormalizedData;
  };
  
  // 2. ストア更新
  store: {
    update: (data: NormalizedData) => void;
    notify: () => void;
  };
  
  // 3. コンポーネント再描画
  component: {
    subscribe: () => Unsubscribe;
    render: () => ReactElement;
  };
}

// 実装例
const useReactiveData = <T>(selector: (state: AppStore) => T): T => {
  const data = useStore(selector);
  
  useEffect(() => {
    const unsubscribe = store.subscribe(
      state => selector(state),
      (newData) => {
        // データ変更時の処理
        console.log('Data updated:', newData);
      }
    );
    
    return unsubscribe;
  }, [selector]);
  
  return data;
};
```

## データ検証とエラーハンドリング

```typescript
// データ検証スキーマ
const schemas = {
  user: z.object({
    id: z.string(),
    username: z.string().min(1),
    copilotSeat: z.object({
      assignedAt: z.string().datetime(),
      lastActivityAt: z.string().datetime().optional()
    })
  }),
  
  usage: z.object({
    userId: z.string(),
    date: z.string().date(),
    credits: z.object({
      consumed: z.number().min(0),
      remaining: z.number().min(0),
      limit: z.number().positive()
    })
  })
};

// エラーハンドリング
const handleDataError = (error: DataError, context: ErrorContext) => {
  switch (error.type) {
    case 'VALIDATION_ERROR':
      showToast('データ形式が正しくありません');
      break;
    case 'API_ERROR':
      retryWithBackoff(context.retry);
      break;
    case 'PARSING_ERROR':
      requestManualIntervention();
      break;
  }
};
```

## パフォーマンス最適化

```typescript
// メモ化戦略
const optimizations = {
  // 高コスト計算のメモ化
  memoization: {
    costCalculation: memoize(calculateTotalCost, { maxAge: 60000 }),
    userAggregation: memoize(aggregateUsers, { maxAge: 30000 })
  },
  
  // 仮想化
  virtualization: {
    table: { rowHeight: 48, overscan: 5 },
    chart: { dataPoints: 1000, sampling: 'lttb' }
  },
  
  // 遅延読み込み
  lazyLoading: {
    userDetails: true,
    historicalData: true,
    csvParsing: true
  }
};
```