import fs from "fs";
import path from "path";
import { ethers, network } from "hardhat";
import { requireEnv } from "../hh-utils/require-env";

const DEPLOYMENTS_DIR = "hh-deployments";

const main = async () => {
  const owner = requireEnv("OWNER");

  if (!ethers.isAddress(owner) || owner === ethers.ZeroAddress) {
    throw new Error(`OWNER is not a valid Ethereum address: ${owner}`);
  }

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer available. Ensure PRIVATE_KEY is set");
  }

  console.log(`\nUsing network: ${network.name}`);
  console.log(`Deployer address: ${await deployer.getAddress()}`);
  console.log(`OWNER: ${owner}`);

  console.log("\n=== Deploy DKIMRegistry ===");
  console.log("Deploying DKIMRegistry with signer:", owner);
  const DKIMRegistryFactory = await ethers.getContractFactory(
    "DKIMRegistry",
    deployer,
  );
  const dkimRegistry = await DKIMRegistryFactory.deploy(owner);
  await dkimRegistry.waitForDeployment();
  const dkimRegistryAddress = await dkimRegistry.getAddress();
  console.log("DKIMRegistry deployed at:", dkimRegistryAddress);

  console.log("\n=== Deployment Complete ===");
  console.log("DKIM_REGISTRY:", dkimRegistryAddress);

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const deploymentsDir = path.join(DEPLOYMENTS_DIR, chainId.toString());
  const deploymentsFile = path.join(deploymentsDir, "run-latest.json");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    deploymentsFile,
    JSON.stringify(
      {
        DKIM_REGISTRY: dkimRegistryAddress,
      },
      null,
      2,
    ),
  );
  console.log(`Deployment addresses saved to ${deploymentsFile}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
