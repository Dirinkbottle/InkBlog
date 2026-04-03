# Docker Compose 部署说明

- `mysql` 和 `redis` 使用 Docker named volumes 持久化，不再绑定宿主机 `deploy/mysql`、`deploy/redis`。
- `mysql:8.4` 不再接受 `--default-authentication-plugin=mysql_native_password`，因此部署里不再传这个参数。
- `backend`、`notification`、`core-control`、`web` 不再在服务器本地 `build`。启动时先由 `release-sync` 容器从 GitHub Release 下载 `backend_bundle.tar.gz` 和 `web_bundle.tar.gz` 到 `deploy/release`。
- 镜像源可通过 `.env.compose` 覆盖：
  - `MYSQL_IMAGE`
  - `REDIS_IMAGE`
  - `RUNTIME_IMAGE`
  - `WEB_IMAGE`
- Release 下载默认使用直链 `github.com/<repo>/releases/download/<tag>/<asset>`，可通过 `GH_RELEASE_PROXY_PREFIX`/`GH_RELEASE_DOWNLOAD_BASE` 调整。
- 宿主机仍保留这些目录：
  - `deploy/runtime`
  - `deploy/uploads`
  - `deploy/logs`
  - `deploy/release`
- 部署脚本优先使用 `docker compose`，只有系统缺少 Compose v2 插件时才回退到旧版 `docker-compose`。
