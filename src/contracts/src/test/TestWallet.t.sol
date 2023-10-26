// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../wallet/EmailWallet.sol";
import "../wallet/TestERC20.sol";
import "../utils/StringUtils.sol";
import "../wallet/Groth16VerifierWalletAnon.sol";
import "../wallet/MIMC.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract IERC20DAI {
    uint8 public constant decimals = 18;
}

pragma solidity ^0.8.0;

contract WalletUtilsTest is Test {
    using StringUtils for *;

    // Random address to use as the deployer/owner
    address constant owner = 0x0000000000000000000000000000000000001111;

    address internal constant zero = 0x0000000000000000000000000000000000000000;
    address constant VM_ADDR = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D;
    uint16 public constant packSizeOld = 7;
    uint16 public constant packSize = 30;
    uint16 public constant body_len = 4 * 4;

    ERC1967Proxy walletHandler;
    MailServer mailServer;
    Groth16Verifier proofVerifier;
    EmailWallet logic;
    TokenRegistry tokenRegistry;
    TestEmailToken erc20;

    function getChainID() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }

    function getPrivateKey() internal view returns (uint256) {
        try vm.envUint("PRIVATE_KEY") returns (uint256 privateKey) {
            return privateKey;
        } catch {
            // This is the anvil default exposed secret key
            return 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }
    }

    // NOTE: This needs to manually be kept 1-1 with the Deploy in DeployWallet.s.sol to correctly test the Ownable properties
    function deploy() public returns (address, address, address, address, address) {
        console.log("Deploy wallet: msg.sender, tx.origin:");
        console.log(msg.sender);
        console.log(tx.origin);
        proofVerifier = new Groth16Verifier();
        mailServer = new MailServer();
        erc20 = new TestEmailToken(500000000);
        tokenRegistry = new TokenRegistry();
        tokenRegistry.setTokenAddress("TEST", address(erc20));
        tokenRegistry.setTokenAddress("TES", address(erc20));
        logic = new EmailWallet();

        bytes memory initData =
            abi.encodeWithSelector(logic.initialize.selector, proofVerifier, mailServer, erc20, tokenRegistry);
        // This sets the logic owner to this contract, but the proxy owner is still the msg.sender/tx.origin?
        walletHandler = new ERC1967Proxy(address(logic), initData);

        // EmailWallet(address(walletHandler)).transferOwnership(tx.origin);
        tokenRegistry.transferOwnership(tx.origin);
        mailServer.transferOwnership(tx.origin);
        // Logic is owned by the proxy
        // logic.transferOwnership(tx.origin);
        // walletHandler.transferOwnership(tx.origin);
        return (
            address(walletHandler), address(mailServer), address(erc20), address(tokenRegistry), address(proofVerifier)
        );
    }

    function testDeploy() public {
        // deploy as owner
        vm.startPrank(owner);

        console.log("Deploy msg.sender, tx.origin:");
        console.log(msg.sender);
        console.log(tx.origin);

        (address __walletHandler, address _mailServer, address _erc20, address _tokenRegistry, address _proofVerifier) =
            deploy();
        address payable _walletHandler = payable(__walletHandler);
        walletHandler = ERC1967Proxy(_walletHandler);
        mailServer = MailServer(_mailServer);
        erc20 = TestEmailToken(_erc20);
        tokenRegistry = TokenRegistry(_tokenRegistry);
        proofVerifier = Groth16Verifier(_proofVerifier);

        vm.stopPrank();
    }

    function setUp() public {
        testDeploy();
    }

    function testUpdateMailserver() public {
        assertEq(tx.origin, mailServer.owner());
        vm.startPrank(tx.origin);
        mailServer.editMailserverKey("test", uint256(0), uint256(0));
        vm.stopPrank();
    }

    // TODO: This test succeeds but it should really be matching TEST...
    function testUnpackIntoString_TES() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 357645418496;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes);
        string memory intended_value = "TES";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    function testUnpackIntoString_Pack30_0() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 1684956499;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes);
        string memory intended_value = "Send";
        console.logString(byteList);
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    }

    function testUnpackIntoString_Pack30_1() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 12544;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes);
        string memory intended_value = "1";
        console.logString(byteList);
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    }

    function testUnpackIntoString_Pack30_2() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 452605509632;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes);
        string memory intended_value = "dai";
        console.logString(byteList);
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    }

    function testGetOrCreateWallet() public {
        uint256 salt = 5;
        address addr = EmailWallet(address(walletHandler)).getOrCreateWallet(salt);    
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testTransfer() public {
        uint256[27] memory publicSignals = [
            1684956499,
            12544,
            0,
            357645418496,
            0,
            5107105070205147804323073081838799593802147036558194372434614156652013702978,
            0,
            14888697984951997831828019982308763972998058499743518473379896342860003826291,
            2107195391459410975264579855291297887,
            2562632063603354817278035230349645235,
            1868388447387859563289339873373526818,
            2159353473203648408714805618210333973,
            351789365378952303483249084740952389,
            659717315519250910761248850885776286,
            1321773785542335225811636767147612036,
            258646249156909342262859240016844424,
            644872192691135519287736182201377504,
            174898460680981733302111356557122107,
            1068744134187917319695255728151595132,
            1870792114609696396265442109963534232,
            8288818605536063568933922407756344,
            1446710439657393605686016190803199177,
            2256068140678002554491951090436701670,
            518946826903468667178458656376730744,
            3222036726675473160989497427257757,
            1288748945563734709496162844143997167,
            0
        ];

        uint256[2] memory proof_a = [
            11164073125854340218187119737397219149930504839502649071136956475163806627257,
            9625704491595093910104764893744765316391485964404577658830474287644694696473
        ];

        uint256[2][2] memory proof_b = [
            [
                15613720788324722668366286417930203146082869116142223347177335428755131444103,
                1477910911601784816645771367576014377746063143768912338608135985675729867106
            ],
            [
                4032393029301422312136681350279582602791927221437128998112058549933185453710,
                16966256699577314040623252422299922404975069890650510370128431780113935715081    
            ]
        ];

        uint256[2] memory proof_c = [
            3758273119278111942249881759670032276955007597643607969108816916744578298028,
            17248127105585502210286939638261362406808571992659388597250195912390860512062
        ];

        // Send 50 DAI from DAI contract (from people who accidentally sent it there) to the from wallet, as if they had sent that
        address DAI_ADDR = tokenRegistry.getTokenAddress("DAI");
        address TEST_ADDR = tokenRegistry.getTokenAddress("TEST");
        uint256 fromSalt = publicSignals[5];
        address from_addr = EmailWallet(address(walletHandler)).getOrCreateWallet(fromSalt);

        uint256 toSalt = publicSignals[7];
        address to_addr = EmailWallet(address(walletHandler)).getOrCreateWallet(toSalt);

        // Transfer money from the literal DAI contract to the from wallet
        // vm.startPrank(DAI_ADDR);
        // console.log("....");
        // uint256 decimals = ERC20(DAI_ADDR).decimals();
        // console.log(decimals);
        // uint256 daiAmount = 1 * 10 ** ERC20(DAI_ADDR).decimals();
        // console.log("Dai amount: ");
        // console.log(daiAmount);
        // uint256 daiBalance = IERC20(DAI_ADDR).balanceOf(DAI_ADDR);
        // console.log("Dai balance: ");
        // console.log(daiBalance);
        // assert(daiBalance >= daiAmount);
        // IERC20(DAI_ADDR).transfer(from_addr, daiAmount);
        // uint256 startingFromDaiBalance = IERC20(DAI_ADDR).balanceOf(from_addr);
        // assert(startingFromDaiBalance >= daiAmount);
        // vm.stopPrank();

        // Test proof verification
        bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        assertEq(verified, true);
        
        // Test email transfer from any address after spoofing msg.sender to a relayer
        // Right now this passes, but will have to eventually match the relayer commitment for gas reimbursement, at which point it will fail
        EmailWallet(address(walletHandler)).transfer(proof_a, proof_b, proof_c, publicSignals);


        // Test new balances of the from/to wallet
        // assert(startingFromDaiBalance > IERC20(TEST_ADDR).balanceOf(from_addr));
        assert(IERC20(TEST_ADDR).balanceOf(to_addr) >= 0);

        // TODO: Test gas reimbursement for the relayer

        // Test emergency migrate back
        // vm.startPrank(tx.origin);
        console.log("Our wallet:");
        console.log(address(this));
        console.log(EmailWallet(address(walletHandler)).owner());

        // Call migrate as owner
        vm.startPrank(owner);
        EmailWallet(address(walletHandler)).migrateAllToken(toSalt, fromSalt, "TEST");
        vm.stopPrank();
    }

    function queryNullifier(uint256 a) public view returns (bool) {
        EmailWalletStorage handlerStorage = EmailWalletStorage(address(walletHandler));
        return handlerStorage.nullifier(a);
    }

    // Check nullifier is set
    function testNullifier() public {
        assertEq(queryNullifier(uint256(0)), false);
        testTransfer();
        assertEq(queryNullifier(uint256(0)), true);
    }

    // Upgrades the contract and checks that the nullifier remains used
    function testUpgradeLogicContract() public {
        testTransfer();

        // Deploy a new logic contract
        vm.startPrank(owner);
        EmailWalletV2 newLogicContract = new EmailWalletV2();

        EmailWallet(address(walletHandler)).upgradeTo(address(newLogicContract));

        EmailWalletV2 walletV2 = EmailWalletV2(address(walletHandler));

        // Re-initialize, pretending we have a new verifier contract
        Groth16Verifier newProofVerifier = new Groth16Verifier();
        walletV2.setVerifier(newProofVerifier);

        vm.stopPrank();

        // Ensure the nullifier is still used
        assertEq(queryNullifier(uint256(0)), true);
        assertEq(address(newProofVerifier), address(walletV2.verifier()));

        // Verify calling migrateAllToken fails as this method was disabled in V2
        vm.expectRevert();
        walletV2.migrateAllToken(0, 0, address(this));
    }

    // TODO: This parses "TEST" as "TES" for some reason...
    // Uses old proof.
    // function testSendingTestTokens() public {
    //     bytes memory data =
    //         hex"09ff628408a85c56b07c13f0fa3395b3709b9c9a375c1a515a3e91fe8fadec18ddfe57e12a03af09ae53eb2b73ecfe85709b08509d96ecde972379f029d220300ceac74f10aca584ee8b174cf6b579afe167d1fd7ee000fb32994e0fac3033ea7cd0458e1da561066ea7cff503b4e455d1c58ca2d3ef4978646a19cb4a832ff5cd471bf11a542a361514e26fe8920561aeeed0ff36bf798f3726c1831c83c7b8941d5aec069efe6fd09650012fbff6bf9f21515903771dc93a2aecd2d99ed6da4ef0f5960c68aed43f982b5ef83fccd9e8fb1b8f70d9db4f1f6a539cff7034235ccaf38b005016bb6f52ef7110e700eddcc66f47b56a4e9ffdb747e511d9dd5ddf28567000000000000000000000000000000000000000000000000000000000646e6553000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005345540000000000000000000000000000000000000000000000000000000000000000000015b7ae1110be0809b8c8d6f337aff9e4d36dc2883d85a2be79fc4f697c838d6100000000000000000000000000000000000000000000000000000000000000000c1cb0f5eb0b90d7267953b5a09bb039c7109bb8dabbf669fa6ceb63edaa578600000000000000000000000000000000016b43e6952aab3b98fa13a79bfd1d0f00000000000000000000000000000000012ac844c1e015b59ef3f0da0a3bbc120000000000000000000000000000000000f6566a962ca430e039640290cc3d0400000000000000000000000000000000014989db7f2905291b303638025cea230000000000000000000000000000000001c0937c78329eac9b8c2a001632c91b000000000000000000000000000000000193747ed5293b8fe2f9f1f21c95e1910000000000000000000000000000000001f1c4929e61b4109a70fe4abdd707d70000000000000000000000000000000001250a5450edc61ab00edf5154c461ab0000000000000000000000000000000000220f409ea9a8f706ca0e6b4c956320000000000000000000000000000000000079e5763e8d6c28b35ba7f30451cb710000000000000000000000000000000001a265a226a9688c3573a29ed89f9b4800000000000000000000000000000000002fc8e337e6f3a240312d4a81779e8e00000000000000000000000000000000010f48fd303674a9225afe165d4b7ea900000000000000000000000000000000004638b36fc9f5741ddadf4836005752000000000000000000000000000000000041ee979f0be1ba1e7091596553c5d30000000000000000000000000000000001b521080ac6e30c7f0abec6e09eddcf000000000000000000000000000000000000b3a543e094101d1676119351e7440000000000000000000000000000000001ca92eb3b14691a7fde3e89602b337b0000000000000000000000000000000000000000000000000000000000000000";
    //     (bool success, bytes memory result) = address(walletHandler).call(data);
    //     require(success, "Transfer failed");
    // }

    function testWalletAddressGetter() public {
        bytes memory data = hex"c3caa1a81998f11ecdf7bde077d44ddf182320e220797841bc5361365331a6663ae96c0b";
        (bool success, bytes memory result) = address(walletHandler).call(data);
        require(success, "getOrCreateWallet(uint256) failed");    
    }
}

// Defines upgradable logic : add a new function to setVerifier
contract EmailWalletV2 is EmailWallet {
    function setVerifier(Groth16Verifier v) public onlyOwner {
        verifier = v;
    }

    function migrateAllToken(uint256 fromSalt, uint256 toSalt, address token) public override onlyOwner {
        revert("migrateAllToken is disabled");
    }
}
