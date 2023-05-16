pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/Script.sol";
// import "../src/TwitterEmailHandler.sol";
import "../src/KYCEmailHandler.sol";
import "../src/StringUtils.sol";
// import "../src/Groth16VerifierTwitter.sol";
import "../src/Groth16VerifierKYC.sol";

contract Deploy is Script, Test {
  function getPrivateKey() internal returns (uint256) {
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
    MailServer mailServer = new MailServer();
    // VerifiedTwitterEmail testVerifier = new VerifiedTwitterEmail(proofVerifier, mailServer);
    VerifiedKYCEmail testVerifier = new VerifiedKYCEmail(proofVerifier, mailServer);
    vm.stopBroadcast();
  }
}
