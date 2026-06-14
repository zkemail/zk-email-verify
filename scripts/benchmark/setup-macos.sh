#!/usr/bin/env bash
# =============================================================================
# ZK Email Benchmark — macOS Dependency Setup
# =============================================================================
# This script installs ALL system-level dependencies required to reproduce
# the benchmarks for both the Circom (zk-email-verify) and Noir (zkemail.nr)
# stacks on macOS (Apple Silicon / Intel).
#
# Pinned versions (matching benchmark data 2026-02-26):
#   circom   2.1.9
#   nargo    1.0.0-beta.5
#   bb       0.84.0
#   Node.js  24  (via nvm)
#
# Repository commits:
#   zk-email-verify  bb19cc124f773a99f8600f59a7709721a91f7d34  (feat/benchmark-and-fixes)
#   zkemail.nr       e694d59eb7880423804253b7e1ec8812a5f3fd55  (chore/code-quality-improvements)
#
# Usage:
#   chmod +x setup-macos.sh && ./setup-macos.sh
#
# The script is idempotent — safe to re-run. It skips already-installed tools
# at the correct version.
# =============================================================================

set -euo pipefail

# ---- Configuration ----------------------------------------------------------
CIRCOM_VERSION="2.1.9"
NARGO_VERSION="1.0.0-beta.5"
BB_VERSION="0.84.0"
NODE_MAJOR="24"
PTAU_FILE="powersOfTau28_hez_final_22.ptau"
PTAU_URL="https://hermez.s3-eu-west-1.amazonaws.com/${PTAU_FILE}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---- 1. Homebrew ------------------------------------------------------------
if ! command -v brew &>/dev/null; then
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  info "Homebrew already installed."
fi

# ---- 2. Core CLI tools ------------------------------------------------------
for tool in git curl wget jq; do
  if ! command -v "$tool" &>/dev/null; then
    info "Installing $tool..."
    brew install "$tool"
  fi
done

# ---- 3. Rust (needed for circom) --------------------------------------------
if ! command -v rustc &>/dev/null; then
  info "Installing Rust via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
else
  info "Rust already installed ($(rustc --version))."
fi

# ---- 4. Circom compiler -----------------------------------------------------
install_circom() {
  info "Installing circom ${CIRCOM_VERSION} from source..."
  local tmpdir
  tmpdir=$(mktemp -d)
  git clone --branch "v${CIRCOM_VERSION}" --depth 1 \
    https://github.com/iden3/circom.git "$tmpdir/circom"
  cd "$tmpdir/circom"
  cargo build --release
  cargo install --path circom
  cd -
  rm -rf "$tmpdir"
}

if command -v circom &>/dev/null; then
  CURRENT_CIRCOM=$(circom --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "0.0.0")
  if [[ "$CURRENT_CIRCOM" == "$CIRCOM_VERSION" ]]; then
    info "circom ${CIRCOM_VERSION} already installed."
  else
    warn "circom ${CURRENT_CIRCOM} found, need ${CIRCOM_VERSION}."
    install_circom
  fi
else
  install_circom
fi

# ---- 5. Node.js (via nvm) ---------------------------------------------------
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -d "$NVM_DIR" ]]; then
  info "Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

if ! command -v node &>/dev/null || [[ "$(node -v | grep -oE '^v[0-9]+')" != "v${NODE_MAJOR}" ]]; then
  info "Installing Node.js ${NODE_MAJOR}..."
  nvm install "$NODE_MAJOR"
  nvm use "$NODE_MAJOR"
else
  info "Node.js $(node -v) already installed."
fi

# ---- 6. Package managers: yarn, pnpm, bun -----------------------------------
for pm in yarn pnpm bun; do
  if ! command -v "$pm" &>/dev/null; then
    info "Installing $pm..."
    case "$pm" in
      yarn)  npm install -g yarn ;;
      pnpm)  npm install -g pnpm ;;
      bun)   curl -fsSL https://bun.sh/install | bash ;;
    esac
  else
    info "$pm already installed."
  fi
done

# ---- 7. noirup + nargo (Noir compiler) --------------------------------------
install_nargo() {
  if ! command -v noirup &>/dev/null; then
    info "Installing noirup..."
    curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
    export PATH="$HOME/.nargo/bin:$PATH"
  fi
  info "Installing nargo ${NARGO_VERSION}..."
  noirup --version "$NARGO_VERSION"
}

if command -v nargo &>/dev/null; then
  CURRENT_NARGO=$(nargo --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+-[a-z]+\.[0-9]+' | head -1 || echo "0.0.0")
  if [[ "$CURRENT_NARGO" == "$NARGO_VERSION" ]]; then
    info "nargo ${NARGO_VERSION} already installed."
  else
    warn "nargo ${CURRENT_NARGO} found, need ${NARGO_VERSION}."
    install_nargo
  fi
else
  install_nargo
fi

# ---- 8. bbup + bb (Barretenberg backend) ------------------------------------
install_bb() {
  if ! command -v bbup &>/dev/null; then
    info "Installing bbup..."
    curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash
    export PATH="$HOME/.bb:$PATH"
  fi
  info "Installing bb ${BB_VERSION}..."
  bbup --version "$BB_VERSION"
}

if command -v bb &>/dev/null; then
  CURRENT_BB=$(bb --version 2>&1 | tr -d '[:space:]' | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "0.0.0")
  CURRENT_BB="${CURRENT_BB#v}"
  if [[ "$CURRENT_BB" == "$BB_VERSION" ]]; then
    info "bb ${BB_VERSION} already installed."
  else
    warn "bb ${CURRENT_BB} found, need ${BB_VERSION}."
    install_bb
  fi
else
  install_bb
fi

# ---- 9. Powers of Tau file (Circom only) ------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/${PTAU_FILE}" ]]; then
  info "ptau-22 file already present."
else
  info "Downloading ${PTAU_FILE} (~700 MB)..."
  wget -q --show-progress -O "${SCRIPT_DIR}/${PTAU_FILE}" "$PTAU_URL"
fi

# ---- 10. Summary ------------------------------------------------------------
echo ""
echo "============================================"
echo "  ZK Email Benchmark — Setup Complete"
echo "============================================"
echo ""
echo "  circom:  $(circom --version 2>&1 | head -1)"
echo "  nargo:   $(nargo --version 2>&1 | head -1)"
echo "  bb:      $(bb --version 2>&1 | head -1)"
echo "  node:    $(node -v)"
echo "  yarn:    $(yarn -v 2>/dev/null || echo 'N/A')"
echo "  pnpm:    $(pnpm -v 2>/dev/null || echo 'N/A')"
echo "  bun:     $(bun -v 2>/dev/null || echo 'N/A')"
echo "  ptau-22: ${SCRIPT_DIR}/${PTAU_FILE}"
echo ""
echo "Next steps:"
echo "  Circom: cd scripts/benchmark && pnpm install && pnpm run setup && pnpm run benchmark"
echo "  Noir:   cd scripts/benchmark && pnpm install && pnpm run benchmark:all"
echo ""
