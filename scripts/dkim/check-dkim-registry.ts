import dns from "dns";
import forge from "node-forge";
import { ethers, JsonRpcProvider } from "ethers";
import { poseidonLarge } from "@zk-email/helpers/src/hash";
import { abi } from "../abis/DKIMRegistry.json";

require("dotenv").config();

// Read-only counterpart to update-dkim-registry: given a domain, fetch its live
// DKIM public key, hash it the same way the registry stores keys (Poseidon over
// 9 chunks of 242 bits), and ask the on-chain registry whether it is trusted.
// No private key required.
//
// Usage: yarn check-dkim-registry <domain>   (e.g. yarn check-dkim-registry ethereum.org)

const DEFAULT_RPC = "https://eth-rpc-testnet.polkadot.io";

const SELECTORS = [
  "google",
  "default",
  "mail",
  "dkim",
  "smtpapi",
  "20230601",
  "20221208",
  "s1",
  "s2",
  "k1",
  "k2",
  "sig1",
  "selector1",
  "selector2",
  "protonmail",
  "proton",
  "scph1220",
  "dkim-202308",
];

// Fetch a domain's DKIM RSA public-key modulus for a selector (undefined if none).
async function getPublicKey(
  domain: string,
  selector: string,
): Promise<bigint | undefined> {
  let records: string[][];
  try {
    records = await dns.promises.resolveTxt(`${selector}._domainkey.${domain}`);
  } catch {
    return undefined;
  }
  const match = records
    .map((r) => r.join(""))
    .join("")
    .match(/p=([^;]+)/);
  if (!match) return undefined;
  const chunks = Buffer.from(match[1], "base64")
    .toString("base64")
    .match(/.{1,64}/g);
  if (!chunks) return undefined;
  try {
    const pem = `-----BEGIN PUBLIC KEY-----\n${chunks.join("\n")}\n-----END PUBLIC KEY-----`;
    return BigInt(
      (forge.pki.publicKeyFromPem(pem) as forge.pki.rsa.PublicKey).n.toString(),
    );
  } catch {
    return undefined;
  }
}

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
  const registry = new ethers.Contract(
    process.env.DKIM_REGISTRY,
    abi,
    provider,
  );

  console.log(`Registry: ${process.env.DKIM_REGISTRY}`);
  console.log(`Domain:   ${domain}\n`);

  const found = await Promise.all(
    SELECTORS.map((s) => getPublicKey(domain, s)),
  );
  const keys = [
    ...new Set(found.filter((k): k is bigint => k !== undefined).map(String)),
  ].map(BigInt);
  if (!keys.length) {
    console.log(
      `⚠️  No DKIM key found in DNS for "${domain}". Try e.g. ethereum.org.`,
    );
    return;
  }

  const domainHash = ethers.keccak256(ethers.toUtf8Bytes(domain.toLowerCase()));
  let anyValid = false;
  for (const key of keys) {
    const poseidonHash = await poseidonLarge(key, 9, 242);
    const keyHash = ethers.toBeHex(BigInt(poseidonHash.toString()), 32);
    const ok: boolean = await registry.isKeyHashValid(domainHash, keyHash);
    anyValid = anyValid || ok;
    console.log(
      `  ${ok ? "✅ registered    " : "❌ not registered"}  ${keyHash.slice(0, 18)}…`,
    );
  }

  console.log(
    anyValid
      ? `\n✅ ${domain}: a live DKIM key is registered — emails signed with it can be verified on-chain.`
      : `\n❌ ${domain}: its live DKIM key is not on this registry (populate it with yarn update-dkim-registry).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
