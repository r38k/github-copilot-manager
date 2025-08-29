# ADR-0001: SSRアーキテクチャとしてHono + Reactを採用

## ステータス
承認済み

## コンテキスト
GitHub Copilot Managerは組織のCopilot利用状況を可視化するWebアプリケーションである。リアルタイムデータとCSVデータの両方を扱い、グラフやテーブルなど豊富なUIコンポーネントを必要とする。

初期ページロードの高速化、SEO対応、そしてサーバーサイドでのデータ前処理が重要な要件となっている。

## 検討した選択肢

### 選択肢1: Next.js（App Router）
- **メリット**
  - フルスタックフレームワークで機能が充実
  - 大規模コミュニティとエコシステム
  - Vercelとの統合が優秀
- **デメリット**
  - 複雑で学習コストが高い
  - ビルドサイズが大きい
  - 設定の自由度が低い

### 選択肢2: Remix
- **メリット**
  - ネストルーティングが強力
  - データローディング戦略が優秀
  - Web標準に準拠
- **デメリット**
  - 日本語リソースが少ない
  - エコシステムがまだ成熟していない

### 選択肢3: Hono + React（SSR）
- **メリット**
  - 軽量で高速（Honoは非常に軽量）
  - カスタマイズの自由度が高い
  - TypeScriptファーストの設計
  - エッジランタイム対応
- **デメリット**
  - SSR実装を自前で構築する必要がある
  - フレームワーク機能を個別に実装

### 選択肢4: SPA（Vite + React）
- **メリット**
  - 開発体験が良い
  - ビルドが高速
  - クライアントサイドルーティングがシンプル
- **デメリット**
  - 初期ロードが遅い
  - SEO対策が困難
  - サーバーサイドでのデータ前処理ができない

## 決定
**選択肢3: Hono + React（SSR）を採用する**

## 理由
1. **パフォーマンス**: Honoは最も軽量なWebフレームワークの一つで、起動時間とレスポンスタイムが優秀
2. **TypeScript対応**: 完全なTypeScriptサポートにより、型安全性を確保
3. **柔軟性**: 必要な機能だけを選択的に実装でき、オーバーヘッドを最小限に抑えられる
4. **API統合**: 同一サーバーでAPIとSSRを提供できるため、データフェッチが効率的
5. **将来性**: エッジランタイムへの移行が容易

## 影響

### ポジティブ
- 初期表示が高速化される（SSRによる）
- サーバーサイドでGitHub APIの認証処理を安全に実行できる
- バンドルサイズを最小限に保てる
- カスタムキャッシュ戦略を実装できる

### ネガティブ
- SSRのセットアップに初期工数がかかる
- ハイドレーション処理を慎重に実装する必要がある
- ルーティングなどの基本機能を自前実装する必要がある

## 実装詳細

```typescript
// サーバー構成例
import { Hono } from 'hono';
import { renderToString } from 'react-dom/server';

const app = new Hono();

// APIエンドポイント
app.get('/api/users', async (c) => {
  const data = await fetchGitHubUsers();
  return c.json(data);
});

// SSRエンドポイント
app.get('/*', async (c) => {
  const html = renderToString(<App />);
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>${generateHead()}</head>
      <body>
        <div id="root">${html}</div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
});
```

## 参考資料
- [Hono公式ドキュメント](https://hono.dev/)
- [React SSRガイド](https://react.dev/reference/react-dom/server)
