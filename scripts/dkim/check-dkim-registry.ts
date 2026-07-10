import { JsonRpcProvider } from "ethers";
import { checkDomain, DEFAULT_RPC } from "./core";

require("dotenv").config();

// Read-only counterpart to update-dkim-registry: given a domain, fetch its live
// DKIM public key, hash it the same way the registry stores keys (Poseidon over
// 9 chunks of 242 bits), and ask the on-chain registry whether it is trusted.
// No private key required. Shared logic lives in ./core.
//
// Usage: yarn check-dkim-registry <domain>   (e.g. yarn check-dkim-registry ethereum.org)

async function main() {
  const domain = process.argv[2];
  if (!domain) {
    console.error(
      "Usage: yarn check-dkim-registry <domain>   (e.g. yarn check-dkim-registry ethereum.org)",
    );
    process.exit(1);
  }
  if (!process.env.DKIM_REGISTRY) {
    console.error(
      "DKIM_REGISTRY is not set. Add the deployed registry address to scripts/.env.",
    );
    process.exit(1);
  }

  const provider = new JsonRpcProvider(process.env.RPC_URL || DEFAULT_RPC);

  console.log(`Registry: ${process.env.DKIM_REGISTRY}`);
  console.log(`Domain:   ${domain}\n`);

  const result = await checkDomain(domain, process.env.DKIM_REGISTRY, provider);

  if (!result.keys.length) {
    console.log(
      `⚠️  No DKIM key found in DNS for "${domain}". Try e.g. ethereum.org.`,
    );
    return;
  }

  for (const { keyHash, registered } of result.keys) {
    console.log(
      `  ${registered ? "✅ registered    " : "❌ not registered"}  ${keyHash}`,
    );
  }

  console.log(
    result.anyValid
      ? `\n✅ ${domain}: a live DKIM key is registered — emails signed with it can be verified on-chain.`
      : `\n❌ ${domain}: its live DKIM key is not on this registry (populate it with yarn update-dkim-registry).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
