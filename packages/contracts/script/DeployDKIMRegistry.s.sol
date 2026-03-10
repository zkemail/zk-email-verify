// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import { Script, console } from "forge-std/Script.sol";
import { IDKIMRegistry } from "../src/interfaces/IERC7969.sol";
import { DKIMRegistry } from "../src/DKIMRegistry.sol";

contract DeployDKIMRegistryScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            console.log("PRIVATE_KEY not set");
            return;
        }

        address owner = vm.envAddress("OWNER");
        if (owner == address(0)) {
            console.log("OWNER not set");
            return;
        }

        vm.startBroadcast(deployerPrivateKey);

        console.log("\n=== Deploy DKIMRegistry ===");
        console.log("Deploying DKIMRegistry with signer:", owner);
        DKIMRegistry dkimRegistry = new DKIMRegistry(owner);
        console.log("DKIMRegistry deployed at:", address(dkimRegistry));

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("DKIM_REGISTRY:", address(dkimRegistry));
    }
}
