// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../wallet/WalletEmailHandlerStorage.sol";
import "../wallet/WalletEmailHandlerLogic.sol";
import "../wallet/WalletEmailHandlerProxy.sol";
import "../wallet/TestERC20.sol";
import "../utils/StringUtils.sol";
import "../wallet/Groth16VerifierWalletAnon.sol";
import "../../script/DeployWallet.s.sol";
import "../wallet/MIMC.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract IERC20DAI {
    uint8 public constant decimals = 18;
}

pragma solidity ^0.8.0;

contract WalletUtilsTest is Test {
    using StringUtils for *;

    address internal constant zero = 0x0000000000000000000000000000000000000000;
    address constant VM_ADDR = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D;
    uint16 public constant packSizeOld = 7;
    uint16 public constant packSize = 30;
    uint16 public constant body_len = 4 * 4;

    WalletEmailHandlerProxy walletHandler;
    MailServer mailServer;
    Groth16Verifier proofVerifier;
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

    function getPrivateKey() internal view returns (uint256) {
        try vm.envUint("PRIVATE_KEY") returns (uint256 privateKey) {
            return privateKey;
        } catch {
            // This is the anvil default exposed secret key
            return 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }
    }

    function testDeploy() public {
        console.log("Deploy msg.sender, tx.origin:");
        console.log(msg.sender);
        console.log(tx.origin);

        Deploy d = new Deploy();
        (address __walletHandler, address _mailServer, address _erc20, address _tokenRegistry, address _proofVerifier) =
            d.run();
        address payable _walletHandler = payable(__walletHandler);
        walletHandler = WalletEmailHandlerProxy(_walletHandler);
        mailServer = MailServer(_mailServer);
        erc20 = TestEmailToken(_erc20);
        tokenRegistry = TokenRegistry(_tokenRegistry);
        proofVerifier = Groth16Verifier(_proofVerifier);
    }

    function setUp() public {
        testDeploy();
        console.log("Proxy admin:");
        console.log(walletHandler.getAdmin());
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
            12544,
            0,
            314627588096,
            1,
            2551778469022082483410965627889617426416823186429164335788418290029794051477,
            1,
            5034778214643319837174799286363441309283744411470368822683043587378340024371,
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
            116047924164413653745103509059638115,
            0
        ];

        uint256[2] memory proof_a = [
            1113058512136436528729551194036449738912809020899493741812481941513158457638,
            17904238425624368116392089213880809397074718297748087534228874805395955569494
        ];

        uint256[2][2] memory proof_b = [
            [
                11136219955279097153007034948647904013979918882403246697434191106345505294456,
                9093260394613016872854441391208801395771529268798604188959340370147578029605
            ],
            [
                19132160993168472870012250865400668085339138976788531705508362264317915314664,
                7997890521177636789422279131989585239901152973726825553496440950816823393760
            ]
        ];

        uint256[2] memory proof_c = [
            4578204096286765672152304159882317307749862613194650587092484493827496450319,
            20337996863975282865934752324832426699547899381722526747380818118899270980656
        ];

        // Send 50 DAI from DAI contract (from people who accidentally sent it there) to the from wallet, as if they had sent that
        address DAI_ADDR = tokenRegistry.getTokenAddress("DAI");
        uint256 fromSalt = publicSignals[5];
        address from_addr = WalletEmailHandlerLogic(address(walletHandler)).getOrCreateWallet(fromSalt);

        uint256 toSalt = publicSignals[7];
        address to_addr = WalletEmailHandlerLogic(address(walletHandler)).getOrCreateWallet(toSalt);

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
        vm.startPrank(0x0000000000000000000000000000000000000001);
        WalletEmailHandlerLogic(address(walletHandler)).transfer(proof_a, proof_b, proof_c, publicSignals);
        vm.stopPrank();

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
        WalletEmailHandlerLogic(address(walletHandler)).migrateAllToken(toSalt, fromSalt, "DAI");
        // vm.stopPrank();
    }

    function queryNullifier(uint256 a) public view returns (bool) {
        WalletEmailHandlerStorage handlerStorage = WalletEmailHandlerStorage(address(walletHandler));
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

        // Deploy a new logic contract from the tx.origin
        vm.startPrank(tx.origin);
        TestEmptyWalletEmailHandlerLogic newLogicContract = new TestEmptyWalletEmailHandlerLogic();
        walletHandler.upgradeTo(address(newLogicContract));
        vm.stopPrank();

        // Re-initialize, pretending we have a new verifier contract
        Groth16Verifier newProofVerifier = new Groth16Verifier();
        TestEmptyWalletEmailHandlerLogic(walletHandler.getImplementation()).initialize(
            newProofVerifier, mailServer, erc20, tokenRegistry
        );
        TestEmptyWalletEmailHandlerLogic(address(walletHandler)).transferOwnership(tx.origin);

        // Ensure the nullifier is still used
        assertEq(queryNullifier(uint256(0)), true);
    }
}
