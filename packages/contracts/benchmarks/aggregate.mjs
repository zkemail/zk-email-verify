// Combine sepolia.json + paseo.json into gas/USD comparison tables.
// Ethereum (measured on Sepolia, EVM) vs Kusama (projected from the PolkaVM
// gas measured on Paseo Asset Hub, priced in KSM).
// Env (all optional): BENCH (dir with the json files, default cwd),
//   ETH_USD, KSM_USD, ETH_GWEI (live mainnet gas price).
import { readFileSync } from "fs";
import { resolve } from "path";

const BENCH = process.env.BENCH || process.cwd();
const sep = JSON.parse(readFileSync(resolve(BENCH, "sepolia.json")));
const pas = JSON.parse(readFileSync(resolve(BENCH, "paseo.json")));

const ETH = Number(process.env.ETH_USD ?? 1780.18);
const KSM = Number(process.env.KSM_USD ?? 3.32);
const LIVE_GWEI = Number(process.env.ETH_GWEI ?? 0.238);
const SCEN = [LIVE_GWEI, 5, 20];

const fmt = (n, d = 4) => Number(n).toFixed(d);
const feePAS = (r) => Number(r.feeGasWei) / 1e18;
const gas = (r) => Number(r.gasUsed);

const rows = sep.results.map((s, i) => {
  const p = pas.results[i];
  return { name: s.name, ethGas: gas(s), pasGas: gas(p), pasFee: feePAS(p) };
});

console.log("OP | ETH gas | PVM gas | PAS fee");
for (const r of rows)
  console.log(`${r.name} | ${r.ethGas} | ${r.pasGas} | ${fmt(r.pasFee, 6)}`);

console.log(`\n=== USD per op (ETH=$${ETH} KSM=$${KSM}) ===`);
for (const r of rows) {
  const ethUsd = SCEN.map((g) => r.ethGas * g * 1e-9 * ETH);
  console.log(
    `${r.name.padEnd(26)} ETH[${SCEN.map((g, i) => g + "gwei=$" + fmt(ethUsd[i])).join(" ")}]  ` +
      `Kusama*=$${fmt(r.pasFee * KSM)}`
  );
}

const dep = rows.find((r) => r.name === "deploy");
const one = rows.find((r) => r.name === "setDKIMPublicKeyHash");
console.log("\n=== scenario: deploy + 100 single registrations ===");
for (const g of SCEN)
  console.log(`ETH @${g}gwei: $${fmt((dep.ethGas + 100 * one.ethGas) * g * 1e-9 * ETH, 2)}`);
console.log(`Kusama*: $${fmt((dep.pasFee + 100 * one.pasFee) * KSM, 2)}`);
