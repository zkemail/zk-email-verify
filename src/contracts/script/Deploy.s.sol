pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/Script.sol";
import "../src/TwitterEmailHandler.sol";
import "../src/StringUtils.sol";
import "../src/Groth16VerifierTwitter.sol";

contract Deploy is Script, Test {
    function run() public {
        uint256 sk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(sk);
        Verifier proofVerifier = new Verifier();
        MailServer mailServer = new MailServer();
        VerifiedTwitterEmail testVerifier = new VerifiedTwitterEmail(proofVerifier, mailServer);
        vm.stopBroadcast();
    }
}
