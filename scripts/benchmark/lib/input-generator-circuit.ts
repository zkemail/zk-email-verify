/**
 * Generate circuit inputs for all benchmark configurations
 *
 * Usage: npx tsx lib/input-generator-circuit.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import forge from 'node-forge';
import { fileURLToPath } from 'url';
import { CircuitConfig, ALL_CONFIGS, getConfigById } from '../config/circuits.config.js';
import { BENCHMARK_CONFIG } from '../config/benchmark.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { pki } = forge;

// Load public keys from keys directory
const PUBLIC_KEYS: Record<number, string> = {};
for (const bits of [1024, 2048]) {
  const pubKeyPath = path.join(BENCHMARK_CONFIG.keysDir, `dkim_${bits}_pub.pem`);
  if (fs.existsSync(pubKeyPath)) {
    const pubKey = fs.readFileSync(pubKeyPath, 'utf-8')
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');
    PUBLIC_KEYS[bits] = `v=DKIM1; k=rsa; p=${pubKey}`;
  }
}

/**
 * Get RSA bits from config
 */
function getRsaBits(config: CircuitConfig): number {
  const bits = config.n * config.k;
  if (bits >= 2000) return 2048;
  return 1024;
}

/**
 * Parse email filename to extract sizes
 * Format: email_h{headers}_b{body}_rsa{bits}.eml
 */
function parseEmailFilename(filename: string): { headers: number; body: number; rsa: number } | null {
  const match = filename.match(/email_h(\d+)_b(\d+)_rsa(\d+)\.eml/);
  if (!match) return null;
  return {
    headers: parseInt(match[1]),
    body: parseInt(match[2]),
    rsa: parseInt(match[3]),
  };
}

/**
 * Find appropriate email file for config
 * Matches RSA size and ensures email fits within circuit constraints
 */
function findEmailFile(config: CircuitConfig): string | null {
  const rsaBits = getRsaBits(config);
  const emailsDir = path.join(BENCHMARK_CONFIG.emailsDir, 'synthetic');

  if (!fs.existsSync(emailsDir)) {
    return null;
  }

  const files = fs.readdirSync(emailsDir).filter(f => f.endsWith('.eml'));

  // Find best matching email
  let bestMatch: string | null = null;
  let bestBodyDiff = Infinity;

  for (const file of files) {
    const parsed = parseEmailFilename(file);
    if (!parsed) continue;

    // Must match RSA key size
    if (parsed.rsa !== rsaBits) continue;

    // Body must fit within circuit (with padding margin)
    // Must match helpers/src/input-generators.ts bodySHALength formula
    // When sourceEmailBodySize is set (precompute configs), match against that instead
    const effectiveMaxBody = config.sourceEmailBodySize
      ? Math.floor((config.sourceEmailBodySize + 63 + 65) / 64) * 64
      : config.maxBodyLength;
    const paddedBodySize = Math.floor((parsed.body + 63 + 65) / 64) * 64;
    if (paddedBodySize > effectiveMaxBody) continue;

    // Prefer smallest email that fits
    const bodyDiff = effectiveMaxBody - paddedBodySize;
    if (bodyDiff < bestBodyDiff) {
      bestBodyDiff = bodyDiff;
      bestMatch = file;
    }
  }

  return bestMatch ? path.join(emailsDir, bestMatch) : null;
}

/**
 * Extract a selector from the body at a fractional position (0–1).
 * Snaps to the nearest word boundary. Expands the selector (up to 8 words)
 * until its first occurrence in the body is at or near the intended position,
 * so that findIndexInUint8Array won't match an earlier duplicate.
 */
function extractSelectorAtPosition(body: string, position: number): string {
  const target = Math.floor(body.length * Math.max(0, Math.min(1, position)));

  // Find the start of the word at/after target
  let start = target;
  while (start < body.length && /\s/.test(body[start])) start++;
  // Walk back to the start of the current word if we landed mid-word
  while (start > 0 && !/\s/.test(body[start - 1])) start--;

  const remaining = body.slice(start);

  // Expand from 3 to 8 words until the selector's first occurrence is near `start`.
  // This avoids collisions where the same short phrase appears earlier in the body,
  // which would cause findIndexInUint8Array to return the wrong position.
  for (let wordCount = 3; wordCount <= 8; wordCount++) {
    const regex = new RegExp(`^(\\S+(?:\\s+\\S+){${wordCount - 1}})`);
    const match = remaining.match(regex);
    if (!match) break;
    const candidate = match[1];
    const firstOccurrence = body.indexOf(candidate);
    if (firstOccurrence >= start) return candidate;
  }

  // Fallback: return best available (3-word) even if it has an earlier duplicate
  const match = remaining.match(/^(\S+(?:\s+\S+){2})/);
  if (match) return match[1];

  const fallback = remaining.trim().split(/\s+/).slice(0, 3).join(' ');
  if (fallback.length > 0) return fallback;
  throw new Error(`Cannot extract selector at position ${position} — body too short`);
}

/**
 * Generate circuit inputs for a config using helpers library
 */
async function generateInputsForConfig(
  config: CircuitConfig,
  emailPath: string
): Promise<any> {
  // Import helpers dynamically
  const { DkimVerifier } = await import(
    '../../../packages/helpers/src/lib/mailauth/dkim-verifier.js'
  );
  const { writeToStream } = await import(
    '../../../packages/helpers/src/lib/mailauth/tools.js'
  );
  const { generateEmailVerifierInputsFromDKIMResult } = await import(
    '../../../packages/helpers/src/input-generators.js'
  );

  const emailBuffer = fs.readFileSync(emailPath);
  const rsaBits = getRsaBits(config);

  // Custom DNS resolver for our test domain
  const resolver = async (name: string, type: string) => {
    if (type === 'TXT' && name === 'dkim._domainkey.benchmark.test') {
      return [[PUBLIC_KEYS[rsaBits]]];
    }
    return [];
  };

  // Verify DKIM
  const dkimVerifier = new DkimVerifier({ resolver });
  await writeToStream(dkimVerifier, emailBuffer);

  const dkimResult = dkimVerifier.results.find(
    (d: any) => d.signingDomain === 'benchmark.test'
  );

  if (!dkimResult || dkimResult.status?.result !== 'pass') {
    throw new Error(`DKIM verification failed for ${emailPath}`);
  }

  // Construct DKIMVerificationResult
  const pubKeyPem = fs.readFileSync(
    path.join(BENCHMARK_CONFIG.keysDir, `dkim_${rsaBits}_pub.pem`),
    'utf-8'
  );
  const pubKeyData = pki.publicKeyFromPem(pubKeyPem);

  const dkimVerificationResult = {
    publicKey: BigInt(pubKeyData.n.toString()),
    signature: BigInt(`0x${Buffer.from(dkimResult.signature, 'base64').toString('hex')}`),
    headers: dkimResult.status.signedHeaders,
    body: dkimResult.body,
    bodyHash: dkimResult.bodyHash,
    signingDomain: dkimResult.signingDomain,
    selector: dkimResult.selector,
    algo: dkimResult.algo,
    format: dkimResult.format,
    modulusLength: dkimResult.modulusLength,
  };

  // Generate circuit inputs
  const options: any = {
    maxHeadersLength: config.maxHeadersLength,
    maxBodyLength: config.maxBodyLength,
    ignoreBodyHashCheck: config.ignoreBodyHashCheck === 1,
  };

  // Add masks if enabled
  if (config.enableHeaderMasking === 1) {
    options.enableHeaderMasking = true;
    options.headerMask = new Array(config.maxHeadersLength).fill(1);
  }

  if (config.enableBodyMasking === 1) {
    options.enableBodyMasking = true;
    options.bodyMask = new Array(config.maxBodyLength).fill(1);
  }

  if (config.removeSoftLineBreaks === 1) {
    options.removeSoftLineBreaks = true;
  }

  // Resolve selector: explicit string, or auto-extract from body at position
  let selector = config.shaPrecomputeSelector;
  if (!selector && config.shaPrecomputePosition != null) {
    const bodyStr = new TextDecoder().decode(dkimVerificationResult.body);
    selector = extractSelectorAtPosition(bodyStr, config.shaPrecomputePosition);
  }
  if (selector) {
    options.shaPrecomputeSelector = selector;
  }

  const circuitInputs = generateEmailVerifierInputsFromDKIMResult(
    dkimVerificationResult,
    options
  );

  return circuitInputs;
}

/**
 * Generate inputs for all configs
 */
async function generateAllInputs(): Promise<Map<string, any>> {
  const results = new Map<string, any>();

  fs.mkdirSync(BENCHMARK_CONFIG.inputsDir, { recursive: true });

  for (const config of ALL_CONFIGS) {
    const emailPath = findEmailFile(config);

    if (!emailPath) {
      console.log(`⚠ No email found for ${config.id}, skipping`);
      continue;
    }

    try {
      const inputs = await generateInputsForConfig(config, emailPath);
      results.set(config.id, inputs);

      // Save to file
      const outputPath = path.join(BENCHMARK_CONFIG.inputsDir, `${config.id}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(inputs, null, 2));

      console.log(`✓ ${config.id.padEnd(20)} -> ${path.basename(outputPath)}`);
    } catch (error: any) {
      console.log(`✗ ${config.id.padEnd(20)} -> ${error.message}`);
    }
  }

  return results;
}

/**
 * Main
 */
async function main() {
  console.log('=== Generating Circuit Inputs ===\n');

  // Check prerequisites
  if (Object.keys(PUBLIC_KEYS).length === 0) {
    console.error('No public keys found. Run generate-keys first.');
    process.exit(1);
  }

  const syntheticDir = path.join(BENCHMARK_CONFIG.emailsDir, 'synthetic');
  if (!fs.existsSync(syntheticDir) || fs.readdirSync(syntheticDir).filter(f => f.endsWith('.eml')).length === 0) {
    console.error('No synthetic emails found. Run generate-emails first.');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  // Single config mode
  const configIdx = args.findIndex(a => a === '--config');
  if (configIdx !== -1 && args[configIdx + 1]) {
    const configId = args[configIdx + 1];
    const config = getConfigById(configId);
    if (!config) {
      console.error(`Unknown config: ${configId}`);
      process.exit(1);
    }

    const emailPath = findEmailFile(config);
    if (!emailPath) {
      console.error(`No email found for ${configId}`);
      process.exit(1);
    }

    console.log(`Generating inputs for: ${configId}`);
    console.log(`Email: ${emailPath}\n`);

    const inputs = await generateInputsForConfig(config, emailPath);

    fs.mkdirSync(BENCHMARK_CONFIG.inputsDir, { recursive: true });
    const outputPath = path.join(BENCHMARK_CONFIG.inputsDir, `${configId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(inputs, null, 2));

    console.log(`\n✓ Saved to: ${outputPath}`);
    console.log(`\nInput summary:`);
    console.log(`  emailHeader length: ${inputs.emailHeader?.length || 0}`);
    console.log(`  emailBody length: ${inputs.emailBody?.length || 0}`);
    console.log(`  pubkey length: ${inputs.pubkey?.length || 0}`);
    return;
  }

  // Generate all
  console.log('Config\t\t\tOutput');
  console.log('─'.repeat(50));

  const results = await generateAllInputs();

  console.log('─'.repeat(50));
  console.log(`\nGenerated ${results.size} input files`);
  console.log(`Output directory: ${BENCHMARK_CONFIG.inputsDir}`);
}

// Run if executed directly
if (process.argv[1]?.includes('input-generator-circuit')) {
  main().catch(console.error);
}
