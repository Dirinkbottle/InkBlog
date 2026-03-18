#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
ENV_FILE="${ROOT_DIR}/.env.compose"
COMPOSE_CMD=()

resolve_compose_cmd() {
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
    return
  fi

  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
    return
  fi

  echo "未找到 docker-compose 或 docker compose，请先安装 Docker Compose。" >&2
  exit 1
}

ensure_env_file() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    cp "${ROOT_DIR}/.env.compose.example" "${ENV_FILE}"
    echo "已创建 ${ENV_FILE}，请先检查数据库密码和端口配置。"
  fi
}

ensure_runtime_dirs() {
  mkdir -p \
    "${ROOT_DIR}/deploy/runtime" \
    "${ROOT_DIR}/deploy/uploads" \
    "${ROOT_DIR}/deploy/logs" \
    "${ROOT_DIR}/deploy/mysql" \
    "${ROOT_DIR}/deploy/redis"
}

compose() {
  "${COMPOSE_CMD[@]}" --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

print_install_hint() {
  local web_port
  web_port="$(grep '^WEB_PORT=' "${ENV_FILE}" | cut -d'=' -f2- || true)"
  web_port="${web_port:-8080}"
  cat <<EOF

服务已启动。
首次部署请访问:
  http://localhost:${web_port}/install

安装向导数据库建议填写:
  类型: mysql
  主机: mysql
  端口: 3306
  用户: \${MYSQL_USER}
  密码: \${MYSQL_PASSWORD}
  数据库: \${MYSQL_DATABASE}

通知服务会在安装完成并生成 config.json/install.lock 后自动启动。
EOF
}

usage() {
  cat <<'EOF'
用法:
  bash scripts/docker-compose-deploy.sh up
  bash scripts/docker-compose-deploy.sh down
  bash scripts/docker-compose-deploy.sh restart
  bash scripts/docker-compose-deploy.sh build
  bash scripts/docker-compose-deploy.sh logs [service]
  bash scripts/docker-compose-deploy.sh ps
  bash scripts/docker-compose-deploy.sh pull
  bash scripts/docker-compose-deploy.sh init

说明:
  init    仅初始化 .env.compose 和 deploy/ 目录
  up      后台启动整套服务并自动 build
  logs    默认跟随全部日志，也可指定 service 名称
EOF
}

command="${1:-up}"
service_name="${2:-}"

resolve_compose_cmd

case "${command}" in
  init)
    ensure_env_file
    ensure_runtime_dirs
    echo "初始化完成。"
    ;;
  up)
    ensure_env_file
    ensure_runtime_dirs
    compose up -d --build
    print_install_hint
    ;;
  down)
    ensure_env_file
    compose down
    ;;
  restart)
    ensure_env_file
    ensure_runtime_dirs
    compose down
    compose up -d --build
    ;;
  build)
    ensure_env_file
    ensure_runtime_dirs
    compose build
    ;;
  pull)
    ensure_env_file
    compose pull
    ;;
  logs)
    ensure_env_file
    if [[ -n "${service_name}" ]]; then
      compose logs -f "${service_name}"
    else
      compose logs -f
    fi
    ;;
  ps)
    ensure_env_file
    compose ps
    ;;
  *)
    usage
    exit 1
    ;;
esac
