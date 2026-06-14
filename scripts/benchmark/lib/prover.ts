/**
 * Run proving benchmarks using snarkjs
 *
 * Usage: npx tsx lib/prover.ts [--config CONFIG_ID]
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CircuitConfig, ALL_CONFIGS, getConfigById } from '../config/circuits.config.js';
import { BENCHMARK_CONFIG } from '../config/benchmark.config.js';
import { ConstraintInfo } from './constraint-counter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to snarkjs in root node_modules
const SNARKJS = path.join(__dirname, '../../../node_modules/snarkjs/build/cli.cjs');

/**
 * Get snarkjs command
 */
function snarkjs(args: string): string {
  if (fs.existsSync(SNARKJS)) {
    return `node --max-old-space-size=${BENCHMARK_CONFIG.maxMemoryMb} "${SNARKJS}" ${args}`;
  }
  return `snarkjs ${args}`;
}

export interface ProvingResult {
  configId: string;
  run: number;
  witnessGenTimeMs: number;
  /** Time spent on pre-compute setup (package.json check, path validation) before witness gen */
  witnessLoadTimeMs?: number;
  /** Time for the actual witness computation (excludes load overhead) */
  witnessComputeTimeMs?: number;
  setupTimeMs: number;
  provingTimeMs: number;
  /** Peak RSS during proving in megabytes (captured via /usr/bin/time) */
  provingMemoryMb?: number;
  verificationTimeMs: number;
  proofSize: number;
  publicSize: number;
  success: boolean;
  error?: string;
}

/**
 * Check if powers of tau file exists
 */
function checkPtau(): boolean {
  if (!fs.existsSync(BENCHMARK_CONFIG.ptauFile)) {
    console.error(`Error: Powers of tau file not found: ${BENCHMARK_CONFIG.ptauFile}`);
    console.error('Download from: https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau');
    console.error(`wget -O "${BENCHMARK_CONFIG.ptauFile}" https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau`);
    return false;
  }
  return true;
}

/**
 * Validate circuit constraints against ptau capacity.
 * Returns list of config IDs that exceed the ptau limit.
 */
export function validateConstraintsAgainstPtau(
  constraintResults: Map<string, ConstraintInfo>
): string[] {
  const ptauLimit = Math.pow(2, BENCHMARK_CONFIG.ptauPower);
  const exceeded: string[] = [];

  for (const [configId, info] of constraintResults) {
    if (info.constraints > ptauLimit) {
      console.error(
        `⚠ ${configId}: ${info.constraints.toLocaleString()} constraints exceeds ` +
        `ptau-${BENCHMARK_CONFIG.ptauPower} limit (${ptauLimit.toLocaleString()}). Skipping.`
      );
      exceeded.push(configId);
    }
  }

  if (exceeded.length === 0) {
    console.log(`All circuits within ptau-${BENCHMARK_CONFIG.ptauPower} limit (${ptauLimit.toLocaleString()} constraints).`);
  }

  return exceeded;
}

/**
 * Generate witness from inputs.
 * Returns split timings: loadTimeMs (setup/validation) and computeTimeMs (actual generation).
 */
export function generateWitness(
  configId: string,
  inputsPath: string
): { witnessPath: string; timeMs: number; loadTimeMs: number; computeTimeMs: number } {
  const compiledDir = path.join(BENCHMARK_CONFIG.compiledDir, configId);
  const circuitName = `benchmark_${configId}`;

  const wasmPath = path.join(compiledDir, `${circuitName}_js/${circuitName}.wasm`);
  const witnessGenScript = path.join(compiledDir, `${circuitName}_js/generate_witness.js`);
  const witnessPath = path.join(compiledDir, 'witness.wtns');

  if (!fs.existsSync(wasmPath)) {
    throw new Error(`WASM not found: ${wasmPath}. Run compile-circuits first.`);
  }

  if (!fs.existsSync(witnessGenScript)) {
    throw new Error(`Witness generator not found: ${witnessGenScript}`);
  }

  // Phase A: Pre-compute setup (timed separately)
  const loadStart = Date.now();
  // Circom emits CJS (require()) in generate_witness.js, but benchmark package.json
  // has "type": "module". A local package.json in compiled/ overrides this for witness scripts.
  const compiledPkgJson = path.join(BENCHMARK_CONFIG.compiledDir, 'package.json');
  if (!fs.existsSync(compiledPkgJson)) {
    fs.writeFileSync(compiledPkgJson, '{"type": "commonjs"}\n');
  }
  const loadTimeMs = Date.now() - loadStart;

  // Phase B: Actual witness generation
  const computeStart = Date.now();
  execSync(`node "${witnessGenScript}" "${wasmPath}" "${inputsPath}" "${witnessPath}"`, {
    stdio: 'pipe',
    timeout: BENCHMARK_CONFIG.proveTimeoutMs,
  });
  const computeTimeMs = Date.now() - computeStart;

  return { witnessPath, timeMs: loadTimeMs + computeTimeMs, loadTimeMs, computeTimeMs };
}

/**
 * Run Groth16 setup (circuit-specific)
 */
export function runSetup(configId: string): { zkeyPath: string; timeMs: number } {
  const compiledDir = path.join(BENCHMARK_CONFIG.compiledDir, configId);
  const circuitName = `benchmark_${configId}`;

  const r1csPath = path.join(compiledDir, `${circuitName}.r1cs`);
  const zkeyPath = path.join(compiledDir, `${circuitName}_0000.zkey`);

  if (!fs.existsSync(r1csPath)) {
    throw new Error(`R1CS not found: ${r1csPath}. Run compile-circuits first.`);
  }

  // Skip if zkey already exists and is non-empty (0-byte = failed setup)
  if (fs.existsSync(zkeyPath) && fs.statSync(zkeyPath).size > 0) {
    return { zkeyPath, timeMs: 0 };
  }

  const startTime = Date.now();
  execSync(
    snarkjs(`groth16 setup "${r1csPath}" "${BENCHMARK_CONFIG.ptauFile}" "${zkeyPath}"`),
    { stdio: 'pipe', timeout: BENCHMARK_CONFIG.proveTimeoutMs }
  );
  const timeMs = Date.now() - startTime;

  return { zkeyPath, timeMs };
}

/**
 * Parse peak RSS from /usr/bin/time -l stderr output.
 * macOS reports "maximum resident set size" in bytes.
 * Linux reports it in kilobytes.
 */
function parsePeakRssMb(stderr: string): number {
  // macOS: "  4218880  maximum resident set size"  (bytes)
  const macMatch = stderr.match(/(\d+)\s+maximum resident set size/);
  if (macMatch) return parseInt(macMatch[1], 10) / (1024 * 1024);

  // Linux: "Maximum resident set size (kbytes): 4120"
  const linuxMatch = stderr.match(/Maximum resident set size.*?:\s*(\d+)/i);
  if (linuxMatch) return parseInt(linuxMatch[1], 10) / 1024;

  return 0;
}

/**
 * Run Groth16 prove, capturing peak RSS via /usr/bin/time -l
 */
export function runProve(
  configId: string,
  witnessPath: string,
  zkeyPath: string
): { proofPath: string; publicPath: string; timeMs: number; proofSize: number; publicSize: number; provingMemoryMb: number } {
  const compiledDir = path.join(BENCHMARK_CONFIG.compiledDir, configId);

  const proofPath = path.join(compiledDir, 'proof.json');
  const publicPath = path.join(compiledDir, 'public.json');

  const snarkjsPath = fs.existsSync(SNARKJS) ? SNARKJS : 'snarkjs';
  const useTimeCmd = fs.existsSync('/usr/bin/time');

  const startTime = Date.now();

  let provingMemoryMb = 0;

  if (useTimeCmd) {
    const result = spawnSync('/usr/bin/time', [
      '-l',
      'node',
      `--max-old-space-size=${BENCHMARK_CONFIG.maxMemoryMb}`,
      snarkjsPath,
      'groth16', 'prove', zkeyPath, witnessPath, proofPath, publicPath,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: BENCHMARK_CONFIG.proveTimeoutMs,
    });

    if (result.status !== 0) {
      const errMsg = result.stderr?.toString() || result.error?.message || 'unknown error';
      throw new Error(`Proving failed (exit ${result.status}): ${errMsg.slice(0, 500)}`);
    }

    provingMemoryMb = parsePeakRssMb(result.stderr?.toString() || '');
  } else {
    execSync(
      snarkjs(`groth16 prove "${zkeyPath}" "${witnessPath}" "${proofPath}" "${publicPath}"`),
      { stdio: 'pipe', timeout: BENCHMARK_CONFIG.proveTimeoutMs }
    );
  }

  const timeMs = Date.now() - startTime;

  const proofSize = fs.statSync(proofPath).size;
  const publicSize = fs.statSync(publicPath).size;

  return { proofPath, publicPath, timeMs, proofSize, publicSize, provingMemoryMb };
}

/**
 * Run Groth16 verify
 */
export function runVerify(
  configId: string,
  zkeyPath: string,
  proofPath: string,
  publicPath: string
): { verified: boolean; timeMs: number } {
  const compiledDir = path.join(BENCHMARK_CONFIG.compiledDir, configId);
  const vkeyPath = path.join(compiledDir, 'vkey.json');

  // Export verification key if needed
  if (!fs.existsSync(vkeyPath)) {
    execSync(snarkjs(`zkey export verificationkey "${zkeyPath}" "${vkeyPath}"`), { stdio: 'pipe' });
  }

  const startTime = Date.now();
  const result = execSync(
    snarkjs(`groth16 verify "${vkeyPath}" "${publicPath}" "${proofPath}"`),
    { encoding: 'utf-8' }
  );
  const timeMs = Date.now() - startTime;

  const verified = result.includes('OK');

  return { verified, timeMs };
}

/**
 * Run full proving benchmark for a config
 */
export async function runProvingBenchmark(
  configId: string,
  inputsPath: string,
  run: number
): Promise<ProvingResult> {
  try {
    // Generate witness
    const witness = generateWitness(configId, inputsPath);

    // Run setup (cached)
    const setup = runSetup(configId);

    // Run prove
    const prove = runProve(configId, witness.witnessPath, setup.zkeyPath);

    // Run verify
    const verify = runVerify(configId, setup.zkeyPath, prove.proofPath, prove.publicPath);

    if (!verify.verified) {
      throw new Error('Proof verification failed');
    }

    return {
      configId,
      run,
      witnessGenTimeMs: witness.timeMs,
      witnessLoadTimeMs: witness.loadTimeMs,
      witnessComputeTimeMs: witness.computeTimeMs,
      setupTimeMs: setup.timeMs,
      provingTimeMs: prove.timeMs,
      provingMemoryMb: prove.provingMemoryMb,
      verificationTimeMs: verify.timeMs,
      proofSize: prove.proofSize,
      publicSize: prove.publicSize,
      success: true,
    };
  } catch (error: any) {
    return {
      configId,
      run,
      witnessGenTimeMs: 0,
      witnessLoadTimeMs: 0,
      witnessComputeTimeMs: 0,
      setupTimeMs: 0,
      provingTimeMs: 0,
      provingMemoryMb: 0,
      verificationTimeMs: 0,
      proofSize: 0,
      publicSize: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run benchmarks for multiple configs
 */
export async function runBenchmarks(
  configs: CircuitConfig[],
  numRuns = 3
): Promise<ProvingResult[]> {
  const results: ProvingResult[] = [];

  for (const config of configs) {
    const inputsPath = path.join(BENCHMARK_CONFIG.inputsDir, `${config.id}.json`);

    if (!fs.existsSync(inputsPath)) {
      console.log(`⚠ Inputs not found for ${config.id}, skipping`);
      continue;
    }

    console.log(`\nBenchmarking ${config.id}...`);

    // Warmup runs (discarded) to eliminate cold-cache variance
    const warmupRuns = BENCHMARK_CONFIG.warmupRuns || 0;
    for (let w = 0; w < warmupRuns; w++) {
      console.log(`  Warmup ${w + 1}/${warmupRuns}...`);
      await runProvingBenchmark(config.id, inputsPath, 0);
    }

    for (let run = 1; run <= numRuns; run++) {
      const result = await runProvingBenchmark(config.id, inputsPath, run);

      if (result.success) {
        const memStr = result.provingMemoryMb ? `, mem=${result.provingMemoryMb.toFixed(0)}MB` : '';
        console.log(`  Run ${run}: witness=${result.witnessComputeTimeMs}ms (load=${result.witnessLoadTimeMs}ms), prove=${result.provingTimeMs}ms${memStr}, verify=${result.verificationTimeMs}ms`);
      } else {
        console.log(`  Run ${run}: FAILED - ${result.error}`);
      }

      results.push(result);
    }
  }

  return results;
}

/**
 * Main: Run proving benchmarks from command line
 */
async function main() {
  console.log('=== Running Proving Benchmarks ===\n');

  if (!checkPtau()) {
    process.exit(1);
  }

  const args = process.argv.slice(2);

  // Check for specific config
  const configIdx = args.findIndex(a => a === '--config');
  if (configIdx !== -1 && args[configIdx + 1]) {
    const configId = args[configIdx + 1];
    const config = getConfigById(configId);
    if (!config) {
      console.error(`Unknown config: ${configId}`);
      process.exit(1);
    }

    const inputsPath = path.join(BENCHMARK_CONFIG.inputsDir, `${configId}.json`);
    if (!fs.existsSync(inputsPath)) {
      console.error(`Inputs not found: ${inputsPath}`);
      console.error('Run generate-inputs first.');
      process.exit(1);
    }

    console.log(`Running benchmark for: ${configId}\n`);

    const results = await runBenchmarks([config], BENCHMARK_CONFIG.numRuns);

    // Print summary
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      const avgWitness = successful.reduce((a, b) => a + b.witnessGenTimeMs, 0) / successful.length;
      const avgProve = successful.reduce((a, b) => a + b.provingTimeMs, 0) / successful.length;
      const avgVerify = successful.reduce((a, b) => a + b.verificationTimeMs, 0) / successful.length;

      console.log('\n=== Summary ===');
      console.log(`Avg witness gen: ${avgWitness.toFixed(0)}ms`);
      console.log(`Avg proving:     ${avgProve.toFixed(0)}ms`);
      console.log(`Avg verification: ${avgVerify.toFixed(0)}ms`);
    }
    return;
  }

  // Run all benchmarks
  console.log(`Running ${BENCHMARK_CONFIG.numRuns} runs per config...\n`);

  const results = await runBenchmarks(ALL_CONFIGS, BENCHMARK_CONFIG.numRuns);

  // Save results
  const resultsDir = BENCHMARK_CONFIG.resultsDir;
  fs.mkdirSync(resultsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsPath = path.join(resultsDir, `proving_${timestamp}.json`);

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);
}

// Run if executed directly
if (process.argv[1]?.includes('prover')) {
  main().catch(console.error);
}
