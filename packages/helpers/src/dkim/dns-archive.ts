import { CustomError } from '../lib/mailauth/tools';

const ZKEMAIL_DNS_ARCHIVER_API = 'https://archive.prove.email/api/key/domain';

export async function resolveDNSFromZKEmailArchive(name: string, type: string) {
  if (type !== 'TXT') {
    throw new Error(`ZK Email Archive only supports TXT records - got ${type}`);
  }

  // Get domain from full dns record name - $selector._domainkey.$domain.com
  const domain = name.split('.').slice(2).join('.');
  const selector = name.split('.')[0];

  const queryUrl = new URL(ZKEMAIL_DNS_ARCHIVER_API);
  queryUrl.searchParams.set('domain', domain);

  const resp = await fetch(queryUrl);

  if (!resp.ok) {
    throw new CustomError(`ZK Email Archive API returned ${resp.status}: ${resp.statusText}`, 'ESERVFAIL');
  }

  const data = await resp.json();

  const dkimRecords = data.filter((record: any) => record.selector === selector);

  if (dkimRecords.length === 0) {
    throw new CustomError(
      `DKIM record not found for domain ${domain} and selector ${selector} in ZK Email Archive.`,
      'ENODATA',
    );
  }

  return dkimRecords.map((record: any) => record.value);
}
