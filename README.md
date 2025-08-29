# GitHub Copilot Manager

GitHub Copilot組織ライセンス管理ツール

## 概要

このツールは、組織で使用されているGitHub Copilotのライセンスを効率的に管理するためのGUIアプリケーションです。複数のデータソースから情報を統合し、ライセンス使用状況の可視化と管理を行います。

## 主な機能

- **ライセンス使用状況の可視化**: 組織内のCopilot利用状況をリアルタイムで確認
- **ユーザー管理**: ライセンスの割り当て・削除を一元管理
- **使用量モニタリング**: モデル別、ユーザー別の使用量を追跡
- **コスト分析**: 月次クォータの管理と超過アラート
- **レポート生成**: CSVエクスポートによる詳細分析

## データソース

### 1. GitHub GUI CSVエクスポート
組織の管理画面からダウンロード可能なCSVファイル

**フォーマット（正規化キー）:**
- `timestamp`: 記録日時
- `user`: ユーザー名（login/username などを正規化）
- `model`: 使用モデル（gpt-4, gpt-3.5-turbo 等）
- `useQuota`: 使用量（usage/used/credits_used 等を正規化）
- `limitMonthlyQuota`: 月次制限（monthly_quota/monthly_limit 等を正規化）
- `exceedsMonthlyQuota`: 制限超過フラグ（exceeded/is_exceeded 等を正規化）

注: 実CSVの列名はエクスポート元により異なる場合があります。本リポジトリでは `src/parsers/usage-headers.ts` の別名マップで柔軟に対応しています。必要に応じてこのマップを編集してください。

### 2. 利用申請記録
内部管理用の利用者記録

**フォーマット:**
- 利用者名
- ユーザーID
- 利用開始日
- 利用終了日（オプション）

### 3. GitHub API
Octokitライブラリを使用したAPI連携
- [Copilot Metrics API](./docs/copilot-metrics-api.md): 使用状況メトリクスの取得
- [Copilot User Management API](./docs/copilot-user-management-api.md): ユーザーシート管理

## セットアップ

### 必要要件

- Node.js 20以上
- pnpm 8以上
- GitHub Personal Access Token（以下のスコープが必要）
  - `copilot`
  - `manage_billing:copilot`
  - `admin:org`

### インストール

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集し、必要な設定を行う
```

### 環境変数

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_ORG=your_organization_name
```

## 使用方法

### 開発環境での起動

```bash
# TypeScriptファイルの直接実行
npx tsx src/index.ts

# ビルドと実行
pnpm build
node dist/index.js
```

### データのインポート

1. **CSVデータのインポート**
   - GitHub管理画面からCSVをダウンロード
   - アプリケーション内の「インポート」機能を使用

2. **利用記録の更新**
   - JSON形式で利用記録を管理
   - `data/usage-records.json`を編集

3. **API経由でのデータ同期**
   - 「同期」ボタンでGitHub APIから最新データを取得

## プロジェクト構造

```
github-copilot-manager/
├── src/                  # TypeScriptソースコード
│   ├── index.ts         # メインエントリーポイント
│   ├── api/            # GitHub API連携
│   ├── models/         # データモデル
│   ├── services/       # ビジネスロジック
│   └── ui/            # GUI コンポーネント
├── data/                # デモデータ
│   ├── demo-usage.csv           # CSVサンプル
│   └── demo-usage-records.json  # 利用記録サンプル
├── docs/                # ドキュメント
│   ├── copilot-metrics-api.md
│   └── copilot-user-management-api.md
├── tsconfig.json        # TypeScript設定
├── package.json         # 依存関係
└── CLAUDE.md           # 開発ガイドライン
```

## 開発ガイドライン

TypeScriptのコーディング規約については[CLAUDE.md](./CLAUDE.md)を参照してください。

### 主要な規約
- `any`型の使用禁止
- `const`の使用を推奨
- 純粋関数ベースの実装
- `Result<T, E>`型によるエラーハンドリング
- クラスは使用せず、関数とオブジェクトで実装

## デモデータ

開発・テスト用のデモデータを`data/`ディレクトリに用意しています:
- `demo-usage.csv`: 30件のサンプル使用量データ
- `demo-usage-records.json`: 20名分の利用記録

## ライセンス

MIT

## サポート

問題や質問がある場合は、Issueを作成してください。
