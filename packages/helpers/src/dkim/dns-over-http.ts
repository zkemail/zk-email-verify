import { CustomError } from '../lib/mailauth/tools';

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

export async function resolveDNSHTTP(name: string, type: string) {
  if (type !== 'TXT') {
    throw new Error(`DNS over HTTP: Only type TXT is supported, got ${type}`);
  }

  let dkimRecord: string | null = null;
  let googleError: CustomError | null = null;
  let cloudflareError: CustomError | null = null;

  // Try Google DNS first
  try {
    const googleResult = await DoH.resolveDKIMPublicKey(name, DoHServer.Google);
    if (googleResult) {
      const regex = /p=([^;]*)/;
      const match = regex.exec(googleResult);
      if (match && match[1] !== '') {
        dkimRecord = googleResult;
      }
    }
  } catch (error) {
    googleError = new CustomError('No DKIM record found in Google', 'ENODATA');
  }

  // Try Cloudflare as well
  try {
    const cloudflareResult = await DoH.resolveDKIMPublicKey(name, DoHServer.Cloudflare);

    // If we have both results, log if there's a mismatch
    if (dkimRecord && cloudflareResult && dkimRecord !== cloudflareResult) {
      console.warn('DKIM record mismatch between Google and Cloudflare! Using Google result.');
    }

    // If we don't have a Google result, use Cloudflare's result
    if (!dkimRecord && cloudflareResult) {
      const regex = /p=([^;]*)/;
      const match = regex.exec(cloudflareResult);
      if (match && match[1] !== '') {
        dkimRecord = cloudflareResult;
      }
    }
  } catch (error) {
    cloudflareError = new CustomError('No DKIM record found in Cloudflare', 'ENODATA');
  }

  //
  if (!dkimRecord) {
    if (googleError && cloudflareError) {
      throw new Error(
        `Failed to fetch DKIM record from both providers. Google: ${googleError},\n Cloudflare: ${cloudflareError}`,
      );
    } else if (!dkimRecord) {
      throw new CustomError('No valid DKIM record found (empty or missing p= value)', 'ENODATA');
    }
  }

  return [dkimRecord];
}
