import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ownerEnv = process.env.OWNER;

if (!ownerEnv) {
  throw new Error("OWNER is not set");
}

export default buildModule("DKIMRegistryModule", (m) => {
  const owner = m.getParameter("owner", ownerEnv);
  const dkimRegistry = m.contract("DKIMRegistry", [owner]);

  return { dkimRegistry };
});
