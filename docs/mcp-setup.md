# CloudPilot MCP セットアップガイド

AIエージェント（Claude等）から CloudPilot をMCPツールとして使う手順です。

## 前提

- Node.js 20+
- CloudPilot がビルド済み（`npm run build`）

## 起動方法

### MCP モード（AIエージェント用）

```bash
CLOUDPILOT_MODE=mcp node packages/mcp-server/dist/index.js
```

### API モード（WebUI + REST API）

```bash
node packages/mcp-server/dist/index.js
# または
docker compose up
```

## Claude Desktop への組み込み

`claude_desktop_config.json` に追加:

```json
{
  "mcpServers": {
    "cloudpilot": {
      "command": "node",
      "args": ["/path/to/ai-cloud-task-manager/packages/mcp-server/dist/index.js"],
      "env": {
        "CLOUDPILOT_MODE": "mcp",
        "DATABASE_PATH": "/path/to/cloudpilot.db",
        "AWS_ACCESS_KEY_ID": "your-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret",
        "AWS_DEFAULT_REGION": "ap-northeast-1"
      }
    }
  }
}
```

## 利用可能なMCPツール

| ツール | 説明 |
|---|---|
| `get_script_schema` | タスクスクリプトのJSONスキーマを取得（最初にこれを呼ぶ） |
| `submit_task` | タスクスクリプトを投入して検証・実行 |
| `get_task_status` | タスクIDで状態を確認 |
| `list_tasks` | 全タスクの一覧取得 |

## スクリプト例

```yaml
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: deploy-web-api-prod
  labels:
    team: platform
spec:
  provider: aws
  region: ap-northeast-1
  environment: production
  dryRun: false
  approvalRequired: true
  resources:
    - type: container_service
      name: web-api
      image: registry.example.com/web-api:1.4.2
      replicas: 3
      cpu: "0.5"
      memory: "1Gi"
  monitoring:
    alerts:
      - metric: cpu_utilization
        threshold: 80
        window: 5m
  constraints:
    maxMonthlyCostUsd: 500
    allowedResourceTypes: [container_service, load_balancer]
```

## エラー時の対応

検証エラーが返ってきた場合は、`errors[].suggestion` に修正方法が含まれています。
詳細は [error-codes.md](./error-codes.md) を参照してください。
