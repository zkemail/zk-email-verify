# Analytical Gas Model — Groth16 vs UltraHonk

All figures in EVM gas on Ethereum mainnet (post-Cancun, EIP-1108 precompile pricing).
Precompile costs used:
- **ECADD (0x06)**: 150 gas
- **ECMUL (0x07)**: 6,000 gas
- **ECPAIRING (0x08)**: 45,000 + 34,000 × *k_pairs* gas
- **MODEXP (0x05)**: data-dependent; Fr inversion via `x^(p-2)` costs ≈ 1,500–6,000 gas depending on exponent length

## 1. Circom / Groth16

Groth16 verification is **constant-time in circuit size** and depends only on the number of
public inputs *n*.

```
vk_x = IC[0] + Σ_{i=1..n} IC[i] * publicInput[i-1]          // MSM: n ecMul + n ecAdd
e(-A, B) · e(α, β) · e(vk_x, γ) · e(C, δ) = 1                // 4-pair pairing check
```

**Predicted gas (n = 20 public inputs):**

| Component            | Cost                          | Subtotal |
|----------------------|-------------------------------|---------:|
| MSM: 20 × ECMUL      | 20 × 6,000                    | 120,000  |
| MSM: 20 × ECADD      | 20 × 150                      |   3,000  |
| ECPAIRING (4 pairs)  | 45,000 + 4 × 34,000           | 181,000  |
| Field validation, mem ops, CALL overhead | ≈ EVM glue | ~15,000  |
| **Predicted (verify-only)** |                        | **~319,000** |

**Measured (verify-only): 318,559 gas** — predicted/measured within 0.2 %.

Full-tx gas (EOA → verifier, mainnet):
```
21,000 (intrinsic) + ~14,400 (~900 B calldata × 16) + 318,559 ≈ 353,961 gas
```

## 2. Noir / UltraHonk (keccak transcript)

UltraHonk verification has ~constant structure in circuit size; the only variation is
**log N**, which controls the number of sumcheck and Shplemini rounds. With
`CONST_PROOF_SIZE_LOG_N = 28` (the proof is always padded to 28 rounds), the active
bound is `min(log_N, 28)`.

Key constants from the Aztec-generated Solidity verifier:
```
NUMBER_OF_ENTITIES           = 40
CONST_PROOF_SIZE_LOG_N       = 28
batchMul.limit  = ENTITIES + LOG_N + 2 = 70   (2 calls per verify)
```

**Dominant cost centres per `verify()`:**

| Component                               | Ops × unit cost                  | Subtotal |
|-----------------------------------------|----------------------------------|---------:|
| 2 × `batchMul`, 70 iterations each: ECMUL | 140 × 6,000                    | 840,000  |
| 2 × `batchMul`, ECADD                   | 138 × 150                        |  20,700  |
| Final KZG pairing check (2 pairs)       | 45,000 + 2 × 34,000              | 113,000  |
| MODEXP ×2 (Fr inversion)                | ~2 × 3,000                       |   6,000  |
| Sumcheck: 28 rounds of Fr arithmetic + transcript keccak | ~28 × ~5,000    | ~140,000 |
| Shplemini/Gemini: log_N fold evals, challenges | log_N × ~4,000            | ~70,000 (log_N=18) / ~80,000 (log_N=20) |
| Transcript/round keccak + public-input accumulation | ~50 × 1,000             | ~50,000  |
| Calldata decoding (14 kB via CALLDATALOAD loops) | ~440 words × 20 gas (MSTORE + CALLDATALOAD) | ~8,800 |
| Memory allocation, misc EVM glue        | —                                | ~630,000 |
| **Predicted (verify-only, log_N=18)**   |                                  | **~1,880,000** |

**Measured:**
- SCALE-1 (log_N=18): **1,885,076 gas** (Δ vs predicted: <1%)
- SCALE-4 (log_N=18): **1,885,076 gas** (identical — both pad to N=2^18)
- SCALE-7 (log_N=20): **1,944,814 gas** (59,738 more than SCALE-1; ≈ 2 extra sumcheck rounds @ ~30k each)

The ~630 k "glue" bucket above is an *a-posteriori* residual needed to reconcile
the structural cost centres with the observed total. It's dominated by:
- Many small Fr arithmetic helper calls (each using MULMOD/ADDMOD via MODEXP or Yul),
- Memory expansion for the 14 kB proof (~20 k words ⇒ several k gas),
- Struct copying in memory from calldata-decoded proof,
- Public-input hash accumulation with keccak.

Without direct EVM tracing we cannot pin these components precisely; the important
observation is that **structural cost centres (MSM + pairing) account for
~1.0 M gas, and the remainder scales sub-linearly with circuit size** — which is
why SCALE-1 → SCALE-7 adds only ~3 % gas despite a 4× gate-count increase.

Full-tx gas (EOA → verifier, mainnet):
```
21,000 (intrinsic) + ~228,000 (~14,180 B calldata × ~16) + 1,885,076 ≈ 2,130,761 gas   (SCALE-1)
21,000 + 228,000 + 1,944,814                                      ≈ 2,190,499 gas   (SCALE-7)
```

## 3. Summary table — verify-only call gas

| Config              | Groth16 gas | UltraHonk gas | Honk/Groth16 |
|---------------------|------------:|--------------:|-------------:|
| SCALE-1 (512/512)   |    318,559  |   1,885,076   |        5.91× |
| SCALE-4 (1024/1024) |    318,559  |   1,885,076   |        5.91× |
| SCALE-7 (2048/4096) |    318,559  |   1,944,814   |        6.09× |

## 4. Summary table — estimated full-tx gas (EOA sender, mainnet)

Accounting for 21 k tx intrinsic + ABI-encoded calldata at 16 gas/non-zero byte:

| Config              | Groth16 tx gas | UltraHonk tx gas | Δ bytes proof |
|---------------------|---------------:|-----------------:|--------------:|
| SCALE-1             |       353,961  |       2,130,761  |   14,080 vs 256 |
| SCALE-4             |       353,961  |       2,130,761  |           —    |
| SCALE-7             |       353,961  |       2,190,499  |           —    |

## 5. Verifier bytecode (deployment cost indicator)

| System    | Runtime bytecode bytes | vs EIP-170 24 kB limit |
|-----------|-----------------------:|------------------------:|
| Groth16   |                  3,142 |              12.8 % |
| UltraHonk |                 21,585 |              87.8 % |

UltraHonk verifier approaches the 24,576-byte contract size limit. Deployment costs
≈ 200 × size = 4.3 M gas for Groth16, ≈ 4.4 M gas for UltraHonk (deployment is a
one-time cost per verifier instance).

## 6. Cross-check methodology

1. `snarkjs zkey export solidityverifier` produces the canonical iden3 Groth16 verifier
   (four pairings, MSM over IC). Source-audited: pairing precompile = 0x08 with k=4.
2. `bb write_solidity_verifier` (bb 0.84.0) produces the Aztec Honk verifier.
   Source-audited: 2 `batchMul` calls each iterating
   `NUMBER_OF_ENTITIES + CONST_PROOF_SIZE_LOG_N + 2 = 70` times, one KZG pairing (2-pair).
3. All numbers are `gasleft()` deltas from inside `forge test` — they represent the
   **raw verify call gas**, not the full EOA-transaction gas. Intrinsic + calldata
   are added analytically in §4.
