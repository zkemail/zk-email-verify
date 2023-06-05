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

    function getChainID() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }

    function run() public {
        uint256 sk = getPrivateKey();
        vm.startBroadcast(sk);
        Verifier proofVerifier = new Verifier();
        MailServer mailServer = new MailServer();
        TestEmailToken erc20 = new TestEmailToken(5000);
        TokenRegistry tokenRegistry = new TokenRegistry();
        tokenRegistry.updateTokenAddress("TEST", getChainID(), address(erc20));
        WalletEmailHandlerLogic logic = new WalletEmailHandlerLogic();

        bytes memory initData =
            abi.encodeWithSelector(logic.initialize.selector, proofVerifier, mailServer, erc20, tokenRegistry);
        WalletEmailHandlerProxy walletHandler = new WalletEmailHandlerProxy(address(logic), msg.sender, initData);
        // TODO: Fix admin in place of address(this)
        vm.stopBroadcast();
    }
}
