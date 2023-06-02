pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../WalletEmailHandlerStorage.sol";
import "../WalletEmailHandlerLogic.sol";
import "../WalletEmailHandlerProxy.sol";
import "../TestERC20.sol";
import "../StringUtils.sol";
import "../Groth16VerifierWalletAnon.sol";
import "./MIMC.sol";

contract WalletUtilsTest is Test {
    using StringUtils for *;

    address internal constant zero = 0x0000000000000000000000000000000000000000;
    address constant VM_ADDR = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D;
    uint16 public constant packSizeOld = 7;
    uint16 public constant packSize = 30;
    uint16 public constant body_len = 4 * 4;

    WalletEmailHandlerProxy walletHandler;
    MailServer mailServer;
    Verifier proofVerifier;
    WalletEmailHandlerLogic logic;
    TokenRegistry tokenRegistry;
    TestEmailToken erc20;

    function getChainID() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }

    function setUp() public {
        proofVerifier = new Verifier();
        mailServer = new MailServer();
        erc20 = new TestEmailToken(5000);
        logic = new WalletEmailHandlerLogic();
        tokenRegistry = new TokenRegistry();
        tokenRegistry.updateTokenAddress("TEST", getChainID(), address(erc20));

        console.log("This address:");
        console.log(address(this));
        console.log("Caller/admin address:");
        console.log(msg.sender);
        console.log("Tx origin:");
        console.log(tx.origin);

        bytes memory initData =
            abi.encodeWithSelector(logic.initialize.selector, proofVerifier, mailServer, erc20, tokenRegistry);
        // TODO: Fix admin in place of address(this)
        walletHandler = new WalletEmailHandlerProxy(address(logic), msg.sender, initData);
        // walletHandler.forwardCall(address(walletHandler)).transferOwnership(tx.origin);
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
    function testVerifyWalletEmailSendVerifier() public {
        uint256[26] memory publicSignals = [
            uint256(1684956499),
            12544,
            0,
            452605509632,
            1,
            11578046119786885486589898473893761816011340408005885677852497807442621066251,
            1,
            668633821978676526869556450266953888005839843040173803440403455913247484181,
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
            0
        ];

        uint256[2] memory proof_a = [
            4872484627504163815767110038859301103806605763419531960813764990208898018369,
            3795754906589823037161769237444876552416343748488835176598797103098367263607
        ];

        uint256[2][2] memory proof_b = [
            [
                18376557720828688581045481496486129744102916628430359078845301368276153581701,
                21877761512995850430716476389626777330111796016898814534754595086427125573614
            ],
            [
                12159889909152109241814076562911568076239686025478424469066060467237613288152,
                15701808273441108469395513343272104829223041229728428179673134509885945260640
            ]
        ];

        uint256[2] memory proof_c = [
            15982822555429931992864851554044019444318888053001687160362952266505524933490,
            10069972634237977706980635879331410342197879055629137669963055695388053169516
        ];

        Vm vm = Vm(VM_ADDR);
        
        // Send 50 DAI from DAI contract to the from wallet
        address DAI_ADDR = tokenRegistry.getTokenAddress("DAI");
        vm.startPrank(DAI_ADDR);
        uint256 daiBalance = IERC20(DAI_ADDR).balanceOf(tx.origin);
        assert(daiBalance > 0);
        IERC20(DAI_ADDR).transferFrom(tx.origin, address(uint160(publicSignals[6])), 50000000000000000000);
        daiBalance = IERC20(DAI_ADDR).balanceOf(address(uint160(publicSignals[6])));
        assert(daiBalance > 0);

        // Test transfer after spoofing msg.sender [will eventually match the relayer commitment for gas reimbursement]
        vm.startPrank(0x0000000000000000000000000000000000000001);
        WalletEmailHandlerLogic(address(walletHandler)).transfer(proof_a, proof_b, proof_c, publicSignals);
        vm.stopPrank();
        
        // Test proof verification
        bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        assertEq(verified, true);
    }

    function testMigrateAllERC20() public {
        uint256 fromSalt = 11578046119786885486589898473893761816011340408005885677852497807442621066251;
        uint256 toSalt = 668633821978676526869556450266953888005839843040173803440403455913247484181;
        bytes memory data = abi.encodeWithSignature("migrateAllToken(uint256,uint256,string)", fromSalt, toSalt, "DAI");
        WalletEmailHandlerProxy(walletHandler).forwardCallToLogic(data);

        // bytes memory encodedData =
        //     abi.encodeWithSignature("migrateAllToken(uint256,uint256,string)", fromSalt, toSalt, "DAI");
        // (bool success, bytes memory result) = address(walletHandler).delegatecall(encodedData);
        // console.log(success);
        // console.logBytes(result);
        // assert(walletHandler.getBalance(fromEmail) == 9 * 10 ** erc20.decimals());
        // assert(walletHandler.getBalance(recipientEmail) == 11 * 10 ** erc20.decimals());
    }

    function queryNullifier(uint256 a) public view returns (bool) {
        WalletEmailHandlerStorage handlerStorage = WalletEmailHandlerStorage(walletHandler.getImplementation());
        return handlerStorage.nullifier(a);
    }

    // Upgrades the contract and checks that the nullifier remains used
    function testUpgradeLogicContract() public {
        assertEq(queryNullifier(uint256(0)), false);

        // Set storage values i.e. nullifier
        testVerifyWalletEmailSendVerifier();

        // Deploy a new logic contract
        TestEmptyWalletEmailHandlerLogic newLogicContract = new TestEmptyWalletEmailHandlerLogic();

        // Upgrade the logic contract
        walletHandler.upgradeTo(address(newLogicContract));

        // Re-initialize, pretending we have a new verifier contract
        Verifier newProofVerifier = new Verifier();
        TestEmptyWalletEmailHandlerLogic(walletHandler.getImplementation()).initialize(
            newProofVerifier, mailServer, erc20, tokenRegistry
        );
        TestEmptyWalletEmailHandlerLogic(address(walletHandler)).transferOwnership(tx.origin);

        // Check if the mailServer address is the same
        assertEq(queryNullifier(uint256(0)), true);
    }

    // Upgrades the contract and checks that the nullifier remains used
    function testUpgradeLogicContractNotOwner() public {
        assertEq(queryNullifier(uint256(0)), false);
        
        // Set storage values i.e. nullifier
        testVerifyWalletEmailSendVerifier();
        
        // Deploy a new logic contract
        TestEmptyWalletEmailHandlerLogic newLogicContract = new TestEmptyWalletEmailHandlerLogic();
        
        vm.startPrank(0x0000000000000000000000000000000000000001);
        // Upgrade the logic contract should fail
        try walletHandler.upgradeTo(address(newLogicContract)) {
            revert("Upgrade should fail");
        } catch {
        }
        vm.stopPrank();
    }
}
