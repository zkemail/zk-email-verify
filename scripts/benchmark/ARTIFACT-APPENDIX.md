# Artifact Appendix

Paper title: **Zero-Knowledge Proofs of Generalized Regular Expression Matching for Anonymized Email Verification**

Requested Badge(s):
  - [x] **Available**
  - [x] **Functional**
  - [x] **Reproduced**

## Description

This artifact accompanies the paper *"Zero-Knowledge Proofs of Generalized
Regular Expression Matching for Anonymized Email Verification"* (PoPETs 2026).

The artifact is the **benchmark suite** used to produce the paper's evaluation
section (Experimental Results and On-Chain Verification Cost). It measures the
cost of proving DKIM-signed email verification in zero knowledge across two
proving stacks — **Circom/Groth16** (BN254) and **Noir/UltraHonk** — along five
dimensions:

1. **Circuit-size scaling** — how the number of R1CS constraints (Circom) and
   UltraHonk gates (Noir) grows with the header/body byte budget.
2. **Feature-flag overhead** — the cost of header masking, body masking, and
   skipping the body-hash check.
3. **RSA key size** — RSA-1024 vs RSA-2048 DKIM signature verification.
4. **SHA-256 precomputation** — constraint/gate savings when part of the body
   hash is computed outside the circuit.
5. **Proving / witness / compile / verification time, peak memory, proof size,
   and on-chain (Ethereum) verifier gas.**

Running the suite regenerates the machine-readable data (`.csv` / `.json`) and
the human-readable summaries (`.md`) that back the figures and tables in the
paper's evaluation section. The on-chain gas sub-benchmark
(`gas-benchmark/`) additionally produces the Ethereum verifier-cost table.

### Security/Privacy Issues and Ethical Concerns

This artifact poses **no security or privacy risk** to the evaluator's machine.
It does not disable any security mechanism (firewall, ASLR, etc.), and it does
not run exploits, malware, or otherwise vulnerable code.

- All cryptographic key material is **generated locally and synthetically**: the
  setup step creates throwaway RSA DKIM key pairs and signs a set of **synthetic
  test emails** with them. No real user emails, real DKIM private keys, or
  personal data are used or required.
- The setup downloads a **public Powers-of-Tau file** (`powersOfTau28_hez_final_22.ptau`,
  ~4.8 GB) from the public Hermez ceremony S3 bucket. This is a well-known,
  publicly audited trusted-setup transcript.
- There are **no human subjects**, so no IRB / ethical-review process applies.

## Basic Requirements

### Hardware Requirements

**Minimal requirements (to run the artifact):**

- A 64-bit x86-64 or arm64 (Apple Silicon) machine. No special hardware
  (GPU, SGX, FPGA, etc.) is required.
- **RAM: ≥ 32 GB recommended.** Groth16 proving of the largest Circom circuit
  (SCALE-7, ~3.53 M constraints) consumes **~29 GB peak resident memory**. On a
  machine with ≤ 16 GB RAM the largest scaling configs (SCALE-6/7,
  SCALE-HEADER-HEAVY) will swap heavily or fail; the smaller configs and the
  full Noir suite run comfortably in 16 GB. *(This is the "High RAM (> 16 GB)"
  topic.)*
- **Free disk: ~30 GB.** See *Estimated Time and Storage Consumption* for the
  per-stack breakdown. *(This is the "High storage (> 10 GB)" topic.)*

A machine meeting these requirements can be a commodity laptop/workstation, or a
rented cloud VM. The full Circom scaling sweep is the only part that needs the
high memory; reviewers without a 32 GB machine can reproduce the trends from the
smaller configs plus the full Noir and gas benchmarks.

**Hardware used for the results reported in the paper (for the Reproduced badge):**

| Component | Specification |
|-----------|--------------|
| CPU | Apple M4 Pro |
| Cores | 14 (10 performance + 4 efficiency) |
| Memory | 48 GB unified |
| OS | macOS (Darwin 25.3.0) |
| Architecture | arm64 (Apple Silicon) |

Absolute wall-clock timings depend on this hardware; the **trends and
cross-system ratios** reported in the paper (e.g. "Noir proves 3.5–5.1× faster
than Circom") are hardware-independent and reproduce on other machines.

### Software Requirements

**Operating system.** The automated installer (`setup-macos.sh`) targets
**macOS** (it uses Homebrew and Darwin conventions). The benchmark code itself is
portable; on **Linux** all tools install the same way (`cargo install`,
`noirup`, `bbup`, `nvm`) — only the package-manager bootstrap and the peak-memory
probe differ (`/usr/bin/time -l` on macOS vs `/usr/bin/time -v` on Linux; see
*Limitations*).

**Toolchain (pinned versions).** All versions are pinned in `setup-macos.sh` and
in each project's `config/benchmark.config.ts`:

| Tool | Version | Used by |
|------|---------|---------|
| circom | 2.1.9 | Circom circuit compilation |
| snarkjs | 0.7.6 | Groth16 setup/prove/verify, Solidity verifier export |
| nargo (Noir) | 1.0.0-beta.5 | Noir circuit compilation |
| bb (Barretenberg) | 0.84.0 | UltraHonk prove/verify, Solidity verifier export |
| forge / solc (Foundry) | forge 1.5.0, solc 0.8.28 (Cancun EVM) | on-chain gas benchmark |
| Node.js | 24.x | both benchmark harnesses (run via `tsx`) |
| Package managers | yarn 3.2.3, pnpm (latest), bun (latest) | dependency install |

**Container runtime.** None required. The artifact runs natively via the version
managers above.

**Language dependencies.** JavaScript/TypeScript dependencies are pinned in:
`scripts/benchmark/package.json` (Circom harness), the Noir harness
`scripts/benchmark/package.json` in `zkemail.nr`, and
`scripts/benchmark/gas-benchmark/package.json` (gas harness). Noir circuit deps
are pinned in each `Nargo.toml`; Solidity/EVM settings in
`gas-benchmark/foundry.toml`.

**Datasets.** No external dataset is required. The setup step generates a
**synthetic dataset** of DKIM-signed test emails (the expected `.eml` format) on
the fly. The only large download is the public **Powers-of-Tau** transcript
`powersOfTau28_hez_final_22.ptau` (~4.8 GB), fetched automatically by
`setup-macos.sh`; it supports Circom circuits up to 2²² = 4,194,304 constraints.
No machine-learning models are involved.

### Estimated Time and Storage Consumption

| Experiment | Human time | Compute time | Disk |
|------------|-----------|--------------|------|
| Setup (deps + ptau download + keys/emails) | ~10 min | ~15–30 min (mostly the 4.8 GB ptau download) | ~5 GB (ptau) |
| Exp. 1 — Circom suite (19 configs) | ~5 min | ~2–3 hours | ~20 GB (compiled circuits + zkeys; ptau counted above) |
| Exp. 2 — Noir suite (18 configs) | ~5 min | ~30–45 min | ~5 GB |
| Exp. 3 — On-chain gas (7 configs × 2 systems) | ~2 min | ~3 min | ~1 GB |

The Groth16 trusted-setup (`.zkey` generation) dominates Circom compute time for
the large circuits. **Overall: ~25 human-minutes and ~3–4 compute-hours for a
complete reproduction; ~30 GB peak disk.**

## Environment

### Accessibility

The artifact is hosted on GitHub across two repositories:

- **Circom stack + gas benchmark + this appendix:**
  `https://github.com/zkemail/zk-email-verify` — branch `feat/benchmark-and-fixes`
- **Noir stack:**
  `https://github.com/zkemail/zkemail.nr` — branch `chore/code-quality-improvements`

We link to the branches (not a frozen commit) because the artifact may change
during evaluation to address reviewer feedback. A stable commit-id / tag will be
provided to the chairs at finalization. The exact commits that produced the
*paper's* numbers are recorded in *Limitations* for provenance.

### Set up the environment

```bash
# 1. Clone both repositories
git clone https://github.com/zkemail/zk-email-verify.git
git clone https://github.com/zkemail/zkemail.nr.git

# 2. Select the benchmark branches
( cd zk-email-verify && git checkout feat/benchmark-and-fixes )
( cd zkemail.nr     && git checkout chore/code-quality-improvements )

# 3. Install ALL system-level dependencies (macOS).
#    Installs (in order): Homebrew tools; Rust; circom 2.1.9; Node 24 (nvm);
#    yarn/pnpm/bun; nargo 1.0.0-beta.5 (noirup); bb 0.84.0 (bbup);
#    and downloads powersOfTau28_hez_final_22.ptau (~4.8 GB) if absent.
cd zk-email-verify/scripts/benchmark
chmod +x setup-macos.sh
./setup-macos.sh
```

After `setup-macos.sh` completes, `circom`, `snarkjs`, `nargo`, `bb`, `node`,
`pnpm`, `yarn`, and `bun` are on `$PATH` at the pinned versions. On Linux,
install the same tools manually with `cargo install`, `noirup -v 1.0.0-beta.5`,
`bbup -v 0.84.0`, and `nvm install 24`, then download the ptau file into
`zk-email-verify/scripts/benchmark/`.

The on-chain gas benchmark additionally needs Foundry (`forge` 1.5.0):

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

> **Foundry PATH note.** If `which forge` resolves to `~/.cargo/bin/forge`,
> that is an unrelated crates.io package. Foundry's `forge` lives at
> `~/.foundry/bin/forge`; ensure it precedes `~/.cargo/bin` on `$PATH` (or
> invoke the full path).

### Testing the Environment

A fast (~1–2 minute) smoke test confirms the toolchain works without running the
full suite. It compiles the circuits and counts constraints/gates, skipping the
expensive proving phase.

```bash
# Circom: generate inputs/circuits, then compile-only (no proving)
cd zk-email-verify/scripts/benchmark
pnpm install
pnpm run setup
pnpm run benchmark:compile-only
```

Expected: each config prints a constraint and wire count, e.g.
`SCALE-2 … constraints: 750853, wires: 744044`, and a CSV is written under
`results/`. If circom, snarkjs, and Node are correctly installed, this completes
with no errors.

```bash
# Noir: compile circuits and count gates only
cd zkemail.nr/scripts/benchmark
pnpm install
pnpm run benchmark:gates
```

Expected: `nargo compile` + `bb gates` print a gate count per config (e.g.
`SCALE-1 … 150767 gates`).

## Artifact Evaluation

### Main Results and Claims

The paper's evaluation reports the following results, all reproducible with this
artifact. Independent variables (x-axis) are the circuit's input-size budget
(header+body bytes) or feature configuration; dependent variables (y-axis) are
constraints/gates, time, memory, proof size, and on-chain gas. The *italicized
identifiers* below (e.g. *bench-circom-scaling*) are the figure/table labels in
the paper's evaluation section; reviewers can locate each one by matching its
caption to the description given here.

#### Main Result 1: Circuit size scales linearly with input size

For both stacks, Circom R1CS constraints and Noir UltraHonk gate counts grow
**linearly** with the total header+body byte budget. Supported by
Fig. *bench-circom-scaling*, Fig. *bench-noir-scaling*,
Fig. *bench-normalized-overlay*, and Table *bench-scaling-raw*. Reproduced by
[Experiment 1](#experiment-1-circom-benchmark-suite) (Circom) and
[Experiment 2](#experiment-2-noir-benchmark-suite) (Noir).

#### Main Result 2: Feature-flag overhead is small and additive

Header masking and body masking each add a small, roughly constant constraint
overhead over the base circuit; skipping the body-hash check (`ignoreBodyHashCheck`)
is the only feature with a large (savings) effect. The masking overheads are
**additive** (FEAT-FULL ≈ FEAT-HMASK + FEAT-BMASK deltas). Supported by
Fig. *bench-circom-features*, Fig. *bench-noir-features*,
Fig. *bench-feature-comparison*, Table *bench-feature-proving*, and
Table *bench-circom-additive*. Reproduced by Experiments 1 and 2
(`--features`).

#### Main Result 3: RSA-2048 costs ~10% more than RSA-1024

Doubling the RSA modulus from 1024 to 2048 bits increases circuit size by
roughly 10%. Supported by Table *bench-rsa* and Fig. *bench-rsa* (Noir, which
supports both key sizes). Reproduced by [Experiment 2](#experiment-2-noir-benchmark-suite)
(`RSA-1024`, `RSA-2048` configs). *(Circom's email verifier requires
`n·k > 2048`, so the Circom side measures RSA-2048 only.)*

#### Main Result 4: SHA-256 precomputation reduces circuit size ~linearly

Pre-hashing a prefix of the body outside the circuit (25% / 50% / 75%) reduces
constraints/gates approximately in proportion to the bytes removed from the
in-circuit hash. Supported by Fig. *bench-noir-precompute* (gates + proving),
Table *bench-circom-precompute*, and Fig. *bench-circom-precompute-bar*.
Reproduced by Experiments 1 and 2 (`PRECOMP-25/50/75`).

#### Main Result 5: Noir proves, generates witnesses, and compiles faster than Circom

At matching input sizes, Noir/UltraHonk proves **3.5–5.1× faster**, generates
witnesses **4.6–7.0× faster**, and compiles **8.8–19.1× faster** than
Circom/Groth16. Supported by Fig. *bench-head-to-head-proving*,
Fig. *bench-head-to-head-witgen*, Fig. *bench-compile-comparison*,
Fig. *bench-speedup-ratio*, Fig. *bench-pipeline-stacked*, and
Table *bench-cross-system*. Reproduced by running Experiments 1 and 2 and
comparing the two CSVs at matching configs.

#### Main Result 6: Groth16 has a tiny constant proof; UltraHonk's proof is far larger

Groth16 proofs are a constant ~805 B with fast, near-constant off-chain
verification; UltraHonk proofs are ~14 KB (≈17.5× larger). Supported by
Table *bench-proof-comparison*, Table *bench-tradeoff-summary*,
Table *bench-circom-verify*, and Fig. *bench-noir-verify-scaling*. Reproduced by
the `proofSize` / `verificationTimeMs_median` columns of Experiments 1 and 2.

#### Main Result 7: On-chain (Ethereum) verifier gas — Groth16 constant, UltraHonk a log-N step function

Groth16 on-chain verification gas is **constant at 318,559** across all seven
SCALE configs (it depends only on the 20 public inputs). UltraHonk verification
gas is a **step function of `log₂(N)`** (the power-of-two padding of the
circuit): **1,885,076** gas at 2¹⁸ (SCALE-1…4), **1,914,944** at 2¹⁹
(SCALE-5/6), **1,944,814** at 2²⁰ (SCALE-7) — roughly **+29,869 gas per
sumcheck round**, ≈ **5.9–6.1× Groth16**. The UltraHonk verifier bytecode
(~21.6 KB) approaches the EIP-170 24,576-byte limit. Supported by
Table *bench-gas* and Fig. *bench-gas*. Reproduced by
[Experiment 3](#experiment-3-on-chain-gas-benchmark).

### Experiments

#### Experiment 1: Circom benchmark suite

- **Time:** ~5 human-minutes + ~2–3 compute-hours.
- **Storage:** ~20 GB (compiled circuits, `.zkey` files; the ~4.8 GB ptau is
  counted under setup).
- **Supports:** Main Results 1, 2, 4 (Circom side), 5, 6 (Circom side).

```bash
cd zk-email-verify
yarn install                       # root workspace deps
cd scripts/benchmark && pnpm install

pnpm run setup                     # one-time: DKIM keys, signed emails,
                                   #           .circom files, JSON inputs
pnpm run benchmark                 # compile + Groth16 setup/prove/verify, all configs

# --- or individual categories ---
pnpm run benchmark:scaling         # Main Result 1
pnpm run benchmark:features        # Main Result 2
pnpm run benchmark:rsa             # RSA-2048 (Main Result 3, Circom side)
pnpm run benchmark:compile-only    # constraint counts only (no proving)
```

Each config runs **3 measured iterations + 1 discarded warmup**; the harness
reports the **median**. The measurements are highly stable — all configs show a
coefficient of variation **CV ≤ 1.1%** across the 3 runs (Table
*bench-circom-variance* in the paper appendix), so a reviewer's single rerun
should land well within that band. Close other applications while benchmarking to
keep memory and timing measurements clean. Results are written under
`scripts/benchmark/results/`:

- `results/raw/benchmark_<timestamp>.json` — every individual run (all iterations).
- `results/csv/benchmark_<timestamp>.csv` — one row per config, medians.
- `results/summary_<timestamp>.md` — human-readable Markdown summary.

**CSV column dictionary** (`results/csv/benchmark_<timestamp>.csv`). One row per
circuit configuration; this is the data behind the Circom figures/tables:

| Column | Meaning | Paper use |
|--------|---------|-----------|
| `configId` | Config name, e.g. `SCALE-4`, `FEAT-HMASK`, `PRECOMP-25` | row key |
| `category` | `scaling` / `features` / `rsa` / `precompute` | groups by experiment |
| `maxHeaders`, `maxBody` | Header / body byte budget (independent variable) | x-axis of scaling plots |
| `rsaBits` | Effective RSA modulus bits (n·k) | RSA comparison |
| `constraints`, `wires` | R1CS constraint / wire count (dependent variable) | Fig. *bench-circom-scaling*, Table *bench-scaling-raw* |
| `compileTimeMs` | circom compile time (ms) | Fig. *bench-compile-comparison* |
| `witnessGenTimeMs_median`, `witnessComputeTimeMs_median` | Witness generation time (ms), median | Fig. *bench-head-to-head-witgen* |
| `provingTimeMs_median` | Groth16 proving time (ms), median | Fig. *bench-prove-vs-size*, Table *bench-feature-proving* |
| `provingMemoryMb_median` | Peak proving RSS (MB), median | Table *bench-circom-memory* |
| `verificationTimeMs_median` | Groth16 verify time (ms), median | Table *bench-circom-verify* |
| `proofSize` | Groth16 proof size (bytes, ~805) | Table *bench-proof-comparison* |
| `numRuns`, `successRate` | Measured iterations; fraction succeeding (sanity) | data-quality check |

To compare with the paper, match `configId`/`maxHeaders`/`maxBody` to the
corresponding figure or table column. Absolute times are hardware-dependent;
constraint/wire counts and ratios are deterministic and should match exactly.

#### Experiment 2: Noir benchmark suite

- **Time:** ~5 human-minutes + ~30–45 compute-minutes.
- **Storage:** ~5 GB.
- **Supports:** Main Results 1, 3, 4 (Noir side), 5, 6 (Noir side).

```bash
cd zkemail.nr/scripts/benchmark
pnpm install

pnpm run benchmark:all             # setup + gate-count + inputs + prove + report

# --- or step-by-step ---
pnpm run setup                     # keys, emails, generated Noir circuits
pnpm run gate-count                # nargo compile + bb gates
pnpm run generate-inputs           # prover inputs
pnpm run benchmark:prove           # UltraHonk prove + verify (3 runs, median)
pnpm run report                    # write CSV / JSON
```

Noir proving runs **in-process** via `@aztec/bb.js` (WASM); gate-counting calls
`nargo compile` and `bb gates` as subprocesses. No trusted setup or ptau file is
needed (UltraHonk is a universal SNARK). Outputs land in
`zkemail.nr/scripts/benchmark/results/raw/benchmark_<timestamp>.json` and
`.../results/csv/benchmark_<timestamp>.csv`.

The Noir CSV header is:

```
configId,category,template,maxHeaders,maxBody,rsaBits,backendGates,acirOpcodes,
compileTimeMs,backend,witnessGenTimeMs_median,provingTimeMs_median,
provingMemoryMb_median,verificationTimeMs_median,proofSize,numRuns,successRate
```

It is the analogue of the Circom CSV (Experiment 1) with these differences:
`backendGates` (the UltraHonk gate count, the dependent variable behind
Fig. *bench-noir-scaling* / Table *bench-scaling-raw*) and `acirOpcodes` replace
Circom's `constraints`/`wires`; `template` names the Noir circuit variant
(`verify_email`, `partial_hash`, …) and `backend` is `honk`. There is no
`witnessComputeTimeMs_median` column (Noir reports a single witness-gen time).
`proofSize` is ~14,080 B (vs Circom's ~805 B). To verify Main Result 5, line up
matching `configId`s between the Circom and Noir CSVs and take the time ratios.

#### Experiment 3: On-chain gas benchmark

- **Time:** ~2 human-minutes + ~3 compute-minutes.
- **Storage:** ~1 GB.
- **Supports:** Main Result 7.

**Prerequisite:** Experiment 1's Circom pipeline must have produced the per-SCALE
zkeys under `scripts/benchmark/compiled/SCALE-*/` (used to export the Groth16
Solidity verifiers and proof fixtures).

```bash
cd zk-email-verify/scripts/benchmark/gas-benchmark
./run.sh
```

`run.sh` exports a Groth16 Solidity verifier from each zkey (snarkjs); compiles
the seven Noir SCALE circuits and proves each with
`bb prove -s ultra_honk --oracle_hash keccak` (the keccak transcript required for
on-chain verification); writes one Solidity verifier per config; then runs
`forge test` to measure the `verify`/`verifyProof` gas as a `gasleft()` delta.
Outputs:

- `results/groth16-gas.json` — per-config `verifyProof_gas` (318,559 constant)
  and verifier bytecode size.
- `results/honk-gas.json` — per-config `verify_gas`, `gate_count`, `circuit_N`,
  `log_N`, and `gas_per_sumcheck_round` (29,869).
- `results/forge-log.txt` — raw `forge test` output (the ground-truth gas).
- `results/analytical-model.md` — predicted-vs-measured cross-check.

These reproduce Table *bench-gas* / Fig. *bench-gas* directly. The measured gas
excludes the 21,000-gas tx intrinsic and outer calldata, which
`analytical-model.md` adds analytically for the full-transaction figures.

## Limitations

- **Absolute timings are hardware-dependent.** The constraint/wire counts, gate
  counts, proof sizes, and on-chain gas numbers are **deterministic** and
  reproduce exactly. Proving/witness/compile/verify *times* depend on the host
  CPU and will differ in absolute terms from the paper's Apple M4 Pro numbers;
  the **trends and cross-system ratios** (Main Result 5) reproduce.
- **Data provenance of the paper numbers.** The Circom proving/constraint data in
  the paper was generated on `2026-02-26` at commit `bb19cc12` of
  `feat/benchmark-and-fixes`; the benchmark harness
  (`scripts/benchmark/{lib,runners,config}`) is byte-identical at the current
  branch head, so a fresh run reproduces it (the only later additions are the
  `gas-benchmark/` directory). Noir **gate counts** reproduce exactly; some Noir
  *timing* numbers in the paper appendix were taken at the same configuration on
  the reference machine — fresh runs reproduce the gate counts and trends, with
  hardware-dependent absolute times.
- **Gas benchmark transcript differs from off-chain.** The on-chain benchmark
  uses the **keccak** Fiat-Shamir transcript (required for EVM verification),
  whereas the paper's off-chain UltraHonk benchmarks use poseidon2. This changes
  proving time slightly but not the on-chain gas (which is the quantity of
  interest in Main Result 7).
- **Peak-memory probe is macOS-specific.** Circom peak RSS is measured with
  `/usr/bin/time -l` (macOS). On Linux, the measurement code needs adapting to
  `/usr/bin/time -v`; all other measurements are portable.
- **ptau-22 ceiling.** The Circom path is bounded by the ptau-22 transcript at
  2²² ≈ 4.19 M constraints, so circuits larger than SCALE-7 (~3.53 M) are not
  measured on the Circom side; extrapolate from the linear scaling instead.

## Notes on Reusability

The harness is parameterized and reusable beyond this paper:

- **New circuit configurations** can be added by editing
  `scripts/benchmark/config/circuits.config.ts` (header/body budgets, RSA
  `n`/`k`, feature flags, SHA-precompute selectors) in either repository — no
  harness changes needed. Global parameters (run count, timeouts, memory limit,
  ptau power) live in `config/benchmark.config.ts`.
- **The Circom and Noir harnesses share the same config schema and CSV output
  format**, so the cross-system comparison generalizes to any new config you add
  to both.
- **The on-chain gas harness** (`gas-benchmark/`) is a self-contained Foundry
  project that measures `verify` gas for *any* snarkjs-exported Groth16 verifier
  or `bb`-exported UltraHonk verifier; point it at a different zkey / Noir
  circuit to benchmark other applications' verifiers.
