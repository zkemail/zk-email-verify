/**
 * Run complete benchmark suite
 *
 * Usage: npx tsx runners/run-all.ts [--skip-compile] [--skip-prove]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ALL_CONFIGS, SCALING_CONFIGS, RSA_CONFIGS, FEATURE_CONFIGS, PRECOMPUTE_CONFIGS, PRECOMPUTE_REDUCED_CONFIGS } from '../config/circuits.config.js';
import { BENCHMARK_CONFIG } from '../config/benchmark.config.js';
import { generateAllCircuits } from '../lib/circuit-generator.js';
import { compileAllCircuits, ConstraintInfo } from '../lib/constraint-counter.js';
import { runBenchmarks, ProvingResult } from '../lib/prover.js';
import { generateReport, saveReports } from '../lib/reporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const args = process.argv.slice(2);
  const skipCompile = args.includes('--skip-compile');
  const skipProve = args.includes('--skip-prove');
  const category = args.find(a => ['--scaling', '--rsa', '--features', '--precompute'].includes(a));

  // Select configs based on category
  let configs = ALL_CONFIGS;
  let categoryName = 'All';

  if (category === '--scaling') {
    configs = SCALING_CONFIGS;
    categoryName = 'Scaling';
  } else if (category === '--rsa') {
    configs = RSA_CONFIGS;
    categoryName = 'RSA';
  } else if (category === '--features') {
    configs = FEATURE_CONFIGS;
    categoryName = 'Features';
  } else if (category === '--precompute') {
    configs = [...PRECOMPUTE_CONFIGS, ...PRECOMPUTE_REDUCED_CONFIGS];
    categoryName = 'Precompute';
  }

  console.log('═'.repeat(60));
  console.log(`  ZK-Email-Verify Benchmark Suite (${categoryName})`);
  console.log('═'.repeat(60));
  console.log();

  // Check prerequisites
  if (!skipProve && !fs.existsSync(BENCHMARK_CONFIG.ptauFile)) {
    console.error(`Error: Powers of tau file not found: ${BENCHMARK_CONFIG.ptauFile}`);
    console.error('Download with:');
    console.error(`  wget -O "${BENCHMARK_CONFIG.ptauFile}" https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau`);
    process.exit(1);
  }

  // Check for input files
  const inputsExist = configs.some(c =>
    fs.existsSync(path.join(BENCHMARK_CONFIG.inputsDir, `${c.id}.json`))
  );

  if (!skipProve && !inputsExist) {
    console.error('Error: No input files found. Run these steps first:');
    console.error('  npm run generate-keys');
    console.error('  npm run generate-emails');
    console.error('  npm run generate-circuit-inputs');
    process.exit(1);
  }

  let constraintResults: Map<string, ConstraintInfo> = new Map();
  let provingResults: ProvingResult[] = [];

  // Phase 1: Generate circuits
  console.log('Phase 1: Generating circuit files...');
  console.log('─'.repeat(40));
  const circuitPaths = generateAllCircuits(configs);
  console.log(`Generated ${circuitPaths.size} circuits\n`);

  // Phase 2: Compile and count constraints
  if (!skipCompile) {
    console.log('Phase 2: Compiling circuits and counting constraints...');
    console.log('─'.repeat(40));
    console.log('This may take a while for large circuits...\n');

    console.log('ID\t\t\tConstraints\tTime');
    console.log('─'.repeat(60));

    constraintResults = await compileAllCircuits(configs, false);

    console.log('─'.repeat(60));
    console.log(`Compiled ${constraintResults.size} circuits\n`);
  } else {
    console.log('Phase 2: Skipped (--skip-compile)\n');
  }

  // Phase 3: Run proving benchmarks
  if (!skipProve) {
    console.log(`Phase 3: Running proving benchmarks (${BENCHMARK_CONFIG.numRuns} runs each)...`);
    console.log('─'.repeat(40));

    provingResults = await runBenchmarks(configs, BENCHMARK_CONFIG.numRuns);

    const successful = provingResults.filter(r => r.success).length;
    console.log(`\nCompleted ${provingResults.length} runs (${successful} successful)\n`);
  } else {
    console.log('Phase 3: Skipped (--skip-prove)\n');
  }

  // Phase 4: Generate reports
  if (constraintResults.size > 0 || provingResults.length > 0) {
    console.log('Phase 4: Generating reports...');
    console.log('─'.repeat(40));

    const report = generateReport(
      Array.from(constraintResults.values()),
      provingResults
    );

    const paths = saveReports(report);

    console.log(`  JSON: ${paths.jsonPath}`);
    console.log(`  CSV:  ${paths.csvPath}`);
    console.log(`  MD:   ${paths.mdPath}`);
    console.log();
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('  Benchmark Complete');
  console.log('═'.repeat(60));

  if (constraintResults.size > 0) {
    const constraints = Array.from(constraintResults.values()).map(c => c.constraints);
    console.log(`\nConstraint Range: ${Math.min(...constraints).toLocaleString()} - ${Math.max(...constraints).toLocaleString()}`);
  }

  if (provingResults.length > 0) {
    const successful = provingResults.filter(r => r.success);
    if (successful.length > 0) {
      const avgProve = successful.reduce((a, b) => a + b.provingTimeMs, 0) / successful.length;
      console.log(`Avg Proving Time: ${(avgProve / 1000).toFixed(2)}s`);
    }
  }
}

main().catch(console.error);
