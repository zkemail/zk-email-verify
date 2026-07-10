import fs from "fs";
import path from "path";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { bigIntToChunkedBytes } from "@zk-email/helpers/src/binary-format";
import {
  getDomainKeys,
  domainHash,
  poseidonKeyHash,
  getRegistry,
} from "./core";

require("dotenv").config();

// Batch-populate the registry with the DKIM keys of every domain in domains.txt.
// For each domain it fetches the live DKIM keys, hashes them the same way the
// registry stores keys, and calls setDKIMPublicKeyHashes (one owner tx per
// domain). Shared fetch/hash logic lives in ./core. Requires an owner key.
//
// Also writes debug artifacts under ./out for reference:
//   dkim-keys.json          domain -> [pubkey modulus (decimal)]
//   dkim-keys-chunked.json  domain -> [pubkey as 121x17 chunks] (EmailVerifier input)
//   dkim-keys-hashed.json   domain -> [Poseidon key hash (decimal)]

function writeOut(filename: string, data: object) {
  const outDir = path.join(__dirname, "out");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.writeFileSync(path.join(outDir, filename), JSON.stringify(data, null, 2));
}

async function main() {
  if (!process.env.PRIVATE_KEY) throw new Error("Env PRIVATE_KEY not found");
  if (!process.env.RPC_URL) throw new Error("Env RPC_URL not found");
  if (!process.env.DKIM_REGISTRY) throw new Error("Env DKIM_REGISTRY not found");

  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const registry = getRegistry(process.env.DKIM_REGISTRY, wallet);

  const domains = fs
    .readFileSync(path.join(__dirname, "domains.txt"), "utf8")
    .split("\n")
    .map((d) => d.trim())
    .filter(Boolean);

  const keysMap: { [domain: string]: string[] } = {};
  const chunkedMap: { [domain: string]: string[][] } = {};
  const hashedMap: { [domain: string]: string[] } = {};

  for (const domain of domains) {
    const keys = await getDomainKeys(domain);
    if (!keys.length) continue;

    keysMap[domain] = keys.map(String);
    chunkedMap[domain] = keys.map((k) =>
      bigIntToChunkedBytes(k, 121, 17).map((s) => s.toString()),
    );

    const hexes: string[] = [];
    const decimals: string[] = [];
    for (const k of keys) {
      const ph = await poseidonKeyHash(k);
      hexes.push(ethers.toBeHex(ph, 32));
      decimals.push(ph.toString());
    }
    hashedMap[domain] = decimals;

    const tx = await registry.setDKIMPublicKeyHashes(domainHash(domain), hexes);
    await tx.wait();
    console.log(`Updated hashes for domain ${domain}. Tx: ${tx.hash}`);
  }

  writeOut("dkim-keys.json", keysMap);
  writeOut("dkim-keys-chunked.json", chunkedMap);
  writeOut("dkim-keys-hashed.json", hashedMap);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
