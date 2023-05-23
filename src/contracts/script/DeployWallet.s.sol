pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/Script.sol";
import "../src/WalletEmailHandlerLogic.sol";
import "../src/WalletEmailHandlerProxy.sol";
import "../src/StringUtils.sol";
import "../src/Groth16VerifierWalletAnon.sol";
import "../src/TestERC20.sol";

contract Deploy is Script, Test {
    function getPrivateKey() internal returns (uint256) {
        try vm.envUint("PRIVATE_KEY") returns (uint256 privateKey) {
            return privateKey;
        } catch {
            // This is the anvil default exposed secret key
            return 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }
    }

    // function oldRunDeployNonproxy() public {
    //     uint256 sk = getPrivateKey();
    //     vm.startBroadcast(sk);
    //     Verifier proofVerifier = new Verifier();
    //     MailServer mailServer = new MailServer();
    //     TestEmailToken erc20 = new TestEmailToken(5000);

    //     VerifiedWalletEmail testVerifier = new VerifiedWalletEmail(proofVerifier, mailServer, erc20);
    //     vm.stopBroadcast();
    // }

    function run() public {
        uint256 sk = getPrivateKey();
        vm.startBroadcast(sk);
        Verifier proofVerifier = new Verifier();
        MailServer mailServer = new MailServer();
        TokenRegistry tokenRegistry = new TokenRegistry();
        TestEmailToken erc20 = new TestEmailToken(5000);
        WalletEmailHandlerLogic logic = new WalletEmailHandlerLogic();
        address admin = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D; // HEVM Cheat Code Address
        bytes memory initData =
            abi.encodeWithSignature("initialize(Verifier,MailServer,TestEmailToken,TokenRegistry)", proofVerifier, mailServer, erc20, tokenRegistry);
        WalletEmailHandlerProxy proxy = new WalletEmailHandlerProxy(address(logic), admin, initData);
        // Change owner of proxy to tx.origin (msg.sender)
        WalletEmailHandlerLogic(address(proxy)).transferOwnership(tx.origin);
        
        vm.stopBroadcast();
    }
}
