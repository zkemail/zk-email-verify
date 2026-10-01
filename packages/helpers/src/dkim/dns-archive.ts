import { CustomError } from '../lib/mailauth/tools';

const ZKEMAIL_DNS_ARCHIVER_API = 'https://archive.prove.email/api/key/domain';

// NOTE: archive.prove.email allows 10 requests per minute per IP. Over the limit it answers
// HTTP 429 with a JSON *object* (e.g. { error, details: { retryAfterSeconds } }), not the usual
// array of records. We wait for the advertised retry-after once, but never longer than this, so a
// caller isn't blocked for a whole minute.
const MAX_RETRY_AFTER_SECONDS = 15;

interface ArchiveRecord {
  domain?: string;
  selector: string;
  value: string;
  lastSeenAt?: string;
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** The p= value of a DKIM TXT record, whitespace removed ('' when absent or revoked). */
export function dkimRecordPublicKey(record: string): string {
  const match = /(?:^|;)\s*p\s*=\s*([^;]*)/i.exec(record);
  return match ? match[1].replace(/\s+/g, '') : '';
}

function retryAfterSeconds(resp: Response, body: any): number {
  const fromBody = Number(body?.details?.retryAfterSeconds ?? body?.retryAfterSeconds);
  if (fromBody > 0) return fromBody;
  const fromHeader = Number(resp.headers?.get?.('retry-after'));
  return fromHeader > 0 ? fromHeader : NaN;
}

async function fetchArchiveRecords(domain: string): Promise<ArchiveRecord[]> {
  const queryUrl = new URL(ZKEMAIL_DNS_ARCHIVER_API);
  queryUrl.searchParams.set('domain', domain);

  for (let attempt = 0; ; attempt++) {
    const resp = await fetch(queryUrl);
    const body = await resp.json().catch(() => null);

    if (resp.ok && Array.isArray(body)) {
      return body as ArchiveRecord[];
    }

    const wait = retryAfterSeconds(resp, body);
    if (resp.status === 429 && attempt === 0 && wait <= MAX_RETRY_AFTER_SECONDS) {
      await sleep(wait * 1000);
      continue;
    }

    // REASON: a 429 (or any non-array body) used to reach `data.filter(...)` / `data.find(...)`
    // and crash with "data.find is not a function", or was swallowed so the caller only saw a
    // misleading "bad signature". Report what actually happened.
    if (resp.status === 429) {
      throw new CustomError(
        'ZK Email Archive rate limit exceeded (10 requests/min per IP); retry in a minute',
        'ESERVFAIL',
      );
    }
    if (!resp.ok) {
      throw new CustomError(`ZK Email Archive API returned ${resp.status}: ${resp.statusText}`, 'ESERVFAIL');
    }
    throw new CustomError('ZK Email Archive API returned an unexpected response (not a list of records)', 'ESERVFAIL');
  }
}

/**
 * Every archived DKIM record for `<selector>._domainkey.<domain>`, most recently seen first.
 * Revoked records (empty p=) and duplicates (same p=) are dropped.
 *
 * REASON: the archive often holds several keys for one selector (rotations that reused the
 * selector). All of them are returned so the verifier can try each; the most recently seen key is
 * the most likely signer, so it goes first.
 */
export async function resolveDNSFromZKEmailArchive(name: string, type: string) {
  if (type !== 'TXT') {
    throw new Error(`ZK Email Archive only supports TXT records - got ${type}`);
  }

  // Get domain from full dns record name - $selector._domainkey.$domain.com
  const domain = name.split('.').slice(2).join('.');
  const selector = name.split('.')[0];

  const data = await fetchArchiveRecords(domain);

  const seen = new Set<string>();
  const dkimRecords = data
    .filter((record) => record && record.selector === selector && typeof record.value === 'string')
    .sort((a, b) => String(b.lastSeenAt ?? '').localeCompare(String(a.lastSeenAt ?? '')))
    .map((record) => record.value)
    .filter((value) => {
      const p = dkimRecordPublicKey(value);
      if (!p || seen.has(p)) return false;
      seen.add(p);
      return true;
    });

  if (dkimRecords.length === 0) {
    throw new CustomError(
      `DKIM record not found for domain ${domain} and selector ${selector} in ZK Email Archive.`,
      'ENODATA',
    );
  }

  return dkimRecords;
}
