/**
 * Compile circuits and count constraints
 *
 * Usage: npx tsx lib/constraint-counter.ts [--config CONFIG_ID]
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CircuitConfig, ALL_CONFIGS, getConfigById } from '../config/circuits.config.js';
import { BENCHMARK_CONFIG } from '../config/benchmark.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ConstraintInfo {
  configId: string;
  constraints: number;
  wires: number;
  publicInputs: number;
  privateInputs: number;
  labels: number;
  compileTimeMs: number;
  r1csSize: number;
  wasmSize: number;
  symSize: number;
}

/**
 * Check if circom is installed
 */
function checkCircom(): boolean {
  try {
    const version = execSync('circom --version', { encoding: 'utf-8' }).trim();
    console.log(`Circom version: ${version}`);
    return true;
  } catch {
    console.error('Error: circom not found. Please install circom 2.1.9+');
    console.error('See: https://docs.circom.io/getting-started/installation/');
    return false;
  }
}

// Path to snarkjs in root node_modules
const SNARKJS = path.join(__dirname, '../../../node_modules/snarkjs/build/cli.cjs');

/**
 * Check if snarkjs is installed
 */
function checkSnarkjs(): boolean {
  if (fs.existsSync(SNARKJS)) {
    return true;
  }
  try {
    execSync('snarkjs --version', { encoding: 'utf-8' });
    return true;
  } catch {
    console.error('Error: snarkjs not found. Run npm install in project root.');
    return false;
  }
}

/**
 * Get snarkjs command
 */
function snarkjs(args: string): string {
  if (fs.existsSync(SNARKJS)) {
    return `node --max-old-space-size=${BENCHMARK_CONFIG.maxMemoryMb} "${SNARKJS}" ${args}`;
  }
  return `snarkjs ${args}`;
}

/**
 * Compile circuit and count constraints using circom
 */
export async function compileAndCountConstraints(
  configId: string,
  verbose = false
): Promise<ConstraintInfo> {
  const circuitPath = path.join(BENCHMARK_CONFIG.circuitsDir, `benchmark_${configId}.circom`);

  if (!fs.existsSync(circuitPath)) {
    throw new Error(`Circuit not found: ${circuitPath}. Run generate-circuits first.`);
  }

  const outputDir = path.join(BENCHMARK_CONFIG.compiledDir, configId);
  fs.mkdirSync(outputDir, { recursive: true });

  const circuitName = `benchmark_${configId}`;

  // Build include paths
  const includePaths = [
    path.join(__dirname, '../../../node_modules'),
    path.join(__dirname, '../../../packages/circuits'),
  ];
  const includeFlags = includePaths.map(p => `-l "${p}"`).join(' ');

  // Compile with circom
  const compileCmd = `circom "${circuitPath}" \
    --r1cs --wasm --sym \
    -o "${outputDir}" \
    ${includeFlags} \
    --${BENCHMARK_CONFIG.circomOptions.optimization} \
    ${BENCHMARK_CONFIG.circomOptions.inspect ? '--inspect' : ''}`;

  if (verbose) {
    console.log(`Compiling ${configId}...`);
    console.log(`Command: ${compileCmd}\n`);
  }

  const startTime = Date.now();

  try {
    execSync(compileCmd, {
      stdio: verbose ? 'inherit' : 'pipe',
      timeout: BENCHMARK_CONFIG.compileTimeoutMs,
      maxBuffer: 100 * 1024 * 1024, // 100 MB
    });
  } catch (error: any) {
    console.error(`Compilation failed for ${configId}`);
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    throw error;
  }

  const compileTimeMs = Date.now() - startTime;

  // Get R1CS info using snarkjs
  const r1csPath = path.join(outputDir, `${circuitName}.r1cs`);

  if (!fs.existsSync(r1csPath)) {
    throw new Error(`R1CS file not found: ${r1csPath}`);
  }

  const infoOutput = execSync(snarkjs(`r1cs info "${r1csPath}"`), { encoding: 'utf-8' });

  // Parse constraint info
  const constraints = parseInt(infoOutput.match(/# of Constraints: (\d+)/)?.[1] || '0');
  const wires = parseInt(infoOutput.match(/# of Wires: (\d+)/)?.[1] || '0');
  const publicInputs = parseInt(infoOutput.match(/# of Public Inputs: (\d+)/)?.[1] || '0');
  const privateInputs = parseInt(infoOutput.match(/# of Private Inputs: (\d+)/)?.[1] || '0');
  const labels = parseInt(infoOutput.match(/# of Labels: (\d+)/)?.[1] || '0');

  // Get file sizes
  const r1csSize = fs.statSync(r1csPath).size;

  const wasmPath = path.join(outputDir, `${circuitName}_js/${circuitName}.wasm`);
  const wasmSize = fs.existsSync(wasmPath) ? fs.statSync(wasmPath).size : 0;

  const symPath = path.join(outputDir, `${circuitName}.sym`);
  const symSize = fs.existsSync(symPath) ? fs.statSync(symPath).size : 0;

  return {
    configId,
    constraints,
    wires,
    publicInputs,
    privateInputs,
    labels,
    compileTimeMs,
    r1csSize,
    wasmSize,
    symSize,
  };
}

/**
 * Compile all circuits and return constraint info
 */
export async function compileAllCircuits(
  configs: CircuitConfig[],
  verbose = false
): Promise<Map<string, ConstraintInfo>> {
  const results = new Map<string, ConstraintInfo>();

  for (const config of configs) {
    try {
      const info = await compileAndCountConstraints(config.id, verbose);
      results.set(config.id, info);
      console.log(`${config.id.padEnd(20)}\t${info.constraints.toLocaleString().padStart(12)} constraints\t${(info.compileTimeMs / 1000).toFixed(1)}s`);
    } catch (error: any) {
      console.error(`Failed to compile ${config.id}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Main: Compile circuits from command line
 */
async function main() {
  console.log('=== Compiling Circuits and Counting Constraints ===\n');

  if (!checkCircom() || !checkSnarkjs()) {
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');

  // Check for specific config
  const configIdx = args.findIndex(a => a === '--config');
  if (configIdx !== -1 && args[configIdx + 1]) {
    const configId = args[configIdx + 1];
    const config = getConfigById(configId);
    if (!config) {
      console.error(`Unknown config: ${configId}`);
      process.exit(1);
    }

    console.log(`Compiling single config: ${configId}\n`);
    const info = await compileAndCountConstraints(configId, true);

    console.log('\n=== Results ===');
    console.log(`Constraints:    ${info.constraints.toLocaleString()}`);
    console.log(`Wires:          ${info.wires.toLocaleString()}`);
    console.log(`Public inputs:  ${info.publicInputs}`);
    console.log(`Private inputs: ${info.privateInputs}`);
    console.log(`Compile time:   ${(info.compileTimeMs / 1000).toFixed(1)}s`);
    console.log(`R1CS size:      ${formatBytes(info.r1csSize)}`);
    console.log(`WASM size:      ${formatBytes(info.wasmSize)}`);
    return;
  }

  // Compile all circuits
  console.log('ID\t\t\tConstraints\tTime');
  console.log('─'.repeat(60));

  const results = await compileAllCircuits(ALL_CONFIGS, verbose);

  console.log('─'.repeat(60));
  console.log(`\nCompiled ${results.size} circuits`);

  // Save results to JSON
  const resultsDir = BENCHMARK_CONFIG.resultsDir;
  fs.mkdirSync(resultsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsPath = path.join(resultsDir, `constraints_${timestamp}.json`);

  const resultsObj = Object.fromEntries(results);
  fs.writeFileSync(resultsPath, JSON.stringify(resultsObj, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);
}

// Run if executed directly
if (process.argv[1]?.includes('constraint-counter')) {
  main().catch(console.error);
}
