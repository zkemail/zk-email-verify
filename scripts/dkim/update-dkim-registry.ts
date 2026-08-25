import fs from "fs";
import path from "path";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { domainHash, getRegistry } from "./core";

require("dotenv").config();

// Phase 2 of the DKIM registry update flow: read the keys fetch-dkim-keys
// wrote to ./out/dkim-keys-hashed.json and register them on-chain (one owner
// tx per domain, worth of setDKIMPublicKeyHashes calls).
//
// Usage: yarn update-dkim-registry [--quiet|-q]
//   --quiet  suppress per-domain success logs (failures and the final tally
//            still print, so a real on-chain failure is never hidden)

type HashedMap = { [domain: string]: string[] };

async function submitEvm(hashedMap: HashedMap, quiet: boolean) {
  if (!process.env.PRIVATE_KEY) throw new Error("Env PRIVATE_KEY not found");
  if (!process.env.RPC_URL) throw new Error("Env RPC_URL not found");
  if (!process.env.DKIM_REGISTRY)
    throw new Error("Env DKIM_REGISTRY not found");

  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const registry = getRegistry(process.env.DKIM_REGISTRY, wallet);

  // Submit all txs with locally-tracked nonces, without waiting on each
  // confirmation before sending the next. Each domain still succeeds or
  // fails independently -- one bad domain doesn't block or fail the others.
  const domains = Object.keys(hashedMap);
  let nonce = await provider.getTransactionCount(wallet.address, "pending");

  const pending = domains.map(async (domain) => {
    const hexes = hashedMap[domain].map((decimal) =>
      ethers.toBeHex(BigInt(decimal), 32),
    );
    const tx = await registry.setDKIMPublicKeyHashes(
      domainHash(domain),
      hexes,
      { nonce: nonce++ },
    );
    return { domain, tx };
  });

  const sent = await Promise.all(pending);

  const results = await Promise.allSettled(
    sent.map(async ({ domain, tx }) => {
      await tx.wait();
      return { domain, txHash: tx.hash };
    }),
  );

  let succeeded = 0;
  results.forEach((result, i) => {
    const { domain, tx } = sent[i];
    if (result.status === "fulfilled") {
      succeeded++;
      if (!quiet)
        console.log(`Updated hashes for domain ${domain}. Tx: ${tx.hash}`);
    } else {
      console.error(`Failed to update domain ${domain}: ${result.reason}`);
    }
  });

  console.log(`${succeeded}/${results.length} domains updated successfully.`);
}

async function main() {
  const quiet = process.argv.includes("--quiet") || process.argv.includes("-q");

  const hashedPath = path.join(__dirname, "out", "dkim-keys-hashed.json");
  if (!fs.existsSync(hashedPath)) {
    throw new Error(
      `${hashedPath} not found. Run 'yarn fetch-dkim-keys' first.`,
    );
  }
  const { mtime } = fs.statSync(hashedPath);
  console.log(`Using keys fetched ${mtime.toISOString()} (${hashedPath}).`);

  const hashedMap: HashedMap = JSON.parse(fs.readFileSync(hashedPath, "utf8"));

  await submitEvm(hashedMap, quiet);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
