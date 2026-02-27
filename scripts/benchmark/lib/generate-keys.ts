/**
 * Generate RSA key pairs for DKIM signing
 *
 * Usage: bun run generate-keys
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = path.join(__dirname, '../keys');

const KEY_SIZES = [1024, 2048];

function main() {
  console.log('=== Generating RSA Key Pairs ===\n');

  // Create keys directory
  fs.mkdirSync(KEYS_DIR, { recursive: true });

  for (const bits of KEY_SIZES) {
    const privKeyPath = path.join(KEYS_DIR, `dkim_${bits}.pem`);
    const pubKeyPath = path.join(KEYS_DIR, `dkim_${bits}_pub.pem`);

    // Generate private key
    console.log(`Generating RSA-${bits} key pair...`);
    execSync(`openssl genrsa -out "${privKeyPath}" ${bits} 2>/dev/null`);

    // Extract public key
    execSync(`openssl rsa -in "${privKeyPath}" -pubout -out "${pubKeyPath}" 2>/dev/null`);

    console.log(`  ✓ ${privKeyPath}`);
    console.log(`  ✓ ${pubKeyPath}`);
  }

  console.log('\n=== Keys Generated ===');
  console.log(`\nLocation: ${KEYS_DIR}`);
  console.log('\nNext: Run `npm run generate-emails` to create signed emails');
}

main();
