// DKIMRegistry cross-chain benchmark: deploy + registry ops, measured via
// gasUsed*effectiveGasPrice AND real wallet balance delta (the latter also
// captures any PolkaVM refundable storage deposit not shown in eth gas).
//
// Env: RPC_URL, PK, EXPECTED (burner addr guard), MODE=evm|pvm, LABEL, OUT
// Optional: CONTRACTS (path to packages/contracts; defaults relative to script)
import { createRequire } from "module";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const here = dirname(fileURLToPath(import.meta.url));
// script lives at packages/contracts/benchmarks/
const CONTRACTS = process.env.CONTRACTS || resolve(here, "..");
const require = createRequire(CONTRACTS + "/");
const { ethers } = require("ethers");

const { RPC_URL, PK, EXPECTED, MODE, LABEL, OUT } = process.env;
if (!RPC_URL || !PK || !EXPECTED || !MODE || !OUT) throw new Error("missing env");

const evmArt = JSON.parse(
  readFileSync(CONTRACTS + "/out/DKIMRegistry.sol/DKIMRegistry.json")
);
const pvmArt = JSON.parse(
  readFileSync(CONTRACTS + "/hh-artifacts/src/DKIMRegistry.sol/DKIMRegistry.json")
);
const abi = evmArt.abi;
const bytecode = MODE === "pvm" ? pvmArt.bytecode : evmArt.bytecode.object;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PK, provider);

// --- SAFETY GUARD: never send from anything but the expected burner ---
if (wallet.address.toLowerCase() !== EXPECTED.toLowerCase()) {
  throw new Error(
    `signer ${wallet.address} != expected burner ${EXPECTED}; aborting`
  );
}

const net = await provider.getNetwork();
const startBal = await provider.getBalance(wallet.address);
console.log(`\n=== ${LABEL} (chainId ${net.chainId}, MODE=${MODE}) ===`);
console.log(`signer:  ${wallet.address}`);
console.log(`balance: ${ethers.formatEther(startBal)}`);
if (startBal === 0n) throw new Error("burner not funded on this chain");

const results = [];
async function record(name, sendFn) {
  const before = await provider.getBalance(wallet.address);
  const tx = await sendFn();
  const rcpt = await tx.wait();
  const after = await provider.getBalance(wallet.address);
  const gasUsed = rcpt.gasUsed;
  const gasPrice = rcpt.gasPrice ?? tx.gasPrice ?? 0n;
  const feeGas = gasUsed * gasPrice; // eth-style fee
  const realCost = before - after; // true native debit (fee + any deposit)
  results.push({
    name,
    hash: tx.hash,
    gasUsed: gasUsed.toString(),
    gasPriceWei: gasPrice.toString(),
    feeGasWei: feeGas.toString(),
    realCostWei: realCost.toString(),
  });
  console.log(
    `${name.padEnd(26)} gas=${gasUsed.toString().padStart(9)}  ` +
      `fee=${ethers.formatEther(feeGas).padStart(12)}  ` +
      `realCost=${ethers.formatEther(realCost).padStart(12)}`
  );
}

// domain + key hashes are arbitrary bytes32; gas depends on storage writes,
// not on the values, so dummies are representative.
const d = ethers.id("example.com");
const k1 = ethers.id("dkim-key-1");
const k2 = ethers.id("dkim-key-2");
const k3 = ethers.id("dkim-key-3");
const k4 = ethers.id("dkim-key-4");

// --- deploy ---
const factory = new ethers.ContractFactory(abi, bytecode, wallet);
let contract;
await record("deploy", async () => {
  contract = await factory.deploy(wallet.address); // owner = burner
  await contract.waitForDeployment();
  return contract.deploymentTransaction();
});
const addr = await contract.getAddress();
console.log(`deployed at: ${addr}`);

// --- ops ---
await record("setDKIMPublicKeyHash", () => contract.setDKIMPublicKeyHash(d, k1));
await record("setDKIMPublicKeyHashes(x3)", () =>
  contract.setDKIMPublicKeyHashes(d, [k2, k3, k4])
);
await record("revokeDKIMPublicKeyHash", () => contract.revokeDKIMPublicKeyHash(d, k1));

const endBal = await provider.getBalance(wallet.address);
const out = {
  label: LABEL,
  mode: MODE,
  chainId: net.chainId.toString(),
  rpc: RPC_URL,
  contract: addr,
  signer: wallet.address,
  totalRealCostWei: (startBal - endBal).toString(),
  results,
};
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`total real cost: ${ethers.formatEther(startBal - endBal)}`);
console.log(`written: ${OUT}`);
