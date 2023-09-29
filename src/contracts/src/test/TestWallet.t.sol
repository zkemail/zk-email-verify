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
        erc20 = new TestEmailToken(5000);
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

    // Old unpacks
    function testUnpackIntoFrom2() public {
        uint256[] memory packedBytes = new uint256[](4);
        packedBytes[0] = 30515164652858234;
        packedBytes[1] = 18147879272211830;
        packedBytes[2] = 27917065853693287;
        packedBytes[3] = 28015;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSizeOld);
        string memory intended_value = "zkemailverify@gmail.com";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    function testUnpackIntoFrom2_1() public {
        uint256[] memory packedBytes = new uint256[](4);
        packedBytes[0] = 30515164652858234;
        packedBytes[1] = 14207229598262646;
        packedBytes[2] = 13067048790615872;
        packedBytes[3] = 7171939;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSizeOld);
        string memory intended_value = "zkemailverify2@gmail.com";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    // Note that decimal points are removed
    function testUnpackIntoFloat3() public {
        uint256[] memory packedBytes = new uint256[](4);
        packedBytes[0] = 0;
        packedBytes[1] = 3485236;
        packedBytes[2] = 0;
        packedBytes[3] = 0;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSizeOld);
        string memory intended_value = "4.5";
        assertEq(StringUtils.stringToUint(byteList), 4);
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    function testUnpackIntoString4() public {
        uint256[] memory packedBytes = new uint256[](4);
        packedBytes[0] = 30515164652858234;
        packedBytes[1] = 14207229598262646;
        packedBytes[2] = 13067048790615872;
        packedBytes[3] = 7171939;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSizeOld);
        string memory intended_value = "zkemailverify2@gmail.com";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    function testUnpackIntoString4_1() public {
        uint256[] memory packedBytes = new uint256[](4);
        packedBytes[0] = 30515164652858234;
        packedBytes[1] = 18147879272211830;
        packedBytes[2] = 27917065853693287;
        packedBytes[3] = 28015;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSizeOld);
        string memory intended_value = "zkemailverify@gmail.com";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    // TODO: This test succeeds but it should really be matching TEST...
    function testUnpackIntoString_TES() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 357645418496;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSizeOld);
        string memory intended_value = "TES";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    function testUnpackIntoString_Pack30_0() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 1684956499;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
        string memory intended_value = "Send";
        console.logString(byteList);
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    }

    function testUnpackIntoString_Pack30_1() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 12544;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
        string memory intended_value = "1";
        console.logString(byteList);
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    }

    function testUnpackIntoString_Pack30_2() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 452605509632;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
        string memory intended_value = "dai";
        console.logString(byteList);
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testTransfer() public {
        uint256[27] memory publicSignals = [
            1684956499,
            12800,
            0,
            357645418496,
            1,
            17566086257910673581798227137386378880654499631805096745898016564277405173221,
            1,
            10351006309161521407380889618696480886000391759520254704936747509011242520900,
            1886180949733815343726466520516992271,
            1551366393280668736485689616947198994,
            1279057759087427731263511728885611780,
            1711061746895435768547617398484429347,
            2329140368326888129406637741054282011,
            2094858442222190249786465516374057361,
            2584558507302599829894674874442909655,
            1521552483858643935889582214011445675,
            176847449040377757035522930003764000,
            632921959964166974634188077062540145,
            2172441457165086627497230906075093832,
            248112436365636977369105357296082574,
            1408592841800630696650784801114783401,
            364610811473321782531041012695979858,
            342338521965453258686441392321054163,
            2269703683857229911110544415296249295,
            3643644972862751728748413716653892,
            1091732335831413889009840339977333876,
            0
        ];

        uint256[2] memory proof_a = [
            21493526399630848714088576758790000612983801908965363000944303489035643164732,
            612472284266767912042190211361186336975534684437563301308490256402913981593
        ];

        uint256[2][2] memory proof_b = [
            [
                15366895889108502348938089955913933229050968003147382792567346096201019063883,
                15372974992241689584466152555994768384059989900465963124874246340360734821996
            ],
            [
                12781455257035000726917415477817976016404022734103586934519011190860062337748,
                9236744782651475998928188339673956940316908995565005955716093491759519828720
            ]
        ];

        uint256[2] memory proof_c = [
            9321829112233388416227573508407590056900008135887969264346125936097751965530,
            17887217773313831412531089288283151845052667698841944883373350348459704907197
        ];

        // Send 50 DAI from DAI contract (from people who accidentally sent it there) to the from wallet, as if they had sent that
        address DAI_ADDR = tokenRegistry.getTokenAddress("DAI");
        uint256 fromSalt = publicSignals[5];
        address from_addr = EmailWallet(address(walletHandler)).getOrCreateWallet(fromSalt);

        uint256 toSalt = publicSignals[7];
        address to_addr = EmailWallet(address(walletHandler)).getOrCreateWallet(toSalt);

        // Transfer money from the literal DAI contract to the from wallet
        vm.startPrank(DAI_ADDR);
        uint256 daiAmount = 1 * 10 ** ERC20(DAI_ADDR).decimals();
        uint256 daiBalance = IERC20(DAI_ADDR).balanceOf(DAI_ADDR);
        assert(daiBalance >= daiAmount);
        IERC20(DAI_ADDR).transfer(from_addr, daiAmount);
        uint256 startingFromDaiBalance = IERC20(DAI_ADDR).balanceOf(from_addr);
        assert(startingFromDaiBalance >= daiAmount);
        vm.stopPrank();

        // Test email transfer from any address after spoofing msg.sender to a relayer
        // Right now this passes, but will have to eventually match the relayer commitment for gas reimbursement, at which point it will fail
        EmailWallet(address(walletHandler)).transfer(proof_a, proof_b, proof_c, publicSignals);

        // Test proof verification
        bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        assertEq(verified, true);

        // Test new balances of the from/to wallet
        assert(startingFromDaiBalance > IERC20(DAI_ADDR).balanceOf(from_addr));
        assert(IERC20(DAI_ADDR).balanceOf(to_addr) >= 0);

        // TODO: Test gas reimbursement for the relayer

        // Test emergency migrate back
        // vm.startPrank(tx.origin);
        console.log("Our wallet:");
        console.log(address(this));
        console.log(EmailWallet(address(walletHandler)).owner());

        // Call migrate as owner
        vm.startPrank(owner);
        EmailWallet(address(walletHandler)).migrateAllToken(toSalt, fromSalt, "DAI");
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
    function testSendingTestTokens() public {
        bytes memory data =
            hex"09ff628408a85c56b07c13f0fa3395b3709b9c9a375c1a515a3e91fe8fadec18ddfe57e12a03af09ae53eb2b73ecfe85709b08509d96ecde972379f029d220300ceac74f10aca584ee8b174cf6b579afe167d1fd7ee000fb32994e0fac3033ea7cd0458e1da561066ea7cff503b4e455d1c58ca2d3ef4978646a19cb4a832ff5cd471bf11a542a361514e26fe8920561aeeed0ff36bf798f3726c1831c83c7b8941d5aec069efe6fd09650012fbff6bf9f21515903771dc93a2aecd2d99ed6da4ef0f5960c68aed43f982b5ef83fccd9e8fb1b8f70d9db4f1f6a539cff7034235ccaf38b005016bb6f52ef7110e700eddcc66f47b56a4e9ffdb747e511d9dd5ddf28567000000000000000000000000000000000000000000000000000000000646e6553000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005345540000000000000000000000000000000000000000000000000000000000000000000015b7ae1110be0809b8c8d6f337aff9e4d36dc2883d85a2be79fc4f697c838d6100000000000000000000000000000000000000000000000000000000000000000c1cb0f5eb0b90d7267953b5a09bb039c7109bb8dabbf669fa6ceb63edaa578600000000000000000000000000000000016b43e6952aab3b98fa13a79bfd1d0f00000000000000000000000000000000012ac844c1e015b59ef3f0da0a3bbc120000000000000000000000000000000000f6566a962ca430e039640290cc3d0400000000000000000000000000000000014989db7f2905291b303638025cea230000000000000000000000000000000001c0937c78329eac9b8c2a001632c91b000000000000000000000000000000000193747ed5293b8fe2f9f1f21c95e1910000000000000000000000000000000001f1c4929e61b4109a70fe4abdd707d70000000000000000000000000000000001250a5450edc61ab00edf5154c461ab0000000000000000000000000000000000220f409ea9a8f706ca0e6b4c956320000000000000000000000000000000000079e5763e8d6c28b35ba7f30451cb710000000000000000000000000000000001a265a226a9688c3573a29ed89f9b4800000000000000000000000000000000002fc8e337e6f3a240312d4a81779e8e00000000000000000000000000000000010f48fd303674a9225afe165d4b7ea900000000000000000000000000000000004638b36fc9f5741ddadf4836005752000000000000000000000000000000000041ee979f0be1ba1e7091596553c5d30000000000000000000000000000000001b521080ac6e30c7f0abec6e09eddcf000000000000000000000000000000000000b3a543e094101d1676119351e7440000000000000000000000000000000001ca92eb3b14691a7fde3e89602b337b0000000000000000000000000000000000000000000000000000000000000000";
        (bool success, bytes memory result) = address(walletHandler).call(data);
        require(success, "Transfer failed");
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
