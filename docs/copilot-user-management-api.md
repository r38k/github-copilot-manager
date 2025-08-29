# GitHub Copilot User Management API

## 概要
GitHub Copilot User Management APIは、組織内のCopilotシートの割り当てとユーザー管理を行うためのAPIです。

## エンドポイント

### 1. Copilotシートの取得
```
GET /orgs/{org}/copilot/billing/seats
```

#### パラメータ
| パラメータ | 型 | 説明 |
|----------|-----|------|
| `org` | string | 組織名（必須） |
| `page` | integer | ページ番号（デフォルト: 1） |
| `per_page` | integer | 1ページあたりの項目数（デフォルト: 50、最大: 100） |

#### レスポンス例
```json
{
  "total_seats": 100,
  "seats": [
    {
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-20T14:30:00Z",
      "pending_cancellation_date": null,
      "last_activity_at": "2024-01-20T10:00:00Z",
      "last_activity_editor": "vscode",
      "assignee": {
        "login": "user1",
        "id": 12345,
        "node_id": "MDQ6VXNlcjEyMzQ1",
        "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/user1",
        "html_url": "https://github.com/user1",
        "type": "User",
        "site_admin": false,
        "name": "User One",
        "email": "user1@example.com"
      },
      "assigning_team": null
    }
  ]
}
```

### 2. ユーザーへのシート割り当て
```
POST /orgs/{org}/copilot/billing/selected_users
```

#### リクエストボディ
```json
{
  "selected_usernames": ["username1", "username2"]
}
```

#### レスポンス例
```json
{
  "seats_created": 2
}
```

### 3. ユーザーからのシート削除
```
DELETE /orgs/{org}/copilot/billing/selected_users
```

#### リクエストボディ
```json
{
  "selected_usernames": ["username1", "username2"]
}
```

#### レスポンス例
```json
{
  "seats_cancelled": 2
}
```

### 4. チームへのシート割り当て
```
POST /orgs/{org}/copilot/billing/selected_teams
```

#### リクエストボディ
```json
{
  "selected_teams": ["team-slug-1", "team-slug-2"]
}
```

#### レスポンス例
```json
{
  "seats_created": 10
}
```

### 5. チームからのシート削除
```
DELETE /orgs/{org}/copilot/billing/selected_teams
```

#### リクエストボディ
```json
{
  "selected_teams": ["team-slug-1", "team-slug-2"]
}
```

### 6. 組織のCopilot詳細取得
```
GET /orgs/{org}/copilot/billing
```

#### レスポンス例
```json
{
  "seat_breakdown": {
    "total": 100,
    "added_this_cycle": 10,
    "pending_invitation": 5,
    "pending_cancellation": 2,
    "active_this_cycle": 85,
    "inactive_this_cycle": 8
  },
  "seat_management_setting": "assign_all",
  "public_code_suggestions": "allow"
}
```

## シート管理設定

| 設定値 | 説明 |
|--------|------|
| `assign_all` | 組織の全メンバーにCopilotアクセスを付与 |
| `assign_selected` | 選択したメンバーのみにアクセスを付与 |
| `disabled` | Copilotを無効化 |

## 認証とスコープ

### 必要なスコープ
- `copilot` - 読み取りアクセス
- `manage_billing:copilot` - シートの管理
- `admin:org` - 組織の管理者権限

### 認証方法
```javascript
// Octokitの例
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: 'ghp_xxxxxxxxxxxxxxxxxxxx'
});

// シート情報の取得
const response = await octokit.request('GET /orgs/{org}/copilot/billing/seats', {
  org: 'your-org-name'
});
```

## レート制限
- 標準のGitHub APIレート制限が適用されます
- 認証済み: 5000リクエスト/時間
- 大量操作時はページネーションを使用してください

## エラーハンドリング

| ステータスコード | 説明 |
|----------------|------|
| 401 | 認証エラー |
| 403 | 権限不足 |
| 404 | 組織が見つからない、またはCopilotが有効でない |
| 422 | 無効なパラメータ |

## ベストプラクティス

1. **バッチ処理**: 複数ユーザーの追加/削除は一度のAPIコールで行う
2. **ページネーション**: 大量のシート情報取得時は必ずページネーションを使用
3. **エラーハンドリング**: レート制限エラーに対してリトライロジックを実装
4. **監査ログ**: シート変更操作は全て記録する

## 参考リンク
- [公式ドキュメント](https://docs.github.com/ja/rest/copilot/copilot-user-management?apiVersion=2022-11-28)