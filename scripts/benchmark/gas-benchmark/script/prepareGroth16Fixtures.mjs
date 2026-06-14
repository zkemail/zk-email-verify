#!/usr/bin/env node
// Converts snarkjs proof.json + public.json into a flat JSON fixture
// that Foundry tests can load via vm.parseJson*.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT_DIR = path.resolve(import.meta.dirname, "..", "fixtures", "groth16");

const CONFIGS = ["SCALE-1", "SCALE-2", "SCALE-3", "SCALE-4", "SCALE-5", "SCALE-6", "SCALE-7"];

const toHex = (v) => "0x" + BigInt(v).toString(16).padStart(64, "0");

for (const cfg of CONFIGS) {
  const proof = JSON.parse(fs.readFileSync(path.join(ROOT, "compiled", cfg, "proof.json"), "utf8"));
  const pub = JSON.parse(fs.readFileSync(path.join(ROOT, "compiled", cfg, "public.json"), "utf8"));

  // snarkjs solidity call order: flip G2 coordinates (pB[i][1], pB[i][0])
  const fixture = {
    config: cfg,
    pA: [toHex(proof.pi_a[0]), toHex(proof.pi_a[1])],
    pB: [
      [toHex(proof.pi_b[0][1]), toHex(proof.pi_b[0][0])],
      [toHex(proof.pi_b[1][1]), toHex(proof.pi_b[1][0])],
    ],
    pC: [toHex(proof.pi_c[0]), toHex(proof.pi_c[1])],
    pubSignals: pub.map(toHex),
  };
  const outPath = path.join(OUT_DIR, `${cfg}.json`);
  fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2));
  console.log(`wrote ${outPath} (pubSignals: ${fixture.pubSignals.length})`);
}
