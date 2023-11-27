pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@zk-email/contracts/DKIMRegistry.sol";
import "../src/TwitterEmailHandler.sol";
import "../src/Groth16VerifierTwitter.sol";

contract Deploy is Script, Test {
    function getPrivateKey() internal view returns (uint256) {
        try vm.envUint("PRIVATE_KEY") returns (uint256 privateKey) {
            return privateKey;
        } catch {
            // This is the anvil default exposed secret key
            return 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }
    }

    function run() public {
        uint256 sk = getPrivateKey();
        vm.startBroadcast(sk);

        Verifier proofVerifier = new Verifier();
        console.log("Deployed Verifier at address: %s", address(proofVerifier));

        DKIMRegistry dkimRegistry = new DKIMRegistry();
        console.log("Deployed DKIMRegistry at address: %s", address(dkimRegistry));

        // x.com hash for selector dkim-202308
        dkimRegistry.setDKIMPublicKeyHash(
            "x.com",
            bytes32(uint256(1983664618407009423875829639306275185491946247764487749439145140682408188330))
        );

        VerifiedTwitterEmail testVerifier = new VerifiedTwitterEmail(proofVerifier, dkimRegistry);
        console.log("Deployed VerifiedTwitterEmail at address: %s", address(testVerifier));

        vm.stopBroadcast();
    }
}
