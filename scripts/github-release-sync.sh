#!/usr/bin/env sh

set -eu

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

GH_RELEASE_REPO="${GH_RELEASE_REPO:-}"
GH_RELEASE_TAG="${GH_RELEASE_TAG:-deploy-latest}"
GH_RELEASE_PROXY_PREFIX="${GH_RELEASE_PROXY_PREFIX:-https://gh-proxy.org}"
GH_RELEASE_DOWNLOAD_BASE="${GH_RELEASE_DOWNLOAD_BASE:-}"
GH_RELEASE_BACKEND_ASSET="${GH_RELEASE_BACKEND_ASSET:-backend_bundle.tar.gz}"
GH_RELEASE_BACKEND_SHA_ASSET="${GH_RELEASE_BACKEND_SHA_ASSET:-backend_bundle.tar.gz.sha256}"
GH_RELEASE_WEB_ASSET="${GH_RELEASE_WEB_ASSET:-web_bundle.tar.gz}"
GH_RELEASE_WEB_SHA_ASSET="${GH_RELEASE_WEB_SHA_ASSET:-web_bundle.tar.gz.sha256}"

require_var "GH_RELEASE_REPO" "$GH_RELEASE_REPO"

if printf '%s' "$GH_RELEASE_REPO" | grep -Eq '^https?://'; then
  GH_RELEASE_REPO="$(printf '%s' "$GH_RELEASE_REPO" | sed -E 's#^https?://github.com/##; s#/$##; s#\.git$##')"
fi

if ! printf '%s' "$GH_RELEASE_REPO" | grep -Eq '^[^/]+/[^/]+$'; then
  echo "[release-sync] invalid GH_RELEASE_REPO format: ${GH_RELEASE_REPO}" >&2
  echo "[release-sync] expected: owner/repo (example: Dirinkbottle/InkBlog)" >&2
  exit 1
fi

if [ -z "$GH_RELEASE_DOWNLOAD_BASE" ]; then
  GH_RELEASE_DOWNLOAD_BASE="https://github.com/${GH_RELEASE_REPO}/releases/download/${GH_RELEASE_TAG}"
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

BACKEND_BUNDLE_PATH="${TMP_DIR}/backend_bundle.tar.gz"
BACKEND_SHA_PATH="${TMP_DIR}/backend_bundle.tar.gz.sha256"
WEB_BUNDLE_PATH="${TMP_DIR}/web_bundle.tar.gz"
WEB_SHA_PATH="${TMP_DIR}/web_bundle.tar.gz.sha256"

backend_bundle_url="${GH_RELEASE_DOWNLOAD_BASE}/${GH_RELEASE_BACKEND_ASSET}"
backend_sha_url="${GH_RELEASE_DOWNLOAD_BASE}/${GH_RELEASE_BACKEND_SHA_ASSET}"
web_bundle_url="${GH_RELEASE_DOWNLOAD_BASE}/${GH_RELEASE_WEB_ASSET}"
web_sha_url="${GH_RELEASE_DOWNLOAD_BASE}/${GH_RELEASE_WEB_SHA_ASSET}"

log "downloading backend bundle: ${backend_bundle_url}"
download_asset "$backend_bundle_url" "$BACKEND_BUNDLE_PATH"
download_asset "$backend_sha_url" "$BACKEND_SHA_PATH"
verify_sha256 "$BACKEND_BUNDLE_PATH" "$BACKEND_SHA_PATH"

log "downloading web bundle: ${web_bundle_url}"
download_asset "$web_bundle_url" "$WEB_BUNDLE_PATH"
download_asset "$web_sha_url" "$WEB_SHA_PATH"
verify_sha256 "$WEB_BUNDLE_PATH" "$WEB_SHA_PATH"

mkdir -p /release/bin /release/web
rm -rf /release/bin/*
rm -rf /release/web/*

log "extracting backend bundle to /release/bin"
tar -xzf "$BACKEND_BUNDLE_PATH" -C /release/bin
chmod +x /release/bin/main /release/bin/notification /release/bin/core-control

log "extracting web bundle to /release/web"
tar -xzf "$WEB_BUNDLE_PATH" -C /release/web

cat > /release/.github-release-meta <<EOF
repo=${GH_RELEASE_REPO}
tag=${GH_RELEASE_TAG}
source=${GH_RELEASE_DOWNLOAD_BASE}
synced_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

log "release bundles synced successfully"
