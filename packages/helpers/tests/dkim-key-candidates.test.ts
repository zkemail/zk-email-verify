/**
 * DKIM key resolution: which public keys verifyDKIMSignature tries, in what order, and how it
 * treats the ZK Email Archive. Synthetic emails signed with throwaway RSA keys; every DNS-over-HTTPS
 * and archive request is answered by a stubbed fetch (no network).
 */
import { createHash, generateKeyPairSync, sign, KeyObject } from 'crypto';
import { verifyDKIMSignature, dkimSignatureDomains } from '../src/dkim';
import { DkimVerifier } from '../src/lib/mailauth/dkim-verifier';
import { writeToStream } from '../src/lib/mailauth/tools';

jest.setTimeout(20000);

const newKey = () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const p = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
  const modulus = BigInt(
    `0x${Buffer.from(privateKey.export({ format: 'jwk' }).n as string, 'base64url').toString('hex')}`,
  );
  return { privateKey, record: `v=DKIM1; k=rsa; p=${p}`, modulus };
};

// Minimal relaxed/relaxed DKIM signer (RFC 6376 3.4.2 / 3.4.4) for simple one-line headers.
function signedEmail(
  privateKey: KeyObject,
  { d = 'example.test', s = 'sel', from = 'Alice <alice@example.test>' } = {},
) {
  const headers = [
    ['From', from],
    ['To', 'bob@example.test'],
    ['Subject', 'Key rotation test'],
  ];
  const body = 'Hello from a synthetic email.\r\n';
  const bh = createHash('sha256').update(body).digest('base64');
  const dkimValue = `v=1; a=rsa-sha256; c=relaxed/relaxed; d=${d}; s=${s}; h=from:to:subject; bh=${bh}; b=`;
  const canon = (n: string, v: string) => `${n.toLowerCase()}:${v.replace(/\s+/g, ' ').trim()}`;
  const signingInput = headers.map(([n, v]) => `${canon(n, v)}\r\n`).join('') + canon('DKIM-Signature', dkimValue);
  const b = sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64');
  return `DKIM-Signature: ${dkimValue}${b}\r\n${headers.map(([n, v]) => `${n}: ${v}\r\n`).join('')}\r\n${body}`;
}

type Dns = { google?: Record<string, string>; cloudflare?: Record<string, string> };
type ArchiveRow = { domain: string; selector: string; value: string; lastSeenAt: string };

const calls = { archive: 0, dns: 0 };
const realFetch = global.fetch;

const response = (status: number, body: unknown) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    statusText: String(status),
    headers: { get: () => null },
    json: async () => body,
  }) as unknown as Response;

function stubFetch(dns: Dns, archive: Record<string, ArchiveRow[]>, opts: { rateLimit?: number } = {}) {
  calls.archive = 0;
  calls.dns = 0;
  global.fetch = jest.fn(async (input: any) => {
    const url = new URL(String(input));
    if (url.hostname === 'archive.prove.email') {
      calls.archive++;
      if (calls.archive <= (opts.rateLimit ?? 0)) {
        return response(429, {
          error: 'rate_limit_exceeded',
          details: { limit: 10, windowSeconds: 60, retryAfterSeconds: 1 },
        });
      }
      return response(200, archive[url.searchParams.get('domain') ?? ''] ?? []);
    }
    calls.dns++;
    const table = url.hostname === 'dns.google' ? dns.google : dns.cloudflare;
    const name = url.searchParams.get('name') ?? '';
    const data = table?.[name];
    return response(200, data ? { Status: 0, Answer: [{ name, type: 16, data }] } : { Status: 3, Answer: [] });
  }) as any;
}

const rows = (selector: string, ...values: string[]): ArchiveRow[] =>
  // first argument = most recently seen
  values.map((value, i) => ({ domain: 'example.test', selector, value, lastSeenAt: `2026-0${9 - i}-01T00:00:00Z` }));

const NAME = 'sel._domainkey.example.test';

afterEach(() => {
  global.fetch = realFetch;
});

describe('DKIM key candidates', () => {
  it('key rotated under the same selector: verifies with the archived key although DNS answers', async () => {
    const old = newKey();
    const current = newKey();
    stubFetch(
      { google: { [NAME]: current.record }, cloudflare: { [NAME]: current.record } },
      { 'example.test': rows('sel', current.record, old.record) },
    );

    const result = await verifyDKIMSignature(signedEmail(old.privateKey), '', true, true);

    expect(result.keySource).toBe('archive');
    expect(result.publicKey).toBe(old.modulus);
  });

  it('several archived keys for one selector: the signer is not the first record', async () => {
    const [a, b, signer] = [newKey(), newKey(), newKey()];
    stubFetch({}, { 'example.test': rows('sel', a.record, b.record, signer.record) });

    const result = await verifyDKIMSignature(signedEmail(signer.privateKey), '', true, true);

    expect(result.keySource).toBe('archive');
    expect(result.publicKey).toBe(signer.modulus);
  });

  it('Google and Cloudflare disagree: the Cloudflare key is tried too', async () => {
    const stale = newKey();
    const signer = newKey();
    stubFetch({ google: { [NAME]: stale.record }, cloudflare: { [NAME]: signer.record } }, {});

    const result = await verifyDKIMSignature(signedEmail(signer.privateKey));

    expect(result.keySource).toBe('dns');
    expect(result.publicKey).toBe(signer.modulus);
  });

  it('current DNS key verifies: the archive is not queried (10 requests/min limit)', async () => {
    const k = newKey();
    stubFetch({ google: { [NAME]: k.record } }, { 'example.test': rows('sel', newKey().record) });

    const result = await verifyDKIMSignature(signedEmail(k.privateKey), '', true, true);

    expect(calls.archive).toBe(0);
    expect(result.keySource).toBe('dns');
  });

  it('body hash mismatch: no key can fix it, so the archive is not queried', async () => {
    const k = newKey();
    const email = signedEmail(k.privateKey).replace('Hello from', 'Hullo from');
    stubFetch({ google: { [NAME]: k.record } }, { 'example.test': rows('sel', newKey().record) });

    await expect(verifyDKIMSignature(email, '', true, true)).rejects.toThrow(/body hash did not verify/);
    expect(calls.archive).toBe(0);
  });

  it('archive is queried once per verification, even with sanitizers retrying', async () => {
    const stale = newKey();
    stubFetch({ google: { [NAME]: stale.record } }, { 'example.test': rows('sel', newKey().record) });

    await expect(verifyDKIMSignature(signedEmail(newKey().privateKey), '', true, true)).rejects.toThrow(
      /Reason: bad signature/,
    );
    expect(calls.archive).toBe(1);
  });

  it('archive 429 is retried once after retryAfterSeconds instead of crashing', async () => {
    const old = newKey();
    stubFetch({ google: { [NAME]: newKey().record } }, { 'example.test': rows('sel', old.record) }, { rateLimit: 1 });

    const result = await verifyDKIMSignature(signedEmail(old.privateKey), '', true, true);

    expect(result.keySource).toBe('archive');
    expect(calls.archive).toBe(2);
  });

  it('archive still rate-limited: the error says so instead of a bare "bad signature"', async () => {
    stubFetch({ google: { [NAME]: newKey().record } }, {}, { rateLimit: 2 });

    await expect(verifyDKIMSignature(signedEmail(newKey().privateKey), '', true, true)).rejects.toThrow(
      /Reason: bad signature \(ZK Email Archive rate limit exceeded/,
    );
  });

  it('no key verifies: same error as before; revoked (empty p=) records are ignored', async () => {
    stubFetch(
      { google: { [NAME]: newKey().record } },
      { 'example.test': rows('sel', 'v=DKIM1; k=rsa; p=', newKey().record) },
    );

    await expect(verifyDKIMSignature(signedEmail(newKey().privateKey), '', true, true)).rejects.toThrow(
      'DKIM signature verification failed for domain example.test. Reason: bad signature',
    );
  });

  it('archive fallback disabled: archive never queried (unchanged default)', async () => {
    const old = newKey();
    stubFetch({ google: { [NAME]: newKey().record } }, { 'example.test': rows('sel', old.record) });

    await expect(verifyDKIMSignature(signedEmail(old.privateKey))).rejects.toThrow(/Reason: bad signature/);
    expect(calls.archive).toBe(0);
  });
});

describe('signer-domain fallback', () => {
  const ESP = 'mail._domainkey.esp.test';

  it('From: domain has no signature: opt-in fallback verifies with the signer d=', async () => {
    const k = newKey();
    const email = signedEmail(k.privateKey, { d: 'esp.test', s: 'mail' });
    stubFetch({ google: { [ESP]: k.record } }, {});

    // default: unchanged behaviour
    await expect(verifyDKIMSignature(email)).rejects.toThrow('DKIM signature not found for domain example.test');

    const result = await verifyDKIMSignature(email, '', true, false, false, { fallbackToSignerDomains: true });
    expect(result.signingDomain).toBe('esp.test');
    expect(result.keySource).toBe('dns');
  });

  it('nothing verifies: the From: domain error is reported', async () => {
    const email = signedEmail(newKey().privateKey, { d: 'esp.test', s: 'mail' });
    stubFetch({ google: { [ESP]: newKey().record } }, {});

    await expect(verifyDKIMSignature(email, '', true, false, false, { fallbackToSignerDomains: true })).rejects.toThrow(
      'DKIM signature not found for domain example.test',
    );
  });

  it('dkimSignatureDomains reads d= from folded and multiple signatures', () => {
    const raw =
      'DKIM-Signature: v=1; a=rsa-sha256;\r\n\tc=simple/simple;\r\n d=First.test; s=a; b=x\r\n' +
      'dkim-signature: v=1; d=second.test; s=b; b=y\r\nFrom: a@b.test\r\n\r\nbody';
    expect(dkimSignatureDomains(raw)).toEqual(['first.test', 'second.test']);
  });
});

describe('From alignment', () => {
  it('status.aligned compares the From: domain, not the whole address', async () => {
    const k = newKey();
    const verifier = new DkimVerifier({ resolver: async () => [k.record] } as any);
    await writeToStream(verifier, signedEmail(k.privateKey) as any);

    expect(verifier.results[0].status.result).toBe('pass');
    expect(verifier.results[0].status.aligned).toBeTruthy();
  });
});
