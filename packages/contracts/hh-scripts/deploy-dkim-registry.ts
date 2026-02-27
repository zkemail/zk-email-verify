import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const signer = process.env.DKIM_REGISTRY_OWNER ?? deployer.address;

  console.log("Deploying DKIMRegistry with signer/owner:", signer);
  console.log("Deployer account:", deployer.address);

  const DKIMRegistry = await ethers.getContractFactory("DKIMRegistry");
  const registry = await DKIMRegistry.deploy(signer);

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("DKIMRegistry deployed to:", address);
  console.log("Owner:", signer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
