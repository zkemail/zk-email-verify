# Draft addendum for the paper — §6.4 "On-Chain Verification Cost"

The following text is intended to be inserted after the existing §6.4
"Verification and Communication Complexity" subsection (around line 1218 of
the current draft), and extends it with concrete Ethereum-mainnet gas numbers
to address reviewer feedback about deployment feasibility.

---

## 6.4.x On-Chain Verification Cost

Off-chain verifier runtime (§6.4) does not capture the economics of deploying
the system on a public blockchain, where both the proof payload and the
verifier computation are settled in gas. We therefore extend the evaluation
with an on-chain benchmark that measures the Ethereum-mainnet gas cost of
`verify()`/`verifyProof()` for each system across three representative input
capacities.

**Methodology.**  For each of SCALE-1 (512 / 512 bytes),
SCALE-4 (1,024 / 1,024 bytes) and SCALE-7 (2,048 / 4,096 bytes):
(i) we export a Solidity verifier — `snarkjs zkey export solidityverifier` for
Circom/Groth16 and `bb write_solidity_verifier -s ultra_honk` (with the
`--oracle_hash keccak` transcript variant required for EVM verification) for
Noir/UltraHonk; (ii) we generate a valid proof using the same pipeline as in
§6.2–6.3; (iii) we deploy the verifier to a local Foundry instance (`forge
1.5.0`, `solc 0.8.28`, Cancun EVM) and invoke `verify` with the generated
proof and public inputs; and (iv) we record the gas consumed, measured as the
`gasleft()` delta bracketing the call. The measurement reports the *verifier
execution cost*; it excludes the 21,000-gas transaction intrinsic and the
outer-transaction calldata cost, which we add analytically.

**Results.**  Table X reports the measured verifier gas and deployed-bytecode
size for all six configurations.  Groth16 verification gas is constant at
**318,559 gas** across all three circuit sizes, because Groth16 verification
depends only on the number of public inputs (20 here, identical across SCALE
configs) — a mathematical consequence of its 4-pairing + *n*-scalar-MSM
structure.  UltraHonk verification is also near-constant in input size:
SCALE-1 and SCALE-4 consume **1,885,076 gas** (identical, because both
circuits are padded by Barretenberg to N = 2¹⁸), while SCALE-7 consumes
**1,944,814 gas**, the ~60 k increase being attributable to two additional
sumcheck rounds that `log_2(N)` = 20 unlocks.

Including the 21 k intrinsic and 16-gas-per-non-zero calldata byte, the total
end-user transaction cost on Ethereum L1 is approximately **354 k gas for
Groth16** (any SCALE) and **2.13 M – 2.19 M gas for UltraHonk**. UltraHonk is
**~6×** more expensive than Groth16 per on-chain verification, and its proof
payload is **17.5×** larger (14,080 B vs 805 B). The UltraHonk verifier
itself is **6.9×** larger in deployed bytecode (21,585 B vs 3,142 B, the
former approaching the EIP-170 24,576-byte contract-size limit).

**Table X — On-chain verifier cost on Ethereum (cancun EVM)**

| Config    | Header / Body | System     | Proof (B) | Public inputs | Verify gas | ΔGas vs Groth16 | Verifier bytecode (B) |
|-----------|---------------|------------|----------:|--------------:|-----------:|----------------:|----------------------:|
| SCALE-1   | 512 / 512     | Groth16    |       805 |            20 |    318,559 |             1×  |                 3,142 |
|           |               | UltraHonk  |    14,080 |             3 |  1,885,076 |          5.91×  |                21,585 |
| SCALE-4   | 1,024 / 1,024 | Groth16    |       805 |            20 |    318,559 |             1×  |                 3,141 |
|           |               | UltraHonk  |    14,080 |             3 |  1,885,076 |          5.91×  |                21,585 |
| SCALE-7   | 2,048 / 4,096 | Groth16    |       805 |            20 |    318,559 |             1×  |                 3,141 |
|           |               | UltraHonk  |    14,080 |             3 |  1,944,814 |          6.09×  |                21,585 |

Numbers measured via `forge test` with `gasleft()` bracketing the `verify`
call; excludes 21 k tx intrinsic and outer calldata.

**Analytical cross-check.**  For Groth16, the four-pairing + 20-MSM structure
predicts `20 × 6,000 + 20 × 150 + (45,000 + 4 × 34,000) + ~15 k ≈ 319 k` gas,
matching the measured 318,559 within 0.2 %. For UltraHonk, the dominant cost
centres (two `batchMul` MSMs of 70 iterations each, one 2-pair KZG pairing,
two MODEXP Fr inversions) account for **~980 k gas**; the remaining ~900 k
gas is absorbed by sumcheck Fr arithmetic over 28 rounds, Gemini/Shplemini
opening, transcript keccak hashing, and memory management of the 14 kB proof.
Full derivation in Appendix H.

**Interpretation.**  For applications where the
(*gas cost × verifications-per-day*) dominates — e.g. on-chain identity bridges
or token airdrops — Groth16 remains the economically preferred backend, at
the cost of the standard ptau trusted-setup ceremony and the ~4.19 M-constraint
ceiling imposed by ptau-22. UltraHonk is viable when either the circuit
exceeds that ceiling (which SCALE-7 approaches at 3.53 M Circom R1CS
constraints; see Table 4), or when the operational overhead of per-circuit
Groth16 key ceremonies is undesirable. The latter is increasingly relevant
for deployments that require frequent circuit upgrades (e.g. when the regex
configuration or the SHA256 precomputation offset changes).

**Reproducibility.**  The complete reproduction harness — exported Solidity
verifiers, Noir circuit variants for the three SCALE configs, proof/public-input
fixtures, Foundry test suite, and a one-shot `run.sh` — is released alongside
this paper under `scripts/benchmark/gas-benchmark/`. Target tool versions:
`snarkjs 0.7.6`, `nargo 1.0.0-beta.5`, `bb 0.84.0`, `forge 1.5.0`, `solc 0.8.28`.
Expected end-to-end runtime on commodity hardware: ~3 minutes.
