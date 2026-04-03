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

curl_json() {
  url="$1"
  if [ -n "${GH_RELEASE_TOKEN:-}" ]; then
    curl -fsSL -H "Authorization: Bearer ${GH_RELEASE_TOKEN}" "$url"
  else
    curl -fsSL "$url"
  fi
}

download_asset() {
  release_json_path="$1"
  asset_name="$2"
  target_path="$3"

  asset_api_url="$(jq -r --arg name "$asset_name" '.assets[] | select(.name == $name) | .url' "$release_json_path" | head -n 1)"
  if [ -z "$asset_api_url" ] || [ "$asset_api_url" = "null" ]; then
    echo "[release-sync] asset not found in release: ${asset_name}" >&2
    exit 1
  fi

  if [ -n "${GH_RELEASE_TOKEN:-}" ]; then
    curl -fsSL \
      -H "Authorization: Bearer ${GH_RELEASE_TOKEN}" \
      -H "Accept: application/octet-stream" \
      "$asset_api_url" \
      -o "$target_path"
  else
    curl -fsSL \
      -H "Accept: application/octet-stream" \
      "$asset_api_url" \
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
GH_RELEASE_BACKEND_ASSET="${GH_RELEASE_BACKEND_ASSET:-backend_bundle.tar.gz}"
GH_RELEASE_BACKEND_SHA_ASSET="${GH_RELEASE_BACKEND_SHA_ASSET:-backend_bundle.tar.gz.sha256}"
GH_RELEASE_WEB_ASSET="${GH_RELEASE_WEB_ASSET:-web_bundle.tar.gz}"
GH_RELEASE_WEB_SHA_ASSET="${GH_RELEASE_WEB_SHA_ASSET:-web_bundle.tar.gz.sha256}"

require_var "GH_RELEASE_REPO" "$GH_RELEASE_REPO"

if [ "$GH_RELEASE_TAG" = "latest" ]; then
  RELEASE_API_URL="https://api.github.com/repos/${GH_RELEASE_REPO}/releases/latest"
else
  RELEASE_API_URL="https://api.github.com/repos/${GH_RELEASE_REPO}/releases/tags/${GH_RELEASE_TAG}"
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

RELEASE_JSON_PATH="${TMP_DIR}/release.json"
BACKEND_BUNDLE_PATH="${TMP_DIR}/backend_bundle.tar.gz"
BACKEND_SHA_PATH="${TMP_DIR}/backend_bundle.tar.gz.sha256"
WEB_BUNDLE_PATH="${TMP_DIR}/web_bundle.tar.gz"
WEB_SHA_PATH="${TMP_DIR}/web_bundle.tar.gz.sha256"

log "fetching release metadata: ${RELEASE_API_URL}"
curl_json "$RELEASE_API_URL" > "$RELEASE_JSON_PATH"

log "downloading backend bundle"
download_asset "$RELEASE_JSON_PATH" "$GH_RELEASE_BACKEND_ASSET" "$BACKEND_BUNDLE_PATH"
download_asset "$RELEASE_JSON_PATH" "$GH_RELEASE_BACKEND_SHA_ASSET" "$BACKEND_SHA_PATH"
verify_sha256 "$BACKEND_BUNDLE_PATH" "$BACKEND_SHA_PATH"

log "downloading web bundle"
download_asset "$RELEASE_JSON_PATH" "$GH_RELEASE_WEB_ASSET" "$WEB_BUNDLE_PATH"
download_asset "$RELEASE_JSON_PATH" "$GH_RELEASE_WEB_SHA_ASSET" "$WEB_SHA_PATH"
verify_sha256 "$WEB_BUNDLE_PATH" "$WEB_SHA_PATH"

mkdir -p /release/bin /release/web
rm -rf /release/bin/*
rm -rf /release/web/*

log "extracting backend bundle to /release/bin"
tar -xzf "$BACKEND_BUNDLE_PATH" -C /release/bin
chmod +x /release/bin/main /release/bin/notification /release/bin/core-control

log "extracting web bundle to /release/web"
tar -xzf "$WEB_BUNDLE_PATH" -C /release/web

TAG_NAME="$(jq -r '.tag_name // ""' "$RELEASE_JSON_PATH")"
RELEASE_NAME="$(jq -r '.name // ""' "$RELEASE_JSON_PATH")"
PUBLISHED_AT="$(jq -r '.published_at // ""' "$RELEASE_JSON_PATH")"

cat > /release/.github-release-meta <<EOF
repo=${GH_RELEASE_REPO}
tag=${TAG_NAME}
name=${RELEASE_NAME}
published_at=${PUBLISHED_AT}
synced_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

log "release bundles synced successfully"
