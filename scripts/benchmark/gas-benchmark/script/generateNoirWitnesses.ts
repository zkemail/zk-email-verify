// Produces witness.gz for each Noir gas-benchmark config, consumed by `bb prove`.

import fs from "node:fs";
import path from "node:path";
import { Noir, type CompiledCircuit } from "@noir-lang/noir_js";
import { generateEmailVerifierInputs } from "@zk-email/zkemail-nr";

const ROOT = path.resolve(__dirname, "..");
const EMAIL_EML = path.resolve(__dirname, "../../../../..", "zkemail.nr/js/tests/test-data/email-good.eml");

const CONFIGS = [
  { name: "SCALE-1", maxHeader: 512,  maxBody: 512,  circuit: "gas_bench_scale1" },
  { name: "SCALE-2", maxHeader: 512,  maxBody: 768,  circuit: "gas_bench_scale2" },
  { name: "SCALE-3", maxHeader: 512,  maxBody: 1024, circuit: "gas_bench_scale3" },
  { name: "SCALE-4", maxHeader: 1024, maxBody: 1024, circuit: "gas_bench_scale4" },
  { name: "SCALE-5", maxHeader: 1024, maxBody: 2048, circuit: "gas_bench_scale5" },
  { name: "SCALE-6", maxHeader: 1024, maxBody: 4096, circuit: "gas_bench_scale6" },
  { name: "SCALE-7", maxHeader: 2048, maxBody: 4096, circuit: "gas_bench_scale7" },
];

async function main() {
  const eml = fs.readFileSync(EMAIL_EML);
  console.log(`loaded email: ${EMAIL_EML} (${eml.length} bytes)`);

  for (const cfg of CONFIGS) {
    const acirPath = path.join(ROOT, "noir", cfg.name, "target", `${cfg.circuit}.json`);
    if (!fs.existsSync(acirPath)) {
      throw new Error(`missing ACIR: ${acirPath} — run \`nargo compile\` first`);
    }
    const compiled: CompiledCircuit = JSON.parse(fs.readFileSync(acirPath, "utf8"));

    const inputs = await generateEmailVerifierInputs(eml, {
      maxHeadersLength: cfg.maxHeader,
      maxBodyLength: cfg.maxBody,
    });

    const noir = new Noir(compiled);
    const { witness, returnValue } = await noir.execute(inputs as any);
    console.log(`${cfg.name}: witness ${witness.length} B, return ${JSON.stringify(returnValue).slice(0, 120)}...`);

    const outPath = path.join(ROOT, "noir", cfg.name, "target", `${cfg.circuit}.gz`);
    fs.writeFileSync(outPath, witness);
    console.log(`  wrote ${outPath}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
