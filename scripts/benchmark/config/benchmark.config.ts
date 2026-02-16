/**
 * Global benchmark configuration
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const BENCHMARK_CONFIG = {
  // Number of runs for statistical significance
  numRuns: 3,

  // Warm-up runs (discarded)
  warmupRuns: 1,

  // Timeouts
  compileTimeoutMs: 60 * 60 * 1000,  // 60 minutes
  proveTimeoutMs: 30 * 60 * 1000,    // 30 minutes

  // Memory limit
  maxMemoryMb: 32768,  // 32 GB

  // Paths (relative to benchmark folder)
  benchmarkDir: path.join(__dirname, '..'),
  circuitsDir: path.join(__dirname, '../circuits'),
  compiledDir: path.join(__dirname, '../compiled'),
  emailsDir: path.join(__dirname, '../emails'),
  keysDir: path.join(__dirname, '../keys'),
  resultsDir: path.join(__dirname, '../results'),
  inputsDir: path.join(__dirname, '../inputs'),

  // Packages path
  packagesDir: path.join(__dirname, '../../../packages'),

  // Powers of tau file (download separately)
  ptauFile: path.join(__dirname, '../powersOfTau28_hez_final_22.ptau'),

  // Circom options
  circomOptions: {
    optimization: 'O1' as 'O0' | 'O1' | 'O2',
    inspect: true,
  },
};

export const PRECOMPUTE_POSITIONS = {
  start: 0.0,   // 0% into body (boundary case)
  early: 0.1,   // 10% into body
  middle: 0.5,  // 50% into body
  late: 0.9,    // 90% into body
  end: 1.0,     // 100% into body (boundary case)
};

// RSA key bits to chunk count mapping
export const RSA_CHUNKS: Record<number, { n: number; k: number }> = {
  1024: { n: 121, k: 9 },
  2048: { n: 121, k: 17 },
};
