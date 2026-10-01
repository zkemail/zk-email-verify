import { pki } from 'node-forge';
import { DkimVerifier } from '../lib/mailauth/dkim-verifier';
import { writeToStream, CustomError } from '../lib/mailauth/tools';
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
  /**
   * Where the verifying key came from: 'dns' (Google or Cloudflare DNS-over-HTTPS) or 'archive'
   * (ZK Email Archive, i.e. a key the domain published earlier, typically since rotated).
   */
  keySource?: DKIMKeySource;
}

export type DKIMKeySource = 'dns' | 'archive';

export interface VerifyDKIMSignatureOptions {
  /**
   * When `domain` is not given and the From: domain has no DKIM signature that verifies, try the
   * d= domain of every other DKIM-Signature in the message (e.g. an email service provider such
   * as d=sendgrid.net, or a subdomain such as d=email.example.com). The returned `signingDomain`
   * then differs from the From: domain; callers that need From: alignment must check it.
   * Default false (previous behaviour: only the From: domain is accepted).
   */
  fallbackToSignerDomains?: boolean;
}

type Resolver = (name: string, type: string) => Promise<string[]>;

// NOTE: these failures depend on the message, not on the key, so no other key can fix them;
// don't spend an archive request (10/min per IP) on them.
const KEY_INDEPENDENT_FAILURE = /body hash|body length/i;

/**
 *
 * @param email Entire email data as a string or buffer
 * @param domain Domain to verify DKIM signature for. If not provided, the domain is extracted from the `From` header
 * @param enableSanitization If true, email will be applied with various sanitization to try and pass DKIM verification
 * @param fallbackToZKEmailDNSArchive If true, ZK Email DNS Archive (https://archive.prove.email/api-explorer) will
 *                                    be used to resolve DKIM public keys when the keys currently in DNS don't
 *                                    verify the signature (missing, or rotated under the same selector)
 * @param skipBodyHash If true, it bypass the dkim body hash check
 * @param options See VerifyDKIMSignatureOptions
 * @returns
 */
export async function verifyDKIMSignature(
  email: Buffer | string,
  domain: string = '',
  enableSanitization: boolean = true,
  fallbackToZKEmailDNSArchive: boolean = false,
  skipBodyHash = false,
  options: VerifyDKIMSignatureOptions = {},
): Promise<DKIMVerificationResult> {
  if (domain || !options.fallbackToSignerDomains) {
    return verifyDKIMSignatureForDomain(email, domain, enableSanitization, fallbackToZKEmailDNSArchive, skipBodyHash);
  }

  // REASON: much legitimate mail is signed only by the sending service's domain (or a subdomain),
  // not the From: domain. Try the From: domain first, then each signer's d=; if nothing verifies,
  // report the From: domain's error as before.
  let firstError: unknown;
  try {
    return await verifyDKIMSignatureForDomain(email, '', enableSanitization, fallbackToZKEmailDNSArchive, skipBodyHash);
  } catch (e) {
    firstError = e;
  }
  for (const signer of dkimSignatureDomains(email)) {
    try {
      return await verifyDKIMSignatureForDomain(
        email,
        signer,
        enableSanitization,
        fallbackToZKEmailDNSArchive,
        skipBodyHash,
      );
    } catch {
      // try the next signature
    }
  }
  throw firstError;
}

/** Unique d= domains (lowercased) of every DKIM-Signature header in a raw message, in order. */
export function dkimSignatureDomains(email: Buffer | string): string[] {
  const text = email.toString();
  const headerEnd = text.search(/\r?\n\r?\n/);
  // Unfold: a line break followed by SP/HTAB continues the previous header field.
  const headers = (headerEnd >= 0 ? text.slice(0, headerEnd) : text).replace(/\r?\n[ \t]+/g, ' ');
  const out: string[] = [];
  for (const line of headers.split(/\r?\n/)) {
    if (!/^dkim-signature\s*:/i.test(line)) continue;
    const tags = line.slice(line.indexOf(':') + 1);
    const d = /(?:^|;)\s*d\s*=\s*([^;\s]+)/i.exec(tags)?.[1]?.toLowerCase();
    if (d && !out.includes(d)) out.push(d);
  }
  return out;
}

async function verifyDKIMSignatureForDomain(
  email: Buffer | string,
  domain: string,
  enableSanitization: boolean,
  fallbackToZKEmailDNSArchive: boolean,
  skipBodyHash: boolean,
): Promise<DKIMVerificationResult> {
  // Phase 1 uses the keys currently in DNS. Phase 2 (only with fallbackToZKEmailDNSArchive, and
  // only if phase 1 failed for a key-related reason) uses the archived keys for the selector.
  // REASON: previously the archive was consulted either only when DNS had no record at all
  // (a key rotated under the same selector then failed with "bad signature") or for every email
  // in parallel with DNS, which quickly exhausts the archive's 10 requests/min per IP limit.
  const dnsResolver = memoizeResolver((name, type) => resolveDNSHTTP(name, type));
  let dkimResult = await verifyWithSanitization(email, domain, enableSanitization, skipBodyHash, dnsResolver);
  let keySource: DKIMKeySource = 'dns';

  if (
    dkimResult.result.status.result !== 'pass' &&
    fallbackToZKEmailDNSArchive &&
    !KEY_INDEPENDENT_FAILURE.test(dkimResult.result.status.comment ?? '')
  ) {
    let archiveError: unknown;
    const archiveResolver = memoizeResolver(async (name: string, type: string) => {
      try {
        return await resolveDNSFromZKEmailArchive(name, type);
      } catch (e) {
        archiveError = e;
        throw e;
      }
    });
    const archived = await verifyWithSanitization(email, domain, enableSanitization, skipBodyHash, archiveResolver);
    if (archived.result.status.result === 'pass') {
      dkimResult = archived;
      keySource = 'archive';
    } else if (archiveError === undefined) {
      // An archived key was actually tried; its failure is the more informative one.
      dkimResult = archived;
    } else if (/rate limit/i.test(String((archiveError as Error)?.message))) {
      // NOTE: say so, rather than a bare "bad signature" that looks like a forged email.
      dkimResult.result.status.comment = `${dkimResult.result.status.comment} (${(archiveError as Error).message})`;
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
  } = dkimResult.result;

  if (result !== 'pass') {
    throw new Error(`DKIM signature verification failed for domain ${signingDomain}. Reason: ${comment}`);
  }

  const pubKeyData = pki.publicKeyFromPem(publicKey.toString());

  return {
    signature: BigInt(`0x${Buffer.from(signature, 'base64').toString('hex')}`),
    headers: status.signedHeaders,
    body,
    bodyHash,
    signingDomain,
    publicKey: BigInt(pubKeyData.n.toString()),
    selector: dkimResult.result.selector,
    algo: dkimResult.result.algo,
    format: dkimResult.result.format,
    modulusLength: dkimResult.result.modulusLength,
    appliedSanitization: dkimResult.appliedSanitization,
    keySource,
  };
}

/**
 * Resolve each name once per phase. REASON: the sanitizers below re-run verification up to N
 * times in parallel; without this every run would repeat the DNS / archive requests (and N
 * parallel archive requests alone can hit its rate limit).
 */
function memoizeResolver(resolve: Resolver): Resolver {
  const cache = new Map<string, Promise<string[]>>();
  return (name, type) => {
    const key = `${type}:${name.toLowerCase()}`;
    if (!cache.has(key)) cache.set(key, resolve(name, type));
    return cache.get(key)!;
  };
}

async function verifyWithSanitization(
  email: Buffer | string,
  domain: string,
  enableSanitization: boolean,
  skipBodyHash: boolean,
  resolver: Resolver,
): Promise<{ result: any; appliedSanitization?: string }> {
  const emailStr = email.toString();
  const dkimResult = await tryVerifyDKIM(email, domain, resolver, skipBodyHash);

  // If DKIM verification fails, try again after sanitizing email
  if (dkimResult.status.comment === 'bad signature' && enableSanitization) {
    const results = await Promise.all(
      sanitizers.map((sanitize) =>
        tryVerifyDKIM(sanitize(emailStr), domain, resolver, skipBodyHash).then((result) => ({
          result,
          sanitizer: sanitize.name,
        })),
      ),
    );

    const passed = results.find((r) => r.result.status.result === 'pass');

    if (passed) {
      console.log(`DKIM: Verification passed after applying sanitization "${passed.sanitizer}"`);
      return { result: passed.result, appliedSanitization: passed.sanitizer };
    }
  }

  return { result: dkimResult };
}

async function tryVerifyDKIM(email: Buffer | string, domain: string, resolve: Resolver, skipBodyHash: boolean) {
  const resolver = async (name: string, type: string) => {
    let keys: string[] = [];
    try {
      keys = await resolve(name, type);
    } catch (e) {
      // Lookup failed; reported to mailauth as "no key" below.
    }

    if (keys.length === 0) {
      throw new CustomError('No DNS records found from any source', 'ENODATA');
    }

    return keys;
  };

  const dkimVerifier = new DkimVerifier({
    resolver,
    skipBodyHash,
  });

  await writeToStream(dkimVerifier, email as any);

  let domainToVerifyDKIM = domain;
  if (!domainToVerifyDKIM) {
    if (dkimVerifier.headerFrom.length > 1) {
      throw new Error('Multiple From header in email and domain for verification not specified');
    }

    // NOTE: the domain is after the LAST "@"; a quoted local part may itself contain "@".
    const from = dkimVerifier.headerFrom[0] ?? '';
    domainToVerifyDKIM = from.slice(from.lastIndexOf('@') + 1);
  }

  const dkimResult = dkimVerifier.results.find((d: any) => d.signingDomain === domainToVerifyDKIM);

  if (!dkimResult) {
    throw new Error(`DKIM signature not found for domain ${domainToVerifyDKIM}`);
  }

  dkimResult.headers = dkimVerifier.headers;

  return dkimResult;
}
