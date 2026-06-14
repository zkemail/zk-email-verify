# ZK Email Benchmark Suite (Circom)

Benchmarks the **zk-email-verify** Circom circuits across four dimensions: body-size scaling, RSA key sizes, feature toggles, and SHA precompute savings.

> **See also:** [`gas-benchmark/`](./gas-benchmark/) — on-chain Ethereum gas measurement for
> Circom/Groth16 vs Noir/UltraHonk verifiers across SCALE-1/4/7. Self-contained Foundry
> harness with reviewer-reproducible `run.sh`. Used to produce the §6.4 on-chain
> verification-cost table in the paper.

## Prerequisites

Run the setup script to install all system dependencies (circom, Node.js, snarkjs, ptau file, etc.):

```bash
chmod +x setup-macos.sh && ./setup-macos.sh
```

Or install manually: circom 2.1.9, Node.js 24+, bun, pnpm, and download [ptau-22](https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau) into this directory.

## Quick Start

```bash
# Install dependencies
pnpm install

# One-shot setup: generate keys, emails, circuits, and inputs
pnpm run setup

# Run full benchmark (compile + prove + report)
pnpm run benchmark
```

## Benchmark Categories

| Flag | Category | What it measures |
|------|----------|------------------|
| `--scaling` | Body size scaling | Constraint growth as `maxBodyLength` increases (768–3072 bytes) |
| `--rsa` | RSA key sizes | 1024-bit vs 2048-bit RSA verification cost |
| `--features` | Feature toggles | Header/body masking, body hash check skip |
| `--precompute` | SHA precompute | Constraint savings when pre-hashing 25/50/75% of the body |

```bash
# Run a single category
pnpm run benchmark:scaling
pnpm run benchmark:rsa
pnpm run benchmark:features

# Compile-only (skip proving, useful for constraint counts)
pnpm run benchmark:compile-only
```

## Pipeline

The benchmark runs in three phases:

1. **Compile** — Generates `.circom` files from config, compiles with circom, counts constraints/wires.
2. **Prove** — For each config: generate witness, run Groth16 setup, prove, and verify. Repeated `numRuns` times (default 3) with 1 warmup run. Captures peak RSS memory via `/usr/bin/time`.
3. **Report** — Aggregates results into CSV, JSON, and Markdown in `results/`.

## Step-by-Step (Manual)

```bash
# 1. Generate DKIM keys and signed test emails
pnpm run generate-keys
pnpm run generate-emails
pnpm run verify-emails

# 2. Generate circuit files from config
pnpm run generate-circuits          # all categories
pnpm run generate-circuits:scaling  # only scaling

# 3. Generate circuit inputs (witness inputs from emails)
pnpm run generate-circuit-inputs

# 4. Compile circuits (outputs constraint counts)
pnpm run compile-circuits

# 5. Prove a specific config
pnpm run prove:config -- SCALE-768

# 6. Generate report from results/
pnpm run report
```

## Configuration

- **`config/benchmark.config.ts`** — Global settings: number of runs, timeouts, memory limit, ptau power, paths.
- **`config/circuits.config.ts`** — Circuit configurations for each category (scaling, RSA, features, precompute).

## Output

Results are written to `results/` as:
- `results/csv/benchmark_<timestamp>.csv` — Machine-readable, one row per config (medians).
- `results/raw/benchmark_<timestamp>.json` — Full data including per-run timings.
- `results/summary_<timestamp>.md` — Human-readable Markdown summary.

Columns include: constraints, wires, compile time, witness gen (total/compute), proving time, proving memory (MB), verification time, and proof size.

## Project Structure

```
scripts/benchmark/
├── config/
│   ├── benchmark.config.ts    # Global settings
│   └── circuits.config.ts     # Circuit parameter matrices
├── lib/
│   ├── generate-keys.ts       # RSA key pair generation
│   ├── generate-signed-emails.ts  # DKIM-signed test emails
│   ├── verify-emails.ts       # Email signature verification
│   ├── circuit-generator.ts   # .circom file generation
│   ├── input-generator-circuit.ts  # Witness input generation
│   ├── constraint-counter.ts  # Circom compilation + counting
│   ├── prover.ts              # Groth16 prove/verify + memory tracking
│   └── reporter.ts            # CSV/JSON/Markdown report generation
├── runners/
│   └── run-all.ts             # Orchestrator (compile → prove → report)
├── gas-benchmark/             # On-chain gas benchmark (Groth16 vs UltraHonk)
│   ├── run.sh                 #   one-shot reproduction
│   ├── README.md              #   reviewer-facing docs
│   ├── src/verifiers/         #   generated Solidity verifiers
│   ├── test/                  #   Foundry gas tests
│   ├── noir/{SCALE-1,4,7}/    #   parameterized Noir circuits
│   ├── fixtures/              #   proof + public-input fixtures
│   └── results/               #   gas measurements + analytical model
├── setup-macos.sh             # macOS dependency installer
└── package.json
```
