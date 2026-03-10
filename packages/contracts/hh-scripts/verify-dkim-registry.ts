import fs from "fs";
import path from "path";
import { ethers } from "hardhat";
import { requireEnv } from "../hh-utils/require-env";
import { verifyWithRetry } from "../hh-utils/verify-with-retry";

const DEPLOYMENTS_DIR = "hh-deployments";

const main = async () => {
  const owner = requireEnv("OWNER");

  if (!ethers.isAddress(owner) || owner === ethers.ZeroAddress) {
    throw new Error(`OWNER is not a valid Ethereum address: ${owner}`);
  }

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const deploymentsFile = path.join(
    DEPLOYMENTS_DIR,
    chainId.toString(),
    "run-latest.json",
  );
  let deployments: Record<string, string> = {};

  if (fs.existsSync(deploymentsFile)) {
    console.log(`Reading deployed addresses from ${deploymentsFile}`);
    deployments = JSON.parse(fs.readFileSync(deploymentsFile, "utf-8"));
  }

  const dkimRegistryAddr =
    process.env.DKIM_REGISTRY || deployments.DKIM_REGISTRY;

  if (!dkimRegistryAddr) {
    console.error(
      "Error: Could not determine deployed addresses. " +
        "Set DKIM_REGISTRY in env " +
        `or run the deploy script first to create ${deploymentsFile}.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`\nUsing chain: ${chainId}`);
  console.log(`DKIM_REGISTRY: ${dkimRegistryAddr}`);

  console.log("\n=== Verifying DKIMRegistry ===");
  await verifyWithRetry("DKIMRegistry", {
    address: dkimRegistryAddr,
    constructorArguments: [owner],
  });

  console.log("\n=== All contracts verified ===");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
