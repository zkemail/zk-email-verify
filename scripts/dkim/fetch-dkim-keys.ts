import fs from "fs";
import path from "path";
import { bigIntToChunkedBytes } from "@zk-email/helpers/src/binary-format";
import { getDomainKeys, poseidonKeyHash } from "./core";

require("dotenv").config();

// Phase 1 of the DKIM registry update flow: fetch each domain's live DKIM
// keys from DNS and hash them the same way the registry stores keys. No
// chain interaction, no private key required. Writes debug/handoff artifacts
// under ./out for update-dkim-registry to read back in:
//   dkim-keys.json          domain -> [pubkey modulus (decimal)]
//   dkim-keys-chunked.json  domain -> [pubkey as 121x17 chunks] (EmailVerifier input)
//   dkim-keys-hashed.json   domain -> [Poseidon key hash (decimal)]
//
// Usage: yarn fetch-dkim-keys [--quiet|-q] [--concurrency=<n>]
//   --quiet          suppress per-domain logs, print only the final summary
//   --concurrency=n  domains to fetch in parallel (default 15)

function writeOut(filename: string, data: object) {
  const outDir = path.join(__dirname, "out");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.writeFileSync(path.join(outDir, filename), JSON.stringify(data, null, 2));
}

const DEFAULT_DNS_CONCURRENCY = 15;

function parseConcurrency(): number {
  const arg = process.argv.find((a) => a.startsWith("--concurrency="));
  if (!arg) return DEFAULT_DNS_CONCURRENCY;
  const value = Number(arg.slice("--concurrency=".length));
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `--concurrency must be a positive integer, got "${arg.slice("--concurrency=".length)}"`,
    );
  }
  return value;
}

async function main() {
  const quiet = process.argv.includes("--quiet") || process.argv.includes("-q");
  const concurrency = parseConcurrency();

  const domains = fs
    .readFileSync(path.join(__dirname, "domains.txt"), "utf8")
    .split("\n")
    .map((d) => d.trim())
    .filter(Boolean);

  const keysMap: { [domain: string]: string[] } = {};
  const chunkedMap: { [domain: string]: string[][] } = {};
  const hashedMap: { [domain: string]: string[] } = {};

  // Fetch + hash keys for all domains concurrently (bounded, since
  // getDomainKeys already fans out across ~70 DNS selectors per domain).
  for (let i = 0; i < domains.length; i += concurrency) {
    const chunk = domains.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (domain) => {
        const keys = await getDomainKeys(domain);
        if (!keys.length) {
          if (!quiet) console.log(`  ${domain}: no DKIM key found`);
          return;
        }

        keysMap[domain] = keys.map(String);
        chunkedMap[domain] = keys.map((k) =>
          bigIntToChunkedBytes(k, 121, 17).map((s) => s.toString()),
        );

        const decimals: string[] = [];
        for (const k of keys) {
          const ph = await poseidonKeyHash(k);
          decimals.push(ph.toString());
        }
        hashedMap[domain] = decimals;
        if (!quiet) console.log(`✓ ${domain}: found ${keys.length} key(s)`);
      }),
    );
  }

  writeOut("dkim-keys.json", keysMap);
  writeOut("dkim-keys-chunked.json", chunkedMap);
  writeOut("dkim-keys-hashed.json", hashedMap);

  console.log(
    `Fetched keys for ${Object.keys(hashedMap).length}/${domains.length} domains. ` +
      `Run 'yarn update-dkim-registry evm' to register them on-chain.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
