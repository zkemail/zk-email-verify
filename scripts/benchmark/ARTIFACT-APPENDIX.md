# Reproducibility

All benchmark results can be independently reproduced using the exact repository snapshots, system-level dependency installer, and step-by-step instructions below.

## Repository Snapshots

| Repository | Branch | Commit Hash |
|------------|---------|------------|
| `zkemail/zk-email-verify` | `feat/benchmark-and-fixes` | `c901dab` |
| `zkemail/zkemail.nr` | `chore/code-quality-improvements` | `e694d59` |

Clone and checkout the exact commits (includes setup script and all benchmark configs):

```bash
# Circom
git clone https://github.com/zkemail/zk-email-verify.git
cd zk-email-verify
git checkout c901dab109f65cc1dc48a3120ecce3c5661c7995

# Noir
git clone https://github.com/zkemail/zkemail.nr.git
cd zkemail.nr
git checkout e694d59eb7880423804253b7e1ec8812a5f3fd55
```

> **Data provenance.** The Circom proving/gate measurements (`2026-02-26`) were originally generated at commit `bb19cc12` on the same `feat/benchmark-and-fixes` branch. `c901dab` is the current branch head: its benchmark harness (`scripts/benchmark/{lib,runners,config}`) is byte-identical to `bb19cc12` (the only additions since are the on-chain gas benchmark under `scripts/benchmark/gas-benchmark/`), so checking out `c901dab` reproduces the same results.

## Machine Specifications

| Component | Specification |
|-----------|--------------|
| CPU | Apple M4 Pro |
| Cores | 14 (10 performance + 4 efficiency) |
| Memory | 48 GB unified |
| OS | macOS (Darwin 25.3.0) |
| Architecture | arm64 (Apple Silicon) |

## Software Versions

All versions are pinned in `setup-macos.sh` and in each project's `benchmark.config.ts`.

| Tool | Circom Stack | Noir Stack |
|------|-------------|------------|
| Compiler | circom 2.1.9 | nargo 1.0.0-beta.5 |
| Prover | snarkjs 0.7.6 | bb (barretenberg) v0.84.0 |
| Backend | Groth16 (BN254) | UltraHonk |
| Runtime | Node.js v24.0.1 | Node.js v24.0.1 |
| Trusted Setup | Hermez ptau-22 | N/A |
| **Package managers** |  |  |
| yarn | 3.2.3 (root workspace) | --- |
| pnpm | latest | latest |
| bun | latest (setup script) | --- |

## Automated System-Level Setup (macOS)

A single idempotent setup script installs *all* system-level dependencies on macOS. It is located at:

```text
zk-email-verify/scripts/benchmark/setup-macos.sh
```

The script performs the following in order:

1. **Homebrew** — installs if not present; then ensures `git`, `curl`, `wget`, `jq` are available.
2. **Rust** (`rustup`) — required to compile the `circom` binary from source.
3. **circom 2.1.9** — cloned from the tagged release and built via `cargo install`.
4. **Node.js 24** via `nvm` — the JavaScript runtime used by both benchmark harnesses.
5. **yarn, pnpm, bun** — package managers used across the two repos.
6. **nargo 1.0.0-beta.5** via `noirup` — the Noir compiler.
7. **bb v0.84.0** via `bbup` — the Barretenberg proving backend.
8. **Powers of Tau file** (ptau-22, ~4.8 GB) — downloaded from the Hermez ceremony if not already present.

Run the script:

```bash
cd zk-email-verify/scripts/benchmark
chmod +x setup-macos.sh
./setup-macos.sh
```

After completion, `circom`, `nargo`, `bb`, `node`, `pnpm`, `yarn`, and `bun` are all available on `$PATH` at the pinned versions.

## Running the Circom Benchmarks

```bash
cd zk-email-verify

# 1. Install root workspace dependencies
yarn install

# 2. Install benchmark-specific dependencies
cd scripts/benchmark && pnpm install

# 3. One-time setup: generate DKIM keys, sign test emails,
#    generate circuits and circuit inputs
pnpm run setup

# 4. Run the full benchmark suite (compile + prove + verify)
pnpm run benchmark

# --- OR run individual categories ---
pnpm run benchmark:scaling       # scaling configs only
pnpm run benchmark:features      # feature-flag configs only
pnpm run benchmark:rsa           # RSA-1024 vs RSA-2048
pnpm run benchmark:compile-only  # compile + constraint count, skip proving
```

The `setup` step is required only once. It generates DKIM RSA-2048 key pairs, signs test emails via `nodemailer` + `mailauth`, generates parameterized `.circom` files, and prepares JSON circuit inputs. Subsequent runs reuse the generated artifacts.

Each proving configuration runs 3 measurement iterations plus 1 discarded warmup. The harness reports the *median* of the 3 measured runs.

The Groth16 trusted setup (`.zkey` generation) is performed once per circuit and its time is recorded separately. The ptau-22 file (`powersOfTau28_hez_final_22.ptau`) supports circuits up to `2^22 = 4,194,304` R1CS constraints.

## Running the Noir Benchmarks

```bash
cd zkemail.nr

# 1. Install JS library dependencies (prover uses bb.js WASM in-process)
cd js && yarn install && cd ..

# 2. Install benchmark-specific dependencies
cd scripts/benchmark && pnpm install

# 3. Run the full benchmark suite (setup + gate count + prove + report)
pnpm run benchmark:all

# --- OR run steps individually ---
pnpm run setup              # generate keys, emails, circuits
pnpm run gate-count         # nargo compile + bb gates
pnpm run generate-inputs    # prepare prover inputs
pnpm run benchmark:prove    # prove + verify (UltraHonk)
pnpm run report             # generate CSV/JSON results
```

Unlike Circom, Noir proving phase runs *in-process* using `@aztec/bb.js` (WASM). The gate-counting phase invokes `nargo compile` and `bb gates` as subprocesses. No trusted setup or ptau file is required (UltraHonk is a universal SNARK).

Each configuration also runs 3 measured iterations plus 1 discarded warmup, with the *median* reported.

## Benchmark Configuration

Both benchmark harnesses are configured via TypeScript files.

`scripts/benchmark/config/benchmark.config.ts`

| Parameter | Circom | Noir |
|------------|--------|-------|
| Measurement runs | 3 | 3 |
| Warmup runs | 1 (discarded) | 1 (discarded) |
| Statistic reported | Median | Median |
| Compile timeout | 60 min | 30 min |
| Prove timeout | 30 min | 30 min |
| Memory limit | 32 GB (Node) | --- |
| Trusted setup | ptau-22 | N/A |
| Proving system | Groth16 | UltraHonk (honk) |

Circuit configurations (header/body sizes, feature flags) are defined in:

```text
scripts/benchmark/config/circuits.config.ts
```

in each repository.

## Data File Locations

| Data | Path |
|------|------|
| **Circom (`zk-email-verify/`)** | |
| Raw JSON (per-run) | `scripts/benchmark/results/raw/benchmark_2026-02-26*.json` |
| CSV (medians) | `scripts/benchmark/results/csv/benchmark_2026-02-26*.csv` |
| Summary report | `scripts/benchmark/results/summary_2026-02-26*.md` |
| Circuit configs | `scripts/benchmark/config/circuits.config.ts` |
| Harness config | `scripts/benchmark/config/benchmark.config.ts` |
| **Noir (`zkemail.nr/`)** | |
| Raw JSON (per-run) | `scripts/benchmark/results/raw/benchmark_2026-02-26*.json` |
| CSV (medians) | `scripts/benchmark/results/csv/benchmark_2026-02-26*.csv` |
| Circuit configs | `scripts/benchmark/config/circuits.config.ts` |
| Harness config | `scripts/benchmark/config/benchmark.config.ts` |

> **Note.** The `results/` directory is **gitignored** in both repositories, so a fresh clone of the snapshot commits above will **not** contain these output files — they are regenerated by running the benchmark suites (`pnpm run benchmark` / `pnpm run benchmark:all`). The `benchmark_2026-02-26*` filenames reflect the timestamp of the original run; reproduction runs produce files stamped with their own run time. Only the `config/` files are tracked in the repository.

## Notes for Reproducers

1. **Disk space**  
   The Circom stack (compiled circuits, `.zkey` files, ptau) may require up to 20 GB of disk space. The Noir stack requires approximately 5 GB.

2. **Memory**  
   The largest Circom circuit (2048/4096, ~3.5M constraints) consumes ~29 GB peak RSS during Groth16 proving. A machine with at least 32 GB of memory is recommended.

3. **Expected wall-clock time**  
   A full Circom run (all 19 configs, compile + setup + prove) takes approximately 2–3 hours. A full Noir run (18 configs) takes approximately 30–45 minutes. The Groth16 trusted setup (`zkey` generation) dominates Circom wall time for large circuits.

4. **macOS `/usr/bin/time` for memory**  
   Circom peak memory is measured using `/usr/bin/time -l`, which reports maximum resident set size on macOS. This is not available on Linux; the measurement code would need adaptation for `/usr/bin/time -v` on Linux.

5. **Non-macOS systems**  
   The `setup-macos.sh` script is macOS-specific (Homebrew, Darwin conventions). On Linux, replace Homebrew with your package manager, and install `circom`, `nargo`, and `bb` using the same version manager commands (`cargo install`, `noirup`, `bbup`).

6. **Variance**  
   Close all other applications during benchmarking. All measured configurations exhibit a coefficient of variation (CV) ≤ 1.1% across 3 runs (see Appendix `sec:variance`).