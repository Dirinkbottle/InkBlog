# Docker Compose 部署说明

- `mysql` 和 `redis` 使用 Docker named volumes 持久化，不再绑定宿主机 `deploy/mysql`、`deploy/redis`。
- `mysql:8.4` 不再接受 `--default-authentication-plugin=mysql_native_password`，因此部署里不再传这个参数。
- 宿主机仍保留这些目录：
  - `deploy/runtime`
  - `deploy/uploads`
  - `deploy/logs`
- 部署脚本优先使用 `docker compose`，只有系统缺少 Compose v2 插件时才回退到旧版 `docker-compose`。
