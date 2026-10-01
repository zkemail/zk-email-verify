import { CustomError } from '../lib/mailauth/tools';
import { dkimRecordPublicKey } from './dns-archive';

// DoH servers list
export enum DoHServer {
  // Google Public DNS
  Google = 'https://dns.google/resolve',
  // Cloudflare DNS
  Cloudflare = 'https://cloudflare-dns.com/dns-query',
}

/**
 * DNS over HTTPS (DoH) resolver
 *
 * @export
 * @class DoH
 */
export class DoH {
  // DNS response codes
  static DoHStatusNoError = 0;

  // DNS RR types
  static DoHTypeTXT = 16;

  /**
   * Resolve DKIM public key from DNS
   *
   * @static
   * @param {string} name DKIM record name (e.g. 20230601._domainkey.gmail.com)
   * @param {string} dnsServerURL DNS over HTTPS API URL
   * @return {*}  {(Promise<string | null>)} DKIM public key or null if not found
   * @memberof DoH
   */
  public static async resolveDKIMPublicKey(name: string, dnsServerURL: string): Promise<string | null> {
    let cleanURL = dnsServerURL;
    if (!cleanURL.startsWith('https://')) {
      cleanURL = `https://${cleanURL}`;
    }
    if (cleanURL.endsWith('/')) {
      cleanURL = cleanURL.slice(0, -1);
    }

    const queryUrl = new URL(cleanURL);
    queryUrl.searchParams.set('name', name);
    queryUrl.searchParams.set('type', DoH.DoHTypeTXT.toString());

    const resp = await fetch(queryUrl, {
      headers: {
        accept: 'application/dns-json',
      },
    });

    if (resp.status === 200) {
      const out = await resp.json();
      if (typeof out === 'object' && out !== null && 'Status' in out && 'Answer' in out) {
        const result = out as DoHResponse;
        if (result.Status === DoH.DoHStatusNoError && result.Answer.length > 0) {
          for (const ans of result.Answer) {
            if (ans.type === DoH.DoHTypeTXT) {
              let dkimRecord = ans.data;
              /*
                  Remove all double quotes and spaces around them
                  Some DNS providers wrap TXT records in double quotes, 
                  and others like Cloudflare may include them. According to 
                  TXT (potentially multi-line) and DKIM (Base64 data) standards,
                  we can directly remove all double quotes from the DKIM public key.
              */
              dkimRecord = dkimRecord.replace(/\s*"\s*/g, '');
              return dkimRecord;
            }
          }
        }
      }
    }
    return null;
  }
}

interface DoHResponse {
  Status: number; // NOERROR - Standard DNS response code (32 bit integer).
  TC: boolean; // Whether the response is truncated
  AD: boolean; // Whether all response data was validated with DNSSEC
  CD: boolean; // Whether the client asked to disable DNSSEC
  Question: Question[];
  Answer: Answer[];
  Comment: string;
}

interface Question {
  name: string; // FQDN with trailing dot
  type: number; // A - Standard DNS RR type. 5:CNAME, 16:TXT
}

interface Answer {
  name: string; // Always matches name in the Question section
  type: number; // A - Standard DNS RR type. 5:CNAME, 16:TXT
  TTL: number; // Record's time-to-live in seconds
  data: string; // Record data
}

/**
 * DKIM TXT records for `name` from Google and Cloudflare DNS-over-HTTPS, Google's first.
 *
 * REASON: this used to return only Google's answer and merely log when Cloudflare disagreed.
 * During a key rotation (or with split-horizon / stale caches) the two resolvers can serve
 * different keys, and the one that signed the message may be Cloudflare's. Both are returned so
 * the verifier tries each. Records without a key (missing or empty p=, i.e. revoked) are dropped,
 * and a record served by both resolvers is returned once.
 */
export async function resolveDNSHTTP(name: string, type: string) {
  if (type !== 'TXT') {
    throw new Error(`DNS over HTTP: Only type TXT is supported, got ${type}`);
  }

  const lookup = async (server: DoHServer) => {
    try {
      return { record: await DoH.resolveDKIMPublicKey(name, server), error: null };
    } catch (error) {
      // REASON: one resolver being down must not hide the key the other one serves.
      return { record: null, error };
    }
  };
  const [google, cloudflare] = await Promise.all([lookup(DoHServer.Google), lookup(DoHServer.Cloudflare)]);

  const records: string[] = [];
  const seen = new Set<string>();
  for (const { record } of [google, cloudflare]) {
    const p = record ? dkimRecordPublicKey(record) : '';
    if (record && p && !seen.has(p)) {
      seen.add(p);
      records.push(record);
    }
  }

  if (records.length === 0) {
    if (google.error && cloudflare.error) {
      throw new Error(
        `Failed to fetch DKIM record from both providers. Google: ${google.error},\n Cloudflare: ${cloudflare.error}`,
      );
    }
    throw new CustomError('No valid DKIM record found (empty or missing p= value)', 'ENODATA');
  }

  return records;
}
