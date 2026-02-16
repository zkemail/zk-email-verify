/**
 * Verify DKIM signatures of generated emails
 *
 * Usage: npx tsx lib/verify-emails.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = path.join(__dirname, '../keys');
const EMAILS_DIR = path.join(__dirname, '../emails/synthetic');

interface DKIMHeader {
  v: string;
  a: string;
  c: string;
  d: string;
  s: string;
  t?: string;
  bh: string;
  h: string;
  b: string;
}

/**
 * Parse DKIM-Signature header
 */
function parseDKIMSignature(dkimLine: string): DKIMHeader {
  const value = dkimLine.replace(/^DKIM-Signature:\s*/i, '');
  const parts: Record<string, string> = {};

  // Handle multi-line signatures
  const normalized = value.replace(/\r?\n\s+/g, '');

  for (const part of normalized.split(/;\s*/)) {
    const [key, ...vals] = part.split('=');
    if (key && vals.length) {
      parts[key.trim()] = vals.join('=').trim();
    }
  }

  return parts as unknown as DKIMHeader;
}

/**
 * Canonicalize headers using "relaxed" algorithm (RFC 6376 Section 3.4.2)
 */
function canonicalizeHeadersRelaxed(headers: string): string {
  return headers
    .split('\r\n')
    .map(line => {
      // Reduce all whitespace to single space
      line = line.replace(/\s+/g, ' ').trim();

      // Separate name and value at colon
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return line;

      const name = line.substring(0, colonIdx).trim().toLowerCase();
      const value = line.substring(colonIdx + 1).trim();

      return `${name}:${value}`;
    })
    .join('\r\n');
}

/**
 * Canonicalize body using "relaxed" algorithm (RFC 6376 Section 3.4.4)
 */
function canonicalizeBodyRelaxed(body: string): string {
  let result = body
    .split('\r\n')
    .map(line => {
      return line
        .replace(/\s+/g, ' ')  // Reduce whitespace to single space
        .replace(/\s+$/, '');   // Remove trailing whitespace
    })
    .join('\r\n');

  // Remove trailing empty lines
  result = result.replace(/(\r\n)+$/, '');

  // Body must end with CRLF (RFC 6376)
  if (result.length > 0) {
    result += '\r\n';
  }

  return result;
}

/**
 * Verify DKIM signature of an email
 */
function verifyDKIM(emailContent: string, publicKeyPem: string): {
  valid: boolean;
  bodyHashValid: boolean;
  signatureValid: boolean;
  error?: string;
} {
  try {
    // Split email into headers and body
    const parts = emailContent.split(/\r?\n\r?\n/);
    const headerSection = parts[0];
    const body = parts.slice(1).join('\r\n\r\n');

    // Normalize line endings
    const normalizedHeaders = headerSection.replace(/\r?\n/g, '\r\n');
    const normalizedBody = body.replace(/\r?\n/g, '\r\n');

    // Find DKIM-Signature header
    const headerLines = normalizedHeaders.split('\r\n');
    const dkimLine = headerLines.find(l => l.toLowerCase().startsWith('dkim-signature:'));

    if (!dkimLine) {
      return { valid: false, bodyHashValid: false, signatureValid: false, error: 'No DKIM-Signature found' };
    }

    const dkim = parseDKIMSignature(dkimLine);

    // Verify body hash
    const canonBody = canonicalizeBodyRelaxed(normalizedBody);
    const computedBodyHash = crypto.createHash('sha256').update(canonBody).digest('base64');
    const bodyHashValid = computedBodyHash === dkim.bh;

    // Get headers to verify
    const signedHeaderNames = dkim.h.split(':').map(h => h.trim().toLowerCase());
    const headersToVerify: string[] = [];

    for (const hName of signedHeaderNames) {
      const found = headerLines.find(line =>
        line.toLowerCase().startsWith(hName + ':')
      );
      if (found) {
        headersToVerify.push(found);
      }
    }

    // Add DKIM-Signature header (without b= value)
    const dkimWithoutSig = dkimLine.replace(/b=[^;]+/, 'b=');
    headersToVerify.push(dkimWithoutSig);

    // Canonicalize headers for verification
    const canonHeaders = canonicalizeHeadersRelaxed(headersToVerify.join('\r\n'));

    // Verify signature
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(canonHeaders);
    const signatureValid = verify.verify(publicKeyPem, dkim.b, 'base64');

    return {
      valid: bodyHashValid && signatureValid,
      bodyHashValid,
      signatureValid,
    };
  } catch (err: any) {
    return {
      valid: false,
      bodyHashValid: false,
      signatureValid: false,
      error: err.message,
    };
  }
}

/**
 * Main: Verify all generated emails
 */
async function main() {
  console.log('=== Verifying DKIM Signatures ===\n');

  if (!fs.existsSync(EMAILS_DIR)) {
    console.error(`Emails directory not found: ${EMAILS_DIR}`);
    console.error('Run generate-emails first.');
    process.exit(1);
  }

  const files = fs.readdirSync(EMAILS_DIR).filter(f => f.endsWith('.eml'));

  if (files.length === 0) {
    console.error('No .eml files found. Run generate-emails first.');
    process.exit(1);
  }

  console.log('File\t\t\t\t\t\tBody Hash\tSignature\tStatus');
  console.log('─'.repeat(90));

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const emailPath = path.join(EMAILS_DIR, file);
    const emailContent = fs.readFileSync(emailPath, 'utf-8');

    // Determine RSA key size from filename
    const rsaMatch = file.match(/rsa(\d+)/);
    const rsaBits = rsaMatch ? rsaMatch[1] : '2048';
    const pubKeyPath = path.join(KEYS_DIR, `dkim_${rsaBits}_pub.pem`);

    if (!fs.existsSync(pubKeyPath)) {
      console.log(`${file.padEnd(40)}\t-\t\t-\t\tMISSING KEY`);
      failed++;
      continue;
    }

    const publicKey = fs.readFileSync(pubKeyPath, 'utf-8');
    const result = verifyDKIM(emailContent, publicKey);

    const bodyStatus = result.bodyHashValid ? 'OK' : 'FAIL';
    const sigStatus = result.signatureValid ? 'OK' : 'FAIL';
    const status = result.valid ? 'PASS' : 'FAIL';

    console.log(`${file.padEnd(40)}\t${bodyStatus}\t\t${sigStatus}\t\t${status}`);

    if (result.valid) {
      passed++;
    } else {
      failed++;
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  }

  console.log('─'.repeat(90));
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

main().catch(console.error);
