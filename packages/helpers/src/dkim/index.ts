import { pki } from 'node-forge';
import { DkimVerifier } from '../lib/mailauth/dkim-verifier';
import { writeToStream } from '../lib/mailauth/tools';
import sanitizers from './sanitizers';
import { resolveDNSHTTP } from './dns-over-http';
import { resolveDNSFromZKEmailArchive } from './dns-archive';

// `./mailauth` is modified version of https://github.com/postalsys/mailauth
// Main modification are including emailHeaders in the DKIM result, making it work in the browser, add types
// TODO: Fork the repo and make the changes; consider upstream to original repo

export interface DKIMVerificationResult {
  publicKey: bigint;
  signature: bigint;
  headers: Buffer;
  body: Buffer;
  bodyHash: string;
  signingDomain: string;
  selector: string;
  algo: string;
  format: string;
  modulusLength: number;
  appliedSanitization?: string;
}

const GAPPS_DOMAIN = 'gappssmtp.com';

/**
 *
 * @param email Entire email data as a string or buffer
 * @param domain Domain to verify DKIM signature for. If not provided, the domain is extracted from the `From` header
 * @param enableSanitization If true, email will be applied with various sanitization to try and pass DKIM verification
 * @param fallbackToZKEmailDNSArchive If true, ZK Email DNS Archive (https://archive.prove.email/api-explorer) will
 *                                    be used to resolve DKIM public keys if we cannot resolve from HTTP DNS
 * @param skipBodyHash If true, it bypass the dkim body hash check
 * @returns
 */
export async function verifyDKIMSignature(
  email: Buffer | string,
  domain: string = '',
  enableSanitization: boolean = true,
  fallbackToZKEmailDNSArchive: boolean = false,
  skipBodyHash = false,
): Promise<DKIMVerificationResult> {
  const emailStr = email.toString();

  let dkimResult = await tryVerifyDKIM(email, domain, fallbackToZKEmailDNSArchive, skipBodyHash);

  // If DKIM verification fails, try again after sanitizing email
  let appliedSanitization;
  if (dkimResult.status.comment === 'bad signature' && enableSanitization) {
    const results = await Promise.all(
      sanitizers.map((sanitize) =>
        tryVerifyDKIM(sanitize(emailStr), domain, fallbackToZKEmailDNSArchive, skipBodyHash).then((result) => ({
          result,
          sanitizer: sanitize.name,
        })),
      ),
    );

    const passed = results.find((r) => r.result.status.result === 'pass');

    if (passed) {
      console.log(`DKIM: Verification passed after applying sanitization "${passed.sanitizer}"`);
      dkimResult = passed.result;
      appliedSanitization = passed.sanitizer;
    }
  }

  const {
    status: { result, comment },
    signingDomain,
    publicKey,
    signature,
    status,
    body,
    bodyHash,
  } = dkimResult;

  if (result !== 'pass') {
    throw new Error(`DKIM signature verification failed for domain ${signingDomain}. Reason: ${comment}`);
  }

  const pubKeyData = pki.publicKeyFromPem(publicKey.toString());

  return {
    signature: BigInt(`0x${Buffer.from(signature, 'base64').toString('hex')}`),
    headers: status.signedHeaders,
    body,
    bodyHash,
    signingDomain: dkimResult.signingDomain,
    publicKey: BigInt(pubKeyData.n.toString()),
    selector: dkimResult.selector,
    algo: dkimResult.algo,
    format: dkimResult.format,
    modulusLength: dkimResult.modulusLength,
    appliedSanitization,
  };
}

async function tryVerifyDKIM(
  email: Buffer | string,
  domain: string = '',
  fallbackToZKEmailDNSArchive: boolean = false,
  skipBodyHash = false,
) {
  const resolver = async (name: string, type: string) => {
    try {
      const result = await resolveDNSHTTP(name, type);
      return result;
    } catch (e) {
      if (fallbackToZKEmailDNSArchive) {
        console.log('DNS over HTTP failed, falling back to ZK Email Archive');
        const result = await resolveDNSFromZKEmailArchive(name, type);
        return result;
      }
      throw e;
    }
  };

  const dkimVerifier = new DkimVerifier({
    resolver,
    skipBodyHash,
  });

  await writeToStream(dkimVerifier, email as any);

  // Extract domain from From header if not provided
  let fromDomain = domain;
  if (!fromDomain) {
    if (dkimVerifier.headerFrom.length > 1) {
      throw new Error('Multiple From header in email and domain for verification not specified');
    }

    if (dkimVerifier.headerFrom.length === 0) {
      throw new Error('From header not found or empty');
    }

    fromDomain = dkimVerifier.headerFrom[0].split('@')[1];
  }

  // First try direct match
  let dkimResult = dkimVerifier.results.find((d: any) => d.signingDomain === fromDomain);

  // Then try domains ending with fromDomain (subdomains)
  if (!dkimResult) {
    dkimResult = dkimVerifier.results.find((d: any) => d.signingDomain.endsWith(`.${fromDomain}`));
  }

  // As a last resort, try Google Apps domain
  if (!dkimResult) {
    dkimResult = dkimVerifier.results.find((d: any) => d.signingDomain.includes(GAPPS_DOMAIN));
  }

  if (!dkimResult) {
    const availableDomains = dkimVerifier.results.map((d: any) => d.signingDomain).join(', ');
    throw new Error(
      `DKIM signature not found for domain ${fromDomain}. Available domains: [${availableDomains || 'none'}]`,
    );
  }

  dkimResult.headers = dkimVerifier.headers;

  return dkimResult;
}
