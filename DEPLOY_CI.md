# GitHub CI 推送部署说明

## 目标

通过 GitHub Actions 自动构建后端二进制和前端静态资源，并把构建包推送到服务器部署接口：

- `POST /api/v1/deploy/push`
- 鉴权：`Authorization: Bearer <DEPLOY_PUSH_TOKEN>`
- 文件字段：
  - `backend_bundle` (`tar.gz`，包含 `main`、`notification`、`core-control`)
  - `web_bundle` (`tar.gz`，包含前端 `dist` 全量文件)

部署接口会把构建包解压到 `deploy/release` 挂载目录，并自动重启：

- 后端包：`backend`、`notification`
- 前端包：`web`

## 服务器配置

在 `.env.compose` 中至少配置：

```env
DEPLOY_PUSH_TOKEN=replace-with-long-random-token
DEPLOY_RELEASE_ROOT=/app/release
```

然后重启容器：

```bash
docker compose up -d
```

## GitHub Secrets

在仓库中添加：

- `DEPLOY_WEBHOOK_URL`：例如 `https://your-domain/api/v1/deploy/push`
- `DEPLOY_PUSH_TOKEN`：与服务器 `.env.compose` 中一致

## 工作流

工作流文件：`.github/workflows/deploy-server.yml`

- push 到 `main` 自动触发
- 支持 `workflow_dispatch` 手动触发
- 构建包会上传到 GitHub Artifact，同时可自动推送到服务器
