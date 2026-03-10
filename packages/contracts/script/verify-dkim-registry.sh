#!/bin/bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

: "${ETHERSCAN_API_KEY:?ETHERSCAN_API_KEY is required}"
: "${CHAIN_ID:?CHAIN_ID is required}"
: "${OWNER:?OWNER is required}"

BROADCAST_FILE="broadcast/DeployDKIMRegistry.s.sol/${CHAIN_ID}/run-latest.json"

if [ -z "${DKIM_REGISTRY:-}" ]; then
  if [ ! -f "$BROADCAST_FILE" ]; then
    echo "Error: DKIM_REGISTRY not set and broadcast file not found at $BROADCAST_FILE"
    echo "Either set them in .env or run the deploy script first."
    exit 1
  fi
  echo "Reading deployed addresses from $BROADCAST_FILE"
  DKIM_REGISTRY="${DKIM_REGISTRY:-$(jq -r '.transactions[] | select(.contractName == "DKIMRegistry") | .contractAddress' "$BROADCAST_FILE")}"
fi

if [ -z "$DKIM_REGISTRY" ]; then
  echo "Error: Could not determine DKIM_REGISTRY address"
  exit 1
fi

RETRIES="${RETRIES:-5}"
DELAY="${DELAY:-10}"

CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" "$OWNER")

echo "=== Verifying DKIMRegistry at $DKIM_REGISTRY ==="
forge verify-contract \
  --chain-id "$CHAIN_ID" \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --watch \
  --retries "$RETRIES" \
  --delay "$DELAY" \
  --constructor-args "$CONSTRUCTOR_ARGS" \
  "$DKIM_REGISTRY" \
  src/DKIMRegistry.sol:DKIMRegistry

echo ""
echo "=== All contracts verified ==="
