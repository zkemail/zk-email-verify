#!/usr/bin/env bash
set -euo pipefail

TAG="nodes-19907546951"
BASE="https://github.com/paritytech/hardhat-polkadot/releases/download/$TAG"

OS="$(uname -s)"
ARCH="$(uname -m)"

DEV_NODE_ASSET=""
ETH_RPC_ASSET=""

if [[ "$OS" == "Darwin" && ( "$ARCH" == "arm64" || "$ARCH" == "x86_64" ) ]]; then
  DEV_NODE_ASSET="revive-dev-node-darwin-arm64"
  ETH_RPC_ASSET="eth-rpc-darwin-arm64"
elif [[ "$OS" == "Linux" && "$ARCH" == "x86_64" ]]; then
  DEV_NODE_ASSET="revive-dev-node-linux-x64"
  ETH_RPC_ASSET="eth-rpc-linux-x64"
else
  echo "Unsupported platform: $OS $ARCH" >&2
  exit 1
fi

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/bin"
DEV_NODE_PATH="$BIN_DIR/dev-node"
ETH_RPC_PATH="$BIN_DIR/eth-rpc"

mkdir -p "$BIN_DIR"

download_if_missing() {
  local url="$1"
  local dest="$2"
  if [[ ! -x "$dest" ]]; then
    echo "Downloading $(basename "$dest") from $url"
    curl -L --fail "$url" -o "$dest"
    chmod +x "$dest"
  fi
}

download_if_missing "$BASE/$DEV_NODE_ASSET" "$DEV_NODE_PATH"
download_if_missing "$BASE/$ETH_RPC_ASSET" "$ETH_RPC_PATH"


