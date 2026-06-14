/**
 * Generate DKIM-signed synthetic emails for benchmarking
 *
 * Usage: npx tsx lib/generate-signed-emails.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = path.join(__dirname, '../keys');
const OUTPUT_DIR = path.join(__dirname, '../emails/synthetic');

// DKIM configuration
const DOMAIN = 'benchmark.test';
const SELECTOR = 'dkim';

interface EmailConfig {
  bodySize: number;
  headerSize: number;
  rsaBits: 1024 | 2048;
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
 * Canonicalize body using "relaxed" algorithm (RFC 6376)
 */
function canonicalizeBodyRelaxed(body: string): string {
  let result = body
    .split('\r\n')
    .map(line => {
      return line
        .replace(/\s+/g, ' ')  // Reduce whitespace sequences
        .replace(/\s+$/, '');   // Remove trailing whitespace
    })
    .join('\r\n');

  // Remove trailing empty lines
  result = result.replace(/(\r\n)+$/, '');

  // Body must end with CRLF (RFC 6376 Section 3.4.4)
  if (result.length > 0) {
    result += '\r\n';
  }

  return result;
}

/**
 * Generate DKIM signature header
 */
function signEmail(
  headers: string,
  body: string,
  privateKey: string,
  signedHeaders: string[]
): string {
  // Canonicalize body and compute hash
  const canonBody = canonicalizeBodyRelaxed(body);
  const bodyHash = crypto
    .createHash('sha256')
    .update(canonBody)
    .digest('base64');

  // Create DKIM-Signature header template (without b= value)
  const timestamp = Math.floor(Date.now() / 1000);
  const dkimTemplate = [
    `v=1`,
    `a=rsa-sha256`,
    `c=relaxed/relaxed`,
    `d=${DOMAIN}`,
    `s=${SELECTOR}`,
    `t=${timestamp}`,
    `bh=${bodyHash}`,
    `h=${signedHeaders.join(':')}`,
    `b=`
  ].join('; ');

  const dkimHeader = `DKIM-Signature: ${dkimTemplate}`;

  // Extract headers to sign (in order specified)
  const headerLines = headers.split('\r\n');
  const headersToSign: string[] = [];

  for (const hName of signedHeaders) {
    const found = headerLines.find(line =>
      line.toLowerCase().startsWith(hName.toLowerCase() + ':')
    );
    if (found) {
      headersToSign.push(found);
    }
  }

  // Add DKIM-Signature header itself (for signing)
  headersToSign.push(dkimHeader);

  // Canonicalize headers for signing
  const canonHeaders = canonicalizeHeadersRelaxed(headersToSign.join('\r\n'));

  // Sign with RSA-SHA256
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(canonHeaders);
  const signature = sign.sign(privateKey, 'base64');

  // Return complete DKIM-Signature header
  return `DKIM-Signature: ${dkimTemplate}${signature}`;
}

/**
 * Generate email body of specified size
 */
function generateBody(size: number): string {
  const words = [
    'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
    'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor',
    'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'
  ];

  let body = '';
  let lineLen = 0;

  while (body.length < size) {
    const word = words[Math.floor(Math.random() * words.length)];
    if (lineLen + word.length > 76) {
      body += '\r\n';
      lineLen = 0;
    } else if (lineLen > 0) {
      body += ' ';
      lineLen++;
    }
    body += word;
    lineLen += word.length;
  }

  // Trim to size, then strip any trailing whitespace to avoid
  // canonicalization mismatch between custom signer and mailauth.
  // mailauth (stream parser) won't strip trailing space if no CRLF follows.
  return body.substring(0, size).replace(/\s+$/, '');
}

/**
 * Generate email headers of approximately specified size
 */
function generateHeaders(targetSize: number, messageId: string): string {
  const baseHeaders = [
    `From: benchmark@${DOMAIN}`,
    `To: test@example.com`,
    `Subject: Benchmark Test Email`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${messageId}@${DOMAIN}>`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
  ];

  let headers = baseHeaders.join('\r\n');

  // Add padding headers to reach target size
  let padCount = 0;
  while (headers.length < targetSize - 50) {
    const padding = 'X'.repeat(Math.min(60, targetSize - headers.length - 30));
    headers += `\r\nX-Padding-${padCount}: ${padding}`;
    padCount++;
  }

  return headers;
}

/**
 * Generate a complete DKIM-signed email
 */
function generateSignedEmail(config: EmailConfig): string {
  const messageId = crypto.randomBytes(16).toString('hex');
  const keyPath = path.join(KEYS_DIR, `dkim_${config.rsaBits}.pem`);

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Private key not found: ${keyPath}`);
  }

  const privateKey = fs.readFileSync(keyPath, 'utf-8');

  // Generate email parts (already using CRLF internally)
  const headers = generateHeaders(config.headerSize, messageId);
  const body = generateBody(config.bodySize);

  // Sign headers
  const signedHeaders = ['from', 'to', 'subject', 'date', 'message-id'];
  const dkimSignature = signEmail(headers, body, privateKey, signedHeaders);

  // Combine into full email with proper CRLF
  return `${dkimSignature}\r\n${headers}\r\n\r\n${body}`;
}

/**
 * Write email to file preserving CRLF line endings
 * RFC 5322 requires CRLF for email messages
 */
function writeEmailFile(filePath: string, content: string): void {
  // Ensure CRLF line endings (RFC 5322 compliant)
  const normalizedContent = content.replace(/\r?\n/g, '\r\n');
  // Write as Buffer to preserve binary content exactly
  fs.writeFileSync(filePath, Buffer.from(normalizedContent, 'utf-8'));
}

/**
 * Main: Generate all configured emails
 */
async function main() {
  console.log('=== Generating DKIM-Signed Synthetic Emails ===\n');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Configurations to generate
  const configs: EmailConfig[] = [
    // Small body sizes for SCALE-MIN and SCALE-HEADER-HEAVY
    { bodySize: 128, headerSize: 384, rsaBits: 2048 },
    { bodySize: 192, headerSize: 448, rsaBits: 2048 },
    // Size variations with RSA-2048
    { bodySize: 256, headerSize: 256, rsaBits: 2048 },
    { bodySize: 512, headerSize: 512, rsaBits: 2048 },
    { bodySize: 768, headerSize: 640, rsaBits: 2048 },
    { bodySize: 1024, headerSize: 1024, rsaBits: 2048 },
    { bodySize: 2048, headerSize: 1024, rsaBits: 2048 },
    { bodySize: 4096, headerSize: 2048, rsaBits: 2048 },

    // RSA key size variations
    { bodySize: 768, headerSize: 640, rsaBits: 1024 },
  ];

  console.log('Config\t\t\tRSA\tHeaders\tBody\tFile');
  console.log('─'.repeat(70));

  for (const config of configs) {
    try {
      const email = generateSignedEmail(config);
      const filename = `email_h${config.headerSize}_b${config.bodySize}_rsa${config.rsaBits}.eml`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      writeEmailFile(outputPath, email);

      console.log(`Generated\t\t${config.rsaBits}\t${config.headerSize}\t${config.bodySize}\t${filename}`);
    } catch (err: any) {
      console.error(`Failed ${config.rsaBits}/${config.headerSize}/${config.bodySize}: ${err.message}`);
    }
  }

  console.log('\n=== Generation Complete ===');
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);

  // Generate DNS TXT records for reference
  console.log('\n=== DNS TXT Records (for reference) ===\n');

  for (const bits of [1024, 2048] as const) {
    const pubKeyPath = path.join(KEYS_DIR, `dkim_${bits}_pub.pem`);
    if (fs.existsSync(pubKeyPath)) {
      const pubKey = fs.readFileSync(pubKeyPath, 'utf-8')
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');

      console.log(`${SELECTOR}._domainkey.${DOMAIN} (RSA-${bits}):`);
      console.log(`  v=DKIM1; k=rsa; p=${pubKey}\n`);
    }
  }
}

main().catch(console.error);
