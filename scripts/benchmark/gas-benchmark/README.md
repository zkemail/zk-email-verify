# Gas Benchmark — On-Chain Verification Cost for ZK-Email Proofs

Measures Ethereum-mainnet gas for verifying ZK-email proofs on chain, comparing
**Circom/Groth16** (BN254) against **Noir/UltraHonk** (keccak transcript) across three
circuit sizes that match the main paper's benchmark matrix.

This package is **self-contained** and reproducible by reviewers.

---

## Headline numbers

All gas is measured at the EVM level via `forge test` on a local Anvil-equivalent
execution environment. Only the `verify`/`verifyProof` call gas is reported
(intrinsic `21,000` and outer-tx calldata are added analytically — see
`results/analytical-model.md`).

| Config (header/body bytes) | System     | Proof size | Verify gas | Verifier bytecode |
|----------------------------|------------|-----------:|-----------:|------------------:|
| **SCALE-1** (512 / 512)    | Groth16    |      805 B |    318,559 |            3,142 |
|                            | UltraHonk  |   14,080 B |  1,885,076 |           21,585 |
| **SCALE-4** (1024 / 1024)  | Groth16    |      805 B |    318,559 |            3,141 |
|                            | UltraHonk  |   14,080 B |  1,885,076 |           21,585 |
| **SCALE-7** (2048 / 4096)  | Groth16    |      805 B |    318,559 |            3,141 |
|                            | UltraHonk  |   14,080 B |  1,944,814 |           21,585 |

- Groth16 gas is **independent of circuit size** (depends only on *n* = 20 public
  inputs).
- UltraHonk gas is **near-constant**: SCALE-1 and SCALE-4 both pad to N = 2¹⁸;
  SCALE-7 pads to N = 2²⁰, adding ~60 k gas for the two extra sumcheck rounds.

## Key trade-off

UltraHonk verify gas is **~5.9–6.1× more expensive** than Groth16; proof size is
**17.5×** larger (14,080 B vs 805 B). In return UltraHonk avoids the Groth16
trusted-setup ceremony entirely and removes the ptau-22 (~4.19 M-constraint)
compile ceiling. For on-chain applications where `gas × proofs/day` dominates,
Groth16 remains the economic choice; for anything beyond the ptau-22 ceiling,
UltraHonk is the only option.

---

## Prerequisites

| Tool        | Pinned version | Install                                                            |
|-------------|----------------|---------------------------------------------------------------------|
| `snarkjs`   | 0.7.6          | `npm i -g snarkjs@0.7.6`                                           |
| `nargo`     | 1.0.0-beta.5   | `curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install \| bash && noirup -v 1.0.0-beta.5` |
| `bb` (Barretenberg) | 0.84.0 | `curl -L bbup.dev \| bash && bbup -v 0.84.0`                        |
| `forge` (Foundry)   | 1.5.0  | `curl -L https://foundry.paradigm.xyz \| bash && foundryup`         |
| Node.js     | ≥ 20           | via `nvm install 20`                                               |

The benchmark also requires that the main Circom benchmark pipeline
(`scripts/benchmark/`) has been run first to produce the SCALE-1/4/7 zkey files
in `scripts/benchmark/compiled/SCALE-*/`.

## One-shot reproduction

```bash
cd scripts/benchmark/gas-benchmark
./run.sh
```

The script will:
1. Install node deps (`@aztec/bb.js` 0.84.0, `@noir-lang/noir_js` 1.0.0-beta.5,
   `@zk-email/zkemail-nr` (from `../../../../zkemail.nr/js`)).
2. Export the **Groth16** Solidity verifier from each zkey via `snarkjs`, and
   write Foundry-readable JSON fixtures from the existing `proof.json` +
   `public.json`.
3. Compile the three **Noir** projects (`noir/SCALE-1`, `noir/SCALE-4`,
   `noir/SCALE-7`). Each is a thin variant of
   `zkemail.nr/examples/verify_email_2048_bit_dkim` with MAX_HEADER / MAX_BODY
   set to match the paper's SCALE configs.
4. Generate a witness for each Noir circuit using `generateEmailVerifierInputs`
   from the `zk-email/zkemail-nr` JS helpers and the test email
   `zkemail.nr/js/tests/test-data/email-good.eml`.
5. Run `bb prove -s ultra_honk --oracle_hash keccak --write_vk` (VK is emitted
   as a side effect of proving) and `bb write_solidity_verifier` to produce one
   Solidity verifier per config. Steps 3 and 5 run the three configs in parallel.
   **Note:** the `keccak` transcript is required for on-chain verifiability,
   which differs from the paper's off-chain benchmarks that used poseidon2.
6. Build the Foundry project (`forge build`) and run the gas tests
   (`forge test --match-contract 'GasBench(Groth16|Honk)'`).

Expected runtime on an Apple M4 Pro (14 cores, 48 GB): ~2 minutes.

## Directory layout

```
gas-benchmark/
├─ README.md                   ← this file
├─ run.sh                      ← end-to-end reproduction
├─ foundry.toml                ← solc 0.8.28, cancun EVM
├─ src/verifiers/              ← generated Solidity verifiers
│   ├─ Groth16VerifierSCALE{1,4,7}.sol
│   └─ HonkVerifierSCALE{1,4,7}.sol
├─ test/
│   ├─ GasBenchGroth16.t.sol   ← deploy + verify + gasleft() delta
│   └─ GasBenchHonk.t.sol      ← same for UltraHonk
├─ noir/{SCALE-1,SCALE-4,SCALE-7}/
│   ├─ Nargo.toml              ← depends on ../../../../../../zkemail.nr/lib
│   └─ src/main.nr             ← parameterized 2048-bit DKIM verifier
├─ fixtures/
│   ├─ groth16/SCALE-*.json    ← {pA,pB,pC,pubSignals}
│   └─ honk/SCALE-*.{proof,public_inputs}.bin
├─ script/
│   ├─ prepareGroth16Fixtures.mjs
│   └─ generateNoirWitnesses.ts
└─ results/
    ├─ groth16-gas.json
    ├─ honk-gas.json
    ├─ analytical-model.md      ← predicted vs measured
    └─ forge-log.txt            ← raw forge output
```

## Interpreting the measurement

`forge test` reports the gas consumed by the EVM execution of the `verify` call
**as measured from inside a test contract** — i.e. `gasleft()` immediately before
vs. immediately after the call. This measurement:

- **Includes** the external CALL overhead, all opcodes executed inside the
  verifier, all precompile costs (ECADD, ECMUL, ECPAIRING, MODEXP), and all
  memory expansion.
- **Excludes** the 21,000-gas transaction intrinsic and the gas paid by the EOA
  for encoding calldata (16 gas/nonzero byte, 4 gas/zero byte).

For a full end-user-transaction figure, add the intrinsic and calldata cost
yourself. `results/analytical-model.md` §4 does this.

## Why a single sample email across all configs?

The paper's §6.1 benchmark harness uses 15 regex-matching emails per config
(synthetic & real-world). For this **on-chain** benchmark we instead use a single
DKIM-signed sample (`email-good.eml`) padded to each SCALE's header/body bound,
because:

- The Groth16 verifier gas is a function of the *verification key* and the *number
  of public inputs* — NOT the input content. Any satisfying proof costs the same
  number of gas. SCALE-1/4/7 all expose the same 20 public inputs.
- The UltraHonk verifier gas is a function of the *circuit size* (padded to next
  power of 2) and the *number of public inputs* (3 here) — again independent of
  the input content.

Varying the input would produce identical gas numbers.

## Versions used for the headline numbers

```
snarkjs 0.7.6        nargo 1.0.0-beta.5        bb 0.84.0
forge 1.5.0-stable   solc 0.8.28               EVM target: cancun
```

Host: Apple M4 Pro (14-core), macOS Darwin 25.3.0, 48 GB unified memory.
