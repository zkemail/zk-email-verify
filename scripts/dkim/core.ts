import dns from "dns";
import forge from "node-forge";
import { ethers, Wallet } from "ethers";
import { poseidonLarge } from "@zk-email/helpers/src/hash";
import { abi } from "../abis/DKIMRegistry.json";

// Single source of truth for the DKIM-registry logic shared by the CLI scripts
// (check-dkim-registry / update-dkim-registry) and the web demo. Everything here
// is a pure function with no CLI/env side effects, so it can be imported anywhere.

export const DEFAULT_RPC = "https://eth-rpc-testnet.polkadot.io";

// DKIM selectors we probe in DNS. Union of the selectors previously used by the
// check and update scripts, so both paths look in the same places.
export const SELECTORS = [
  "google",
  "default",
  "mail",
  "smtpapi",
  "dkim",
  "200608",
  "20230601",
  "20221208",
  "20210112",
  "dkim-201406",
  "dkim-202308",
  "1a1hai",
  "v1",
  "v2",
  "v3",
  "k1",
  "k2",
  "k3",
  "hs1",
  "hs2",
  "s1",
  "s2",
  "s3",
  "s1024",
  "sig1",
  "sig2",
  "sig3",
  "selector",
  "selector1",
  "selector2",
  "mindbox",
  "bk",
  "sm1",
  "sm2",
  "gmail",
  "10dkim1",
  "11dkim1",
  "12dkim1",
  "memdkim",
  "m1",
  "mx",
  "sel1",
  "scph1220",
  "scph0819",
  "ml",
  "pps1",
  "skiff1",
  "protonmail",
  "proton",
];

// Build a contract handle bound to a provider (read) or wallet (write).
export function getRegistry(
  address: string,
  runner: ethers.ContractRunner,
): ethers.Contract {
  return new ethers.Contract(address, abi, runner);
}

// Resolve a TXT record, retrying only transient failures. A definitive "no such
// record" (ENOTFOUND/ENODATA) returns [] immediately so the ~dozens of unused
// selectors stay fast; timeouts/servfail are retried so a dropped UDP packet
// under heavy parallelism doesn't silently drop a real key.
async function resolveTxtWithRetry(
  name: string,
  attempts = 3,
): Promise<string[][]> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await dns.promises.resolveTxt(name);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOTFOUND" || code === "ENODATA") return [];
      if (i === attempts - 1) return [];
    }
  }
  return [];
}

// Fetch a domain's DKIM RSA public-key modulus for a selector (undefined if none).
export async function getPublicKey(
  domain: string,
  selector: string,
): Promise<bigint | undefined> {
  const records = await resolveTxtWithRetry(
    `${selector}._domainkey.${domain}`,
  );
  if (!records.length) return undefined;
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

export interface DomainKey {
  key: bigint;
  selectors: string[];
}

// Fetch a domain's DKIM keys across the known selectors, deduped by key. Since a
// single key can be published under several selectors, each entry tracks all the
// selectors it was found under.
export async function getDomainKeysDetailed(
  domain: string,
): Promise<DomainKey[]> {
  const found = await Promise.all(
    SELECTORS.map(async (selector) => ({
      selector,
      key: await getPublicKey(domain, selector),
    })),
  );
  const byKey = new Map<string, DomainKey>();
  for (const { selector, key } of found) {
    if (key === undefined) continue;
    const id = key.toString();
    const existing = byKey.get(id);
    if (existing) existing.selectors.push(selector);
    else byKey.set(id, { key, selectors: [selector] });
  }
  return [...byKey.values()];
}

// Unique DKIM key moduli for a domain (selectors dropped) — used by the write path.
export async function getDomainKeys(domain: string): Promise<bigint[]> {
  return (await getDomainKeysDetailed(domain)).map((d) => d.key);
}

// keccak256 of the lowercased domain — how the registry keys domains.
export function domainHash(domain: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(domain.toLowerCase()));
}

// Poseidon over the key split into 9 chunks of 242 bits, as a bigint. This is the
// exact hashing the registry and the ZK Email verifier use.
export async function poseidonKeyHash(key: bigint): Promise<bigint> {
  const hash = await poseidonLarge(key, 9, 242);
  return BigInt(hash.toString());
}

// Same hash as a 32-byte hex string, as stored/queried on the registry.
export async function hashKey(key: bigint): Promise<string> {
  return ethers.toBeHex(await poseidonKeyHash(key), 32);
}

export interface KeyCheck {
  keyHash: string;
  registered: boolean;
  selectors: string[];
}

export interface CheckResult {
  domain: string;
  domainHash: string;
  keys: KeyCheck[];
  anyValid: boolean;
}

// Read-only: fetch a domain's live DKIM keys and ask the registry whether each is
// trusted. Needs only a provider — no private key.
export async function checkDomain(
  domain: string,
  registryAddress: string,
  provider: ethers.ContractRunner,
): Promise<CheckResult> {
  const registry = getRegistry(registryAddress, provider);
  const dHash = domainHash(domain);
  const found = await getDomainKeysDetailed(domain);

  const keys: KeyCheck[] = [];
  for (const { key, selectors } of found) {
    const keyHash = await hashKey(key);
    const registered: boolean = await registry.isKeyHashValid(dHash, keyHash);
    keys.push({ keyHash, registered, selectors });
  }

  return {
    domain,
    domainHash: dHash,
    keys,
    anyValid: keys.some((k) => k.registered),
  };
}

export interface UpdateResult {
  domain: string;
  domainHash: string;
  keyHashes: string[];
  txHash: string | null;
}

// Owner-only: fetch a domain's live DKIM keys, hash them, and register them via
// setDKIMPublicKeyHashes. `wallet` must own the target registry. Returns txHash
// null when the domain has no DKIM key in DNS (nothing to register).
export async function updateDomain(
  domain: string,
  registryAddress: string,
  wallet: Wallet,
): Promise<UpdateResult> {
  const dHash = domainHash(domain);
  const moduli = await getDomainKeys(domain);

  const keyHashes: string[] = [];
  for (const key of moduli) {
    keyHashes.push(await hashKey(key));
  }

  if (!keyHashes.length) {
    return { domain, domainHash: dHash, keyHashes, txHash: null };
  }

  const registry = getRegistry(registryAddress, wallet);
  const tx = await registry.setDKIMPublicKeyHashes(dHash, keyHashes);
  await tx.wait();

  return { domain, domainHash: dHash, keyHashes, txHash: tx.hash };
}
