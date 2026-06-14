/**
 * Generate benchmark reports in JSON and CSV formats
 *
 * Usage: npx tsx lib/reporter.ts
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { ConstraintInfo } from './constraint-counter.js';
import { ProvingResult } from './prover.js';
import { BENCHMARK_CONFIG } from '../config/benchmark.config.js';
import { ALL_CONFIGS } from '../config/circuits.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BenchmarkReport {
  timestamp: string;
  environment: EnvironmentInfo;
  constraintResults: ConstraintInfo[];
  provingResults: ProvingResult[];
  summary: SummaryStats;
}

export interface EnvironmentInfo {
  os: string;
  arch: string;
  nodeVersion: string;
  circomVersion: string;
  snarkjsVersion: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryGb: number;
}

export interface SummaryStats {
  totalConfigs: number;
  totalRuns: number;
  successfulRuns: number;
  minConstraints: number;
  maxConstraints: number;
  avgProvingTimeMs: number;
  avgWitnessGenTimeMs: number;
}

/**
 * Capture environment information
 */
export function captureEnvironment(): EnvironmentInfo {
  let circomVersion = 'unknown';
  let snarkjsVersion = 'unknown';

  try {
    circomVersion = execSync('circom --version', { encoding: 'utf-8' }).trim();
  } catch { }

  try {
    snarkjsVersion = execSync('snarkjs --version 2>&1 || echo unknown', { encoding: 'utf-8' }).trim();
  } catch { }

  return {
    os: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    nodeVersion: process.version,
    circomVersion,
    snarkjsVersion,
    cpuModel: os.cpus()[0]?.model || 'unknown',
    cpuCores: os.cpus().length,
    totalMemoryGb: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
  };
}

/**
 * Calculate statistics from array of numbers
 */
export function calcStats(values: number[]): {
  median: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
} {
  if (values.length === 0) {
    return { median: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const mean = values.reduce((a, b) => a + b, 0) / n;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    median,
    mean,
    stdDev,
    min: sorted[0],
    max: sorted[n - 1],
  };
}

/**
 * Generate CSV report from benchmark data
 */
export function generateCSVReport(
  constraintResults: ConstraintInfo[],
  provingResults: ProvingResult[]
): string {
  const lines: string[] = [];

  // Header
  lines.push([
    'configId',
    'category',
    'maxHeaders',
    'maxBody',
    'rsaBits',
    'constraints',
    'wires',
    'compileTimeMs',
    'witnessGenTimeMs_median',
    'witnessComputeTimeMs_median',
    'provingTimeMs_median',
    'provingMemoryMb_median',
    'verificationTimeMs_median',
    'proofSize',
    'numRuns',
    'successRate'
  ].join(','));

  // Aggregate proving results by configId
  const provingByConfig = new Map<string, ProvingResult[]>();
  for (const result of provingResults) {
    const existing = provingByConfig.get(result.configId) || [];
    existing.push(result);
    provingByConfig.set(result.configId, existing);
  }

  // Data rows
  for (const constraint of constraintResults) {
    const config = ALL_CONFIGS.find(c => c.id === constraint.configId);
    const proving = provingByConfig.get(constraint.configId) || [];
    const successful = proving.filter(p => p.success);

    const witnessStats = calcStats(successful.map(p => p.witnessGenTimeMs));
    const witnessComputeStats = calcStats(successful.map(p => p.witnessComputeTimeMs ?? p.witnessGenTimeMs));
    const provingStats = calcStats(successful.map(p => p.provingTimeMs));
    const memoryStats = calcStats(successful.map(p => p.provingMemoryMb ?? 0));
    const verifyStats = calcStats(successful.map(p => p.verificationTimeMs));

    lines.push([
      constraint.configId,
      config?.category || '',
      config?.maxHeadersLength || '',
      config?.maxBodyLength || '',
      config ? config.n * config.k : '',
      constraint.constraints,
      constraint.wires,
      constraint.compileTimeMs,
      witnessStats.median.toFixed(0) || '',
      witnessComputeStats.median.toFixed(0) || '',
      provingStats.median.toFixed(0) || '',
      memoryStats.median.toFixed(1),
      verifyStats.median.toFixed(0) || '',
      successful[0]?.proofSize || '',
      proving.length,
      proving.length > 0 ? (successful.length / proving.length * 100).toFixed(0) + '%' : ''
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Generate full benchmark report
 */
export function generateReport(
  constraintResults: ConstraintInfo[],
  provingResults: ProvingResult[]
): BenchmarkReport {
  const successful = provingResults.filter(r => r.success);
  const provingTimes = successful.map(r => r.provingTimeMs);
  const witnessTimes = successful.map(r => r.witnessGenTimeMs);
  const constraintCounts = constraintResults.map(c => c.constraints);

  return {
    timestamp: new Date().toISOString(),
    environment: captureEnvironment(),
    constraintResults,
    provingResults,
    summary: {
      totalConfigs: constraintResults.length,
      totalRuns: provingResults.length,
      successfulRuns: successful.length,
      minConstraints: constraintCounts.length > 0 ? Math.min(...constraintCounts) : 0,
      maxConstraints: constraintCounts.length > 0 ? Math.max(...constraintCounts) : 0,
      avgProvingTimeMs: provingTimes.length > 0 ? provingTimes.reduce((a, b) => a + b, 0) / provingTimes.length : 0,
      avgWitnessGenTimeMs: witnessTimes.length > 0 ? witnessTimes.reduce((a, b) => a + b, 0) / witnessTimes.length : 0,
    },
  };
}

/**
 * Save all reports to files
 */
export function saveReports(report: BenchmarkReport): {
  jsonPath: string;
  csvPath: string;
  mdPath: string;
} {
  const resultsDir = BENCHMARK_CONFIG.resultsDir;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Create directories
  fs.mkdirSync(path.join(resultsDir, 'raw'), { recursive: true });
  fs.mkdirSync(path.join(resultsDir, 'csv'), { recursive: true });

  // Save JSON report
  const jsonPath = path.join(resultsDir, 'raw', `benchmark_${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Save CSV report
  const csv = generateCSVReport(report.constraintResults, report.provingResults);
  const csvPath = path.join(resultsDir, 'csv', `benchmark_${timestamp}.csv`);
  fs.writeFileSync(csvPath, csv);

  // Save Markdown summary
  const mdPath = path.join(resultsDir, `summary_${timestamp}.md`);
  const md = generateMarkdownSummary(report);
  fs.writeFileSync(mdPath, md);

  return { jsonPath, csvPath, mdPath };
}

/**
 * Generate Markdown summary
 */
function generateMarkdownSummary(report: BenchmarkReport): string {
  return `# Benchmark Results

**Date:** ${report.timestamp}

## Environment

| Property | Value |
|----------|-------|
| OS | ${report.environment.os} |
| Architecture | ${report.environment.arch} |
| CPU | ${report.environment.cpuModel} |
| CPU Cores | ${report.environment.cpuCores} |
| Memory | ${report.environment.totalMemoryGb} GB |
| Node.js | ${report.environment.nodeVersion} |
| Circom | ${report.environment.circomVersion} |
| snarkjs | ${report.environment.snarkjsVersion} |

## Summary

| Metric | Value |
|--------|-------|
| Configurations | ${report.summary.totalConfigs} |
| Total Runs | ${report.summary.totalRuns} |
| Successful Runs | ${report.summary.successfulRuns} |
| Min Constraints | ${report.summary.minConstraints.toLocaleString()} |
| Max Constraints | ${report.summary.maxConstraints.toLocaleString()} |
| Avg Proving Time | ${(report.summary.avgProvingTimeMs / 1000).toFixed(2)}s |
| Avg Witness Gen | ${(report.summary.avgWitnessGenTimeMs / 1000).toFixed(2)}s |

## Constraint Results

| Config | Category | Headers | Body | Constraints | Compile Time |
|--------|----------|---------|------|-------------|--------------|
${report.constraintResults.map(c => {
    const config = ALL_CONFIGS.find(cfg => cfg.id === c.configId);
    return `| ${c.configId} | ${config?.category || ''} | ${config?.maxHeadersLength || ''} | ${config?.maxBodyLength || ''} | ${c.constraints.toLocaleString()} | ${(c.compileTimeMs / 1000).toFixed(1)}s |`;
  }).join('\n')}

## Proving Results (Median)

| Config | Witness (total) | Witness (compute) | Proving | Memory (MB) | Verification | Proof Size |
|--------|-----------------|-------------------|---------|-------------|--------------|------------|
${(() => {
      const provingByConfig = new Map<string, ProvingResult[]>();
      for (const r of report.provingResults) {
        const existing = provingByConfig.get(r.configId) || [];
        existing.push(r);
        provingByConfig.set(r.configId, existing);
      }

      return report.constraintResults.map(c => {
        const proving = provingByConfig.get(c.configId) || [];
        const successful = proving.filter(p => p.success);
        if (successful.length === 0) return `| ${c.configId} | - | - | - | - | - | - |`;

        const witnessStats = calcStats(successful.map(p => p.witnessGenTimeMs));
        const witnessComputeStats = calcStats(successful.map(p => p.witnessComputeTimeMs ?? p.witnessGenTimeMs));
        const provingStats = calcStats(successful.map(p => p.provingTimeMs));
        const memoryStats = calcStats(successful.map(p => p.provingMemoryMb ?? 0));
        const verifyStats = calcStats(successful.map(p => p.verificationTimeMs));

        return `| ${c.configId} | ${(witnessStats.median / 1000).toFixed(2)}s | ${(witnessComputeStats.median / 1000).toFixed(2)}s | ${(provingStats.median / 1000).toFixed(2)}s | ${memoryStats.median.toFixed(1)} | ${verifyStats.median.toFixed(0)}ms | ${successful[0].proofSize} B |`;
      }).join('\n');
    })()}
`;
}

/**
 * Load latest results from files
 */
export function loadLatestResults(): { constraints: ConstraintInfo[]; proving: ProvingResult[] } | null {
  const resultsDir = BENCHMARK_CONFIG.resultsDir;

  // Find latest constraint results
  const constraintFiles = fs.existsSync(resultsDir)
    ? fs.readdirSync(resultsDir).filter(f => f.startsWith('constraints_') && f.endsWith('.json'))
    : [];

  // Find latest proving results
  const provingFiles = fs.existsSync(resultsDir)
    ? fs.readdirSync(resultsDir).filter(f => f.startsWith('proving_') && f.endsWith('.json'))
    : [];

  if (constraintFiles.length === 0) {
    return null;
  }

  constraintFiles.sort().reverse();
  provingFiles.sort().reverse();

  const constraints: ConstraintInfo[] = [];
  if (constraintFiles.length > 0) {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, constraintFiles[0]), 'utf-8'));
    for (const value of Object.values(data)) {
      constraints.push(value as ConstraintInfo);
    }
  }

  const proving: ProvingResult[] = [];
  if (provingFiles.length > 0) {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, provingFiles[0]), 'utf-8'));
    proving.push(...data);
  }

  return { constraints, proving };
}

/**
 * Main: Generate reports from command line
 */
async function main() {
  console.log('=== Generating Benchmark Reports ===\n');

  const results = loadLatestResults();

  if (!results || results.constraints.length === 0) {
    console.error('No benchmark results found. Run compile-circuits and prover first.');
    process.exit(1);
  }

  console.log(`Found ${results.constraints.length} constraint results`);
  console.log(`Found ${results.proving.length} proving results\n`);

  const report = generateReport(results.constraints, results.proving);
  const paths = saveReports(report);

  console.log('Reports saved:');
  console.log(`  JSON: ${paths.jsonPath}`);
  console.log(`  CSV:  ${paths.csvPath}`);
  console.log(`  MD:   ${paths.mdPath}`);
}

// Run if executed directly
if (process.argv[1]?.includes('reporter')) {
  main().catch(console.error);
}
