/**
 * Generate Circom circuit files for benchmarking
 *
 * Usage: npx tsx lib/circuit-generator.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CircuitConfig, ALL_CONFIGS, SCALING_CONFIGS, RSA_CONFIGS, FEATURE_CONFIGS, PRECOMPUTE_CONFIGS } from '../config/circuits.config.js';
import { BENCHMARK_CONFIG } from '../config/benchmark.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate a Circom circuit file for benchmarking
 */
export function generateCircuitFile(config: CircuitConfig): string {
  const circuitName = `benchmark_${config.id}`;

  const template = `pragma circom 2.1.6;

include "../../../packages/circuits/email-verifier.circom";

// Benchmark circuit: ${config.id}
// Category: ${config.category}
// Generated: ${new Date().toISOString()}
// maxHeadersLength: ${config.maxHeadersLength}
// maxBodyLength: ${config.maxBodyLength}
// RSA: n=${config.n}, k=${config.k} (${config.n * config.k} bits)

component main { public [ pubkey ] } = EmailVerifier(
    ${config.maxHeadersLength},    // maxHeadersLength
    ${config.maxBodyLength},       // maxBodyLength
    ${config.n},                   // n (RSA chunk bits)
    ${config.k},                   // k (RSA chunks)
    ${config.ignoreBodyHashCheck}, // ignoreBodyHashCheck
    ${config.enableHeaderMasking}, // enableHeaderMasking
    ${config.enableBodyMasking},   // enableBodyMasking
    ${config.removeSoftLineBreaks} // removeSoftLineBreaks
);
`;

  const outputPath = path.join(BENCHMARK_CONFIG.circuitsDir, `${circuitName}.circom`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, template);

  return outputPath;
}

/**
 * Generate all circuit files for benchmarking
 */
export function generateAllCircuits(configs: CircuitConfig[]): Map<string, string> {
  const circuitPaths = new Map<string, string>();

  for (const config of configs) {
    const circuitPath = generateCircuitFile(config);
    circuitPaths.set(config.id, circuitPath);
  }

  return circuitPaths;
}

/**
 * Main: Generate circuits from command line
 */
async function main() {
  const args = process.argv.slice(2);
  let configs: CircuitConfig[] = ALL_CONFIGS;

  // Parse arguments for specific category
  if (args.includes('--scaling')) {
    configs = SCALING_CONFIGS;
    console.log('=== Generating Scaling Benchmark Circuits ===\n');
  } else if (args.includes('--rsa')) {
    configs = RSA_CONFIGS;
    console.log('=== Generating RSA Benchmark Circuits ===\n');
  } else if (args.includes('--features')) {
    configs = FEATURE_CONFIGS;
    console.log('=== Generating Feature Benchmark Circuits ===\n');
  } else if (args.includes('--precompute')) {
    configs = PRECOMPUTE_CONFIGS;
    console.log('=== Generating Precompute Benchmark Circuits ===\n');
  } else {
    console.log('=== Generating All Benchmark Circuits ===\n');
  }

  console.log('ID\t\t\tHeaders\tBody\tRSA\tFile');
  console.log('─'.repeat(80));

  const circuitPaths = generateAllCircuits(configs);

  for (const [id, circuitPath] of circuitPaths) {
    const config = configs.find(c => c.id === id)!;
    const rsaBits = config.n * config.k;
    console.log(`${id.padEnd(20)}\t${config.maxHeadersLength}\t${config.maxBodyLength}\t${rsaBits}\t${path.basename(circuitPath)}`);
  }

  console.log('─'.repeat(80));
  console.log(`\nGenerated ${circuitPaths.size} circuits in ${BENCHMARK_CONFIG.circuitsDir}`);
  console.log('\nNext: Run `npm run compile-circuits` to compile and count constraints');
}

// Run if executed directly
if (process.argv[1]?.includes('circuit-generator')) {
  main().catch(console.error);
}
