#!/usr/bin/env sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
ROOT_DIR="$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)"

log() {
  echo "[release-sync] $*"
}

require_var() {
  var_name="$1"
  var_value="$2"
  if [ -z "$var_value" ]; then
    echo "[release-sync] missing required env: ${var_name}" >&2
    exit 1
  fi
}

join_proxy_url() {
  url="$1"
  if [ -z "${GH_RELEASE_PROXY_PREFIX:-}" ]; then
    printf '%s' "$url"
    return
  fi
  case "$GH_RELEASE_PROXY_PREFIX" in
    */) printf '%s%s' "$GH_RELEASE_PROXY_PREFIX" "$url" ;;
    *) printf '%s/%s' "$GH_RELEASE_PROXY_PREFIX" "$url" ;;
  esac
}

download_asset() {
  source_url="$1"
  target_path="$2"
  resolved_url="$(join_proxy_url "$source_url")"

  if command -v curl >/dev/null 2>&1; then
    if [ -n "${GH_RELEASE_TOKEN:-}" ]; then
      curl -fSL --retry 4 --retry-all-errors --connect-timeout 20 \
        -H "Authorization: Bearer ${GH_RELEASE_TOKEN}" \
        "$resolved_url" \
        -o "$target_path"
    else
      curl -fSL --retry 4 --retry-all-errors --connect-timeout 20 \
        "$resolved_url" \
        -o "$target_path"
    fi
  else
    # Alpine busybox wget is available by default, avoid runtime apk add.
    if [ -n "${GH_RELEASE_TOKEN:-}" ]; then
      wget -q --tries=4 --timeout=20 \
        --header="Authorization: Bearer ${GH_RELEASE_TOKEN}" \
        -O "$target_path" \
        "$resolved_url"
    else
      wget -q --tries=4 --timeout=20 \
        -O "$target_path" \
        "$resolved_url"
    fi
  fi
}

verify_sha256() {
  bundle_file="$1"
  sha_file="$2"

  expected="$(awk 'NR==1{print $1}' "$sha_file")"
  actual="$(sha256sum "$bundle_file" | awk '{print $1}')"
  if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
    echo "[release-sync] sha256 mismatch for $(basename "$bundle_file")" >&2
    exit 1
  fi
}

normalize_repo() {
  repo="$1"
  if printf '%s' "$repo" | grep -Eq '^https?://'; then
    repo="$(printf '%s' "$repo" | sed -E 's#^https?://github.com/##; s#/$##; s#\.git$##')"
  fi

  if ! printf '%s' "$repo" | grep -Eq '^[^/]+/[^/]+$'; then
    echo "[release-sync] invalid GH_RELEASE_REPO format: ${repo}" >&2
    echo "[release-sync] expected: owner/repo (example: Dirinkbottle/InkBlog)" >&2
    exit 1
  fi

  printf '%s' "$repo"
}

has_local_assets() {
  [ -f "$BACKEND_BUNDLE_PATH" ] && \
    [ -f "$BACKEND_SHA_PATH" ] && \
    [ -f "$WEB_BUNDLE_PATH" ] && \
    [ -f "$WEB_SHA_PATH" ]
}

fetch_assets_to_cache() {
  require_var "GH_RELEASE_REPO" "$GH_RELEASE_REPO"

  if [ -z "$GH_RELEASE_DOWNLOAD_BASE" ]; then
    GH_RELEASE_DOWNLOAD_BASE="https://github.com/${GH_RELEASE_REPO}/releases/download/${GH_RELEASE_TAG}"
  fi

  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  backend_bundle_tmp="${tmp_dir}/backend_bundle.tar.gz"
  backend_sha_tmp="${tmp_dir}/backend_bundle.tar.gz.sha256"
  web_bundle_tmp="${tmp_dir}/web_bundle.tar.gz"
  web_sha_tmp="${tmp_dir}/web_bundle.tar.gz.sha256"

  backend_bundle_url="${GH_RELEASE_DOWNLOAD_BASE}/${GH_RELEASE_BACKEND_ASSET}"
  backend_sha_url="${GH_RELEASE_DOWNLOAD_BASE}/${GH_RELEASE_BACKEND_SHA_ASSET}"
  web_bundle_url="${GH_RELEASE_DOWNLOAD_BASE}/${GH_RELEASE_WEB_ASSET}"
  web_sha_url="${GH_RELEASE_DOWNLOAD_BASE}/${GH_RELEASE_WEB_SHA_ASSET}"

  log "downloading backend bundle to cache: ${backend_bundle_url}"
  download_asset "$backend_bundle_url" "$backend_bundle_tmp"
  download_asset "$backend_sha_url" "$backend_sha_tmp"

  log "downloading web bundle to cache: ${web_bundle_url}"
  download_asset "$web_bundle_url" "$web_bundle_tmp"
  download_asset "$web_sha_url" "$web_sha_tmp"

  mv -f "$backend_bundle_tmp" "$BACKEND_BUNDLE_PATH"
  mv -f "$backend_sha_tmp" "$BACKEND_SHA_PATH"
  mv -f "$web_bundle_tmp" "$WEB_BUNDLE_PATH"
  mv -f "$web_sha_tmp" "$WEB_SHA_PATH"

  rm -rf "$tmp_dir"
  trap - EXIT
}

extract_assets() {
  extract_dir="$1"

  mkdir -p "${extract_dir}/bin" "${extract_dir}/web"
  rm -rf "${extract_dir}/bin"/*
  rm -rf "${extract_dir}/web"/*

  log "extracting backend bundle to ${extract_dir}/bin"
  tar -xzf "$BACKEND_BUNDLE_PATH" -C "${extract_dir}/bin"

  for bin in main notification core-control; do
    if [ ! -f "${extract_dir}/bin/${bin}" ]; then
      echo "[release-sync] missing binary after extract: ${extract_dir}/bin/${bin}" >&2
      exit 1
    fi
    chmod +x "${extract_dir}/bin/${bin}"
  done

  log "extracting web bundle to ${extract_dir}/web"
  tar -xzf "$WEB_BUNDLE_PATH" -C "${extract_dir}/web"
}

GH_RELEASE_REPO="${GH_RELEASE_REPO:-}"
GH_RELEASE_TAG="${GH_RELEASE_TAG:-deploy-latest}"
GH_RELEASE_TOKEN="${GH_RELEASE_TOKEN:-}"
GH_RELEASE_PROXY_PREFIX="${GH_RELEASE_PROXY_PREFIX:-https://gh-proxy.org}"
GH_RELEASE_DOWNLOAD_BASE="${GH_RELEASE_DOWNLOAD_BASE:-}"
GH_RELEASE_CACHE_DIR="${GH_RELEASE_CACHE_DIR:-${ROOT_DIR}/github-release}"
GH_RELEASE_EXTRACT_DIR="${GH_RELEASE_EXTRACT_DIR:-}"
GH_RELEASE_FORCE_DOWNLOAD="${GH_RELEASE_FORCE_DOWNLOAD:-0}"
GH_RELEASE_BACKEND_ASSET="${GH_RELEASE_BACKEND_ASSET:-backend_bundle.tar.gz}"
GH_RELEASE_BACKEND_SHA_ASSET="${GH_RELEASE_BACKEND_SHA_ASSET:-backend_bundle.tar.gz.sha256}"
GH_RELEASE_WEB_ASSET="${GH_RELEASE_WEB_ASSET:-web_bundle.tar.gz}"
GH_RELEASE_WEB_SHA_ASSET="${GH_RELEASE_WEB_SHA_ASSET:-web_bundle.tar.gz.sha256}"

if [ -n "$GH_RELEASE_REPO" ]; then
  GH_RELEASE_REPO="$(normalize_repo "$GH_RELEASE_REPO")"
fi

mkdir -p "$GH_RELEASE_CACHE_DIR"

BACKEND_BUNDLE_PATH="${GH_RELEASE_CACHE_DIR}/${GH_RELEASE_BACKEND_ASSET}"
BACKEND_SHA_PATH="${GH_RELEASE_CACHE_DIR}/${GH_RELEASE_BACKEND_SHA_ASSET}"
WEB_BUNDLE_PATH="${GH_RELEASE_CACHE_DIR}/${GH_RELEASE_WEB_ASSET}"
WEB_SHA_PATH="${GH_RELEASE_CACHE_DIR}/${GH_RELEASE_WEB_SHA_ASSET}"

cache_source="local"
if [ "$GH_RELEASE_FORCE_DOWNLOAD" = "1" ] || ! has_local_assets; then
  cache_source="github"
  fetch_assets_to_cache
else
  log "using cached release assets from ${GH_RELEASE_CACHE_DIR}"
fi

verify_sha256 "$BACKEND_BUNDLE_PATH" "$BACKEND_SHA_PATH"
verify_sha256 "$WEB_BUNDLE_PATH" "$WEB_SHA_PATH"

meta_file="${GH_RELEASE_CACHE_DIR}/.github-release-meta"
if [ -n "$GH_RELEASE_EXTRACT_DIR" ]; then
  extract_assets "$GH_RELEASE_EXTRACT_DIR"
  meta_file="${GH_RELEASE_EXTRACT_DIR}/.github-release-meta"
fi

cat > "$meta_file" <<EOF_META
repo=${GH_RELEASE_REPO}
tag=${GH_RELEASE_TAG}
source=${cache_source}
download_base=${GH_RELEASE_DOWNLOAD_BASE}
cache_dir=${GH_RELEASE_CACHE_DIR}
synced_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF_META

log "release assets ready (cache: ${GH_RELEASE_CACHE_DIR}${GH_RELEASE_EXTRACT_DIR:+, extract: ${GH_RELEASE_EXTRACT_DIR}})"
