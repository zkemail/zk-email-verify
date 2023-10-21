pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/Script.sol";
import "../src/wallet/EmailWallet.sol";
import "../src/utils/StringUtils.sol";
import "../src/wallet/Groth16VerifierWalletAnon.sol";
import "../src/wallet/TestERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract Deploy is Script, Test {
    function getPrivateKey() internal view returns (uint256) {
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
    //     TestEmailToken erc20 = new TestEmailToken(5000000000);

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

    function run() public returns (address, address, address, address, address)  {
        uint256 sk = getPrivateKey();
        vm.startBroadcast(sk);
        (address _walletHandler, address _mailServer, address _erc20, address _tokenRegistry, address _proofVerifier) = deploy();
        vm.stopBroadcast();
        return ((_walletHandler), (_mailServer), (_erc20), (_tokenRegistry), (_proofVerifier));
    }

    function deploy() public returns (address, address, address, address, address) {
        console.log("Deploy wallet: msg.sender, tx.origin:");
        console.log(msg.sender);
        console.log(tx.origin);
        Groth16Verifier proofVerifier = new Groth16Verifier();
        MailServer mailServer = new MailServer();
        TestEmailToken erc20 = new TestEmailToken(500000000);
        TokenRegistry tokenRegistry = new TokenRegistry();
        tokenRegistry.setTokenAddress("TEST", address(erc20));
        tokenRegistry.setTokenAddress("TES", address(erc20));
        EmailWallet logic = new EmailWallet();

        bytes memory initData =
            abi.encodeWithSelector(logic.initialize.selector, proofVerifier, mailServer, erc20, tokenRegistry);
        // This sets the logic owner to this contract, but the proxy owner is still the msg.sender/tx.origin?   
        ERC1967Proxy walletHandler = new ERC1967Proxy(address(logic), initData);

        EmailWallet(address(walletHandler)).transferOwnership(tx.origin);
        tokenRegistry.transferOwnership(tx.origin);
        mailServer.transferOwnership(tx.origin);
        // Logic is owned by the proxy
        // logic.transferOwnership(tx.origin);
        // walletHandler.transferOwnership(tx.origin);
        return (address(walletHandler), address(mailServer), address(erc20), address(tokenRegistry), address(proofVerifier));
    }
}
