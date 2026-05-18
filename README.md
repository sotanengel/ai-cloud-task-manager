# CloudPilot

AIエージェント連携型マルチクラウド デプロイ・監視ツール

> AIと実クラウド環境（AWS / GCP / Azure）の間に立つ「検証・実行ゲートウェイ」。
> AIからのスクリプトを多層検証し、不正入力を拒否。検証通過タスクのみを実行する。

---

## アーキテクチャ

```
[AIエージェント] --MCP--> [CloudPilot] --検証OK--> [AWS / GCP / Azure]
                              |  検証NG → 構造化エラーを返す
[運用担当者] --ブラウザ--> [WebUI（タスク可視化）]
```

### コンポーネント構成

| パッケージ | 責務 |
|---|---|
| `packages/core` | スクリプトバリデーション（L1〜L5）、タスクオーケストレータ、タスクストア（SQLite） |
| `packages/adapters` | AWS / GCP / Azure クラウドアダプタ |
| `packages/mcp-server` | Fastify Task API + MCPサーバ |
| `packages/web` | React WebUI（タスク可視化・承認） |

---

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| 言語 | TypeScript (Node.js ≥ 20) |
| APIサーバ | Fastify v5 |
| WebUI | React 18 + Vite |
| スキーマ検証 | AJV (JSON Schema v7) |
| DB | SQLite + Drizzle ORM |
| テスト | Vitest |
| CI/CD | GitHub Actions |
| セキュリティスキャン | Shisho Guard |
| コンテナ | Docker（マルチステージ）+ docker compose |

---

## セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .env を編集してクラウド認証情報等を設定

# ビルド
npm run build

# 開発サーバ起動（docker compose）
docker compose up
```

---

## 開発

```bash
# 全パッケージのテスト実行
npm run test

# 型チェック
npm run typecheck

# Lint
npm run lint

# 特定パッケージのみ
cd packages/core && npm test
```

---

## タスクスクリプト仕様

CloudPilotに渡すスクリプトは YAML または JSON で記述します。

```yaml
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: deploy-web-api-prod
  labels:
    team: platform
spec:
  provider: aws                    # aws | gcp | azure
  region: ap-northeast-1
  environment: production          # development | staging | production
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

スキーマ詳細・エラーコード一覧は `docs/` を参照してください。

---

## 開発ロードマップ

| フェーズ | PR | 内容 |
|---|---|---|
| Phase 0 | PR#1 | リポジトリ初期化（本PR） |
| Phase 0 | PR#2 | Shisho Guard + CI/CD |
| Phase 1 | PR#3 | JSON Schema + L1/L2バリデータ |
| Phase 1 | PR#4 | L3/L4/L5バリデーション + 構造化エラー |
| Phase 1 | PR#5 | タスクオーケストレータ + SQLiteストア |
| Phase 2 | PR#6〜9 | クラウドアダプタ（AWS/GCP/Azure）+ 監視 |
| Phase 3 | PR#10〜12 | MCPサーバ + WebUI + Docker + E2E |

---

## ライセンス

[LICENSE](./LICENSE) を参照
