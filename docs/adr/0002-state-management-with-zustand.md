# ADR-0002: 状態管理にZustandを採用

## ステータス
提案中

## コンテキスト
GitHub Copilot Managerは複数のデータソース（GitHub API、CSV）から取得したデータを統合し、複数のコンポーネント間で共有する必要がある。ユーザー情報、使用状況、請求データなどを効率的に管理し、リアクティブに更新を反映する状態管理ソリューションが必要。

## 検討した選択肢

### 選択肢1: Redux Toolkit
- **メリット**
  - 成熟したエコシステム
  - DevToolsが充実
  - タイムトラベルデバッギング
  - 予測可能な状態更新
- **デメリット**
  - ボイラープレートが多い
  - 学習曲線が急
  - バンドルサイズが大きい（〜12KB）

### 選択肢2: Zustand
- **メリット**
  - 極小バンドルサイズ（〜2.6KB）
  - シンプルなAPI
  - TypeScriptサポートが優秀
  - ボイラープレートが少ない
  - React外でも使用可能
- **デメリット**
  - DevToolsが限定的
  - コミュニティが比較的小さい

### 選択肢3: Jotai
- **メリット**
  - React Suspenseとの統合
  - アトミックな状態管理
  - 派生状態の扱いが優秀
- **デメリット**
  - コンセプトの理解が難しい
  - SSRとの相性に課題

### 選択肢4: Context API + useReducer
- **メリット**
  - 追加依存なし
  - Reactネイティブ
- **デメリット**
  - パフォーマンス最適化が困難
  - 大規模アプリには不向き
  - 再レンダリング制御が難しい

### 選択肢5: Valtio
- **メリット**
  - プロキシベースで直感的
  - ミュータブルな更新
- **デメリット**
  - プロキシのブラウザ互換性
  - デバッグが困難

## 決定
**選択肢2: Zustandを採用する**

## 理由
1. **シンプルさ**: 学習コストが低く、チーム全体がすぐに使える
2. **パフォーマンス**: 小さなバンドルサイズと効率的な再レンダリング制御
3. **TypeScript**: 型推論が優秀で、型安全な状態管理が可能
4. **柔軟性**: ミドルウェアパターンで拡張可能
5. **SSR対応**: サーバーサイドレンダリングとの統合が容易

## 影響

### ポジティブ
- 開発速度が向上（ボイラープレート削減）
- アプリケーションのバンドルサイズを小さく保てる
- 状態のスライス化により、必要な部分だけを購読できる
- React外（バックグラウンドタスクなど）からも状態を更新できる

### ネガティブ
- Redux DevToolsの一部機能が使えない
- タイムトラベルデバッギングがネイティブサポートされていない
- 大規模チームでの統一的なパターン確立が必要

## 実装詳細

```typescript
// ストア定義
interface CopilotStore {
  // 状態
  users: Record<UserId, User>;
  usage: UsageData[];
  billing: BillingData[];
  
  // 読み込み状態
  isLoading: boolean;
  error: Error | null;
  
  // アクション
  fetchUsers: () => Promise<void>;
  updateUser: (userId: UserId, data: Partial<User>) => void;
  importCSV: (file: File) => Promise<void>;
  
  // セレクター
  getActiveUsers: () => User[];
  getCurrentMonthCost: () => number;
}

// ストア実装
const useStore = create<CopilotStore>((set, get) => ({
  users: {},
  usage: [],
  billing: [],
  isLoading: false,
  error: null,
  
  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getUsers();
      set({ users: data, isLoading: false });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },
  
  getActiveUsers: () => {
    return Object.values(get().users)
      .filter(user => user.isActive);
  }
}));

// コンポーネントでの使用
const Dashboard = () => {
  const users = useStore(state => state.users);
  const fetchUsers = useStore(state => state.fetchUsers);
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  return <UserList users={users} />;
};
```

## ミドルウェアパターン

```typescript
// 永続化ミドルウェア
const useStore = create(
  persist(
    (set, get) => ({
      // ストア実装
    }),
    {
      name: 'copilot-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        users: state.users 
      })
    }
  )
);

// ロギングミドルウェア
const useStore = create(
  devtools(
    (set, get) => ({
      // ストア実装
    }),
    { name: 'CopilotStore' }
  )
);
```

## 参考資料
- [Zustand公式ドキュメント](https://github.com/pmndrs/zustand)
- [状態管理ライブラリ比較](https://npm-compare.com/zustand,redux,jotai,valtio)