# GitHub Copilot Metrics API

## 概要
GitHub Copilot Metrics APIは、組織内のCopilot使用状況に関する集計データを取得するためのAPIです。

## エンドポイント

### 組織のメトリクス取得
```
GET /orgs/{org}/copilot/metrics
```

### パラメータ

| パラメータ | 型 | 説明 |
|----------|-----|------|
| `org` | string | 組織名（必須） |
| `since` | string | 開始日時（ISO 8601形式） |
| `until` | string | 終了日時（ISO 8601形式） |
| `page` | integer | ページ番号 |
| `per_page` | integer | 1ページあたりの項目数（最大100） |

### レスポンス例

```json
{
  "total_active_users": 25,
  "total_engaged_users": 20,
  "copilot_ide_code_completions": {
    "total_engaged_users": 20,
    "languages": [
      {
        "name": "javascript",
        "total_engaged_users": 15
      },
      {
        "name": "typescript",
        "total_engaged_users": 12
      }
    ],
    "editors": [
      {
        "name": "vscode",
        "total_engaged_users": 18,
        "models": [
          {
            "name": "gpt-4",
            "is_custom_model": false,
            "custom_model_training_date": null,
            "total_engaged_users": 10,
            "total_code_suggestions": 1500,
            "total_code_acceptances": 450,
            "total_code_lines_suggested": 3000,
            "total_code_lines_accepted": 900
          }
        ]
      }
    ]
  },
  "copilot_ide_chat": {
    "total_engaged_users": 10,
    "editors": [
      {
        "name": "vscode",
        "total_engaged_users": 10,
        "models": [
          {
            "name": "gpt-4",
            "is_custom_model": false,
            "total_engaged_users": 10,
            "total_chats": 150,
            "total_chat_insertion_events": 50,
            "total_chat_copy_events": 30
          }
        ]
      }
    ]
  },
  "copilot_dotcom_chat": {
    "total_engaged_users": 5,
    "models": [
      {
        "name": "gpt-4",
        "is_custom_model": false,
        "total_engaged_users": 5,
        "total_chats": 50
      }
    ]
  },
  "copilot_dotcom_pull_requests": {
    "total_engaged_users": 3,
    "repositories": [
      {
        "name": "example-repo",
        "total_engaged_users": 3,
        "models": [
          {
            "name": "gpt-4",
            "is_custom_model": false,
            "total_pr_summaries_created": 10
          }
        ]
      }
    ]
  },
  "total_lines_suggested": 5000,
  "total_lines_accepted": 1500,
  "total_active_editors": 2
}
```

### 主要メトリクス

| メトリクス | 説明 |
|----------|------|
| `total_active_users` | アクティブユーザー数 |
| `total_engaged_users` | 実際に利用したユーザー数 |
| `total_lines_suggested` | 提案されたコード行数 |
| `total_lines_accepted` | 採用されたコード行数 |
| `total_code_suggestions` | コード提案の総数 |
| `total_code_acceptances` | 採用されたコード提案の数 |

### 認証
Personal Access Token（PAT）またはGitHub Appトークンが必要です。
トークンには`copilot`, `manage_billing:copilot`, `admin:org`のいずれかのスコープが必要です。

### レート制限
- 通常のAPI制限が適用されます
- 大量のデータを取得する場合は、ページネーションを使用してください

### 参考リンク
- [公式ドキュメント](https://docs.github.com/ja/rest/copilot/copilot-metrics?apiVersion=2022-11-28)