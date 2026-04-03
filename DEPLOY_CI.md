# GitHub CI 推送部署说明

## 目标

通过 GitHub Actions 自动构建后端二进制和前端静态资源，并做两件事：

1. 上传到 GitHub Release（服务器启动时从这里下载）
2. 可选推送到服务器部署接口（实时热推送）

部署接口：

- `POST /api/v1/deploy/push`
- 鉴权：`Authorization: Bearer <DEPLOY_PUSH_TOKEN>`
- 文件字段：
  - `backend_bundle` (`tar.gz`，包含 `main`、`notification`、`core-control`)
  - `web_bundle` (`tar.gz`，包含前端 `dist` 全量文件)

部署接口会把构建包解压到 `deploy/release` 挂载目录，并自动重启：

- 后端包：`backend`、`notification`
- 前端包：`web`

## 服务器配置（Docker 启动时从 GitHub 拉取）

在 `.env.compose` 中至少配置：

```env
DEPLOY_PUSH_TOKEN=replace-with-long-random-token
DEPLOY_RELEASE_ROOT=/app/release
GH_RELEASE_REPO=your-org-or-user/InkBlog
GH_RELEASE_TAG=deploy-latest
GH_RELEASE_TOKEN= # 私有仓库必填，公开仓库可留空
```

然后重启容器：

```bash
docker compose up -d
```

## GitHub Secrets

在仓库中添加：

- `DEPLOY_WEBHOOK_URL`：例如 `https://your-domain/api/v1/deploy/push`
- `DEPLOY_PUSH_TOKEN`：与服务器 `.env.compose` 中一致
- 如果仓库私有：`GH_RELEASE_TOKEN`（可复用 `DEPLOY_PUSH_TOKEN`，但建议独立 token）

## GitHub Release 产物规范

`deploy-server.yml` 会持续更新 `deploy-latest` tag 下的 4 个资产：

- `backend_bundle.tar.gz`
- `backend_bundle.tar.gz.sha256`
- `web_bundle.tar.gz`
- `web_bundle.tar.gz.sha256`

`release-sync` 容器会在每次 `docker compose up` 时先下载这 4 个文件，再解压到：

- `deploy/release/bin`
- `deploy/release/web`

## 工作流

工作流文件：`.github/workflows/deploy-server.yml`

- push 到 `main` 自动触发
- 支持 `workflow_dispatch` 手动触发
- 构建包会上传到 GitHub Artifact
- 构建包会同步发布到 GitHub Release `deploy-latest`
- 可选自动推送到服务器部署接口（`push_to_server=true`）
