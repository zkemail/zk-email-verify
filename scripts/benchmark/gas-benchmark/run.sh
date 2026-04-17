#!/usr/bin/env bash
# End-to-end reproduction of the on-chain gas benchmark for
#   Circom/Groth16  vs  Noir/UltraHonk (keccak transcript)
# across three input sizes (SCALE-1/4/7).
#
# Prereqs (pinned for byte-identical reproduction):
#   snarkjs 0.7.6, nargo 1.0.0-beta.5, bb (bbup) 0.84.0,
#   forge 1.5.0, node >= 20, GNU or BSD sed.
#
# Expected total runtime on Apple M4 Pro / 14c: ~2 minutes.

set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

CONFIGS=(SCALE-1 SCALE-4 SCALE-7)
ZKEY_ROOT="$HERE/../compiled"

# Portable in-place sed: works on both GNU and BSD (macOS).
sedi() { sed -i.bak "$@" && rm -f "${@: -1}.bak"; }

echo "── 1. Install node deps ──────────────────────────────────"
[ -d node_modules ] || npm install --silent

echo "── 2. Generate Groth16 verifier Solidity + fixtures ──────"
for cfg in "${CONFIGS[@]}"; do
    s="${cfg#SCALE-}"
    zkey="$ZKEY_ROOT/$cfg/benchmark_${cfg}_0000.zkey"
    if [ ! -f "$zkey" ]; then
        echo "  !! missing $zkey — run the main benchmark pipeline first (pnpm run setup && pnpm run benchmark)"
        exit 1
    fi
    out="src/verifiers/Groth16Verifier${cfg/-/}.sol"
    snarkjs zkey export solidityverifier "$zkey" "$out" > /dev/null
    sedi "s/contract Groth16Verifier {/contract Groth16VerifierSCALE${s} {/" "$out"
    echo "  ✓ $out"
done
node script/prepareGroth16Fixtures.mjs

echo "── 3. Compile Noir circuits (parallel) ───────────────────"
for cfg in "${CONFIGS[@]}"; do
    ( cd "noir/$cfg" && nargo compile 2>&1 | tail -n 1 ) &
done
wait

echo "── 4. Generate witnesses (JS harness) ────────────────────"
npx ts-node --transpile-only script/generateNoirWitnesses.ts

echo "── 5. Prove + Solidity verifier (UltraHonk, parallel) ────"
build_and_prove() {
    local cfg="$1" s="${1#SCALE-}"
    local circuit="gas_bench_scale${s}"
    cd "noir/$cfg"
    # Clear any stale target/vk directory — bb prove --write_vk writes vk as a file.
    [ -d target/vk ] && rm -rf target/vk || true
    # --write_vk emits the VK as a side-effect, avoiding a second walk of the circuit.
    bb prove -s ultra_honk --oracle_hash keccak --write_vk \
        -b "target/${circuit}.json" -w "target/${circuit}.gz" -o target/ >/dev/null
    bb write_solidity_verifier -s ultra_honk -k target/vk -o target/HonkVerifier.sol >/dev/null
    cp target/HonkVerifier.sol "$HERE/src/verifiers/HonkVerifier${cfg/-/}.sol"
    sedi "s/^contract HonkVerifier /contract HonkVerifierSCALE${s} /" \
        "$HERE/src/verifiers/HonkVerifier${cfg/-/}.sol"
    cp target/proof         "$HERE/fixtures/honk/${cfg}.proof.bin"
    cp target/public_inputs "$HERE/fixtures/honk/${cfg}.public_inputs.bin"
    cd "$HERE"
    echo "  ✓ $cfg"
}
export -f build_and_prove sedi
export HERE
for cfg in "${CONFIGS[@]}"; do
    build_and_prove "$cfg" &
done
wait

echo "── 6. forge build ────────────────────────────────────────"
forge build 2>&1 | tail -n 2

echo "── 7. Run gas tests ──────────────────────────────────────"
forge test --match-contract 'GasBench(Groth16|Honk)' -vv 2>&1 | tee results/forge-log.txt

echo
echo "── 8. Summary ────────────────────────────────────────────"
echo "  Raw gas log:      results/forge-log.txt"
echo "  JSON results:     results/{groth16,honk}-gas.json"
echo "  Analytical model: results/analytical-model.md"
