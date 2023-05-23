pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../WalletEmailHandler.sol";
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

    WalletEmailHandlerProxy testVerifier;
    MailServer mailServer;
    Verifier proofVerifier;
    WalletEmailHandlerLogic logic;
    TokenRegistry tokenRegistry;
    TestEmailToken erc20;

    function setUp() public {
        proofVerifier = new Verifier();
        mailServer = new MailServer();
        erc20 = new TestEmailToken(5000);
        logic = new WalletEmailHandlerLogic();
        tokenRegistry = new TokenRegistry();
        address admin = msg.sender;
        console.log("This address:");
        console.log(address(this));
        console.log("Caller/admin address:");
        console.log(msg.sender);
        // Initialize logic
        logic.initialize(proofVerifier, mailServer, erc20, tokenRegistry);

        bytes memory initData = abi.encodeWithSignature(
            "initialize(Verifier,MailServer,TestEmailToken,TokenRegistry)",
            proofVerifier,
            mailServer,
            erc20,
            tokenRegistry
        );
        // TODO: Fix admin in place of address(this)
        testVerifier = new WalletEmailHandlerProxy(address(logic), address(this), initData);
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

        console.log("Calldata");
        console.logBytes(abi.encode(proof_a, proof_b, proof_c, publicSignals));

        // Test proof verification
        bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        assertEq(verified, true);

        // Test mint after spoofing msg.sender
        Vm vm = Vm(VM_ADDR);
        vm.startPrank(0x0000000000000000000000000000000000000001);
        bytes memory encodedData = abi.encodeWithSignature(
            "transfer(uint256[2],uint256[2][2],uint256[2],uint256[26])", proof_a, proof_b, proof_c, publicSignals
        );
        (bool success, bytes memory result) = address(testVerifier).delegatecall(encodedData);
        console.log(success);
        console.logBytes(result);
        vm.stopPrank();
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)function testTransferWalletEmail3() public {
    // function testTransferWalletEmailSendVerifier2() public {
    //     uint256[34] memory publicSignals = [
    //         uint256(30515164652858234),
    //         18147879272211830,
    //         27917065853693287,
    //         28015,
    //         0,
    //         50,
    //         0,
    //         0,
    //         0,
    //         0,
    //         13762560,
    //         30515164652858234,
    //         14207229598262646,
    //         13067048790615872,
    //         7171939,
    //         0,
    //         1886180949733815343726466520516992271,
    //         1551366393280668736485689616947198994,
    //         1279057759087427731263511728885611780,
    //         1711061746895435768547617398484429347,
    //         2329140368326888129406637741054282011,
    //         2094858442222190249786465516374057361,
    //         2584558507302599829894674874442909655,
    //         1521552483858643935889582214011445675,
    //         176847449040377757035522930003764000,
    //         632921959964166974634188077062540145,
    //         2172441457165086627497230906075093832,
    //         248112436365636977369105357296082574,
    //         1408592841800630696650784801114783401,
    //         364610811473321782531041012695979858,
    //         342338521965453258686441392321054163,
    //         2269703683857229911110544415296249295,
    //         3643644972862751728748413716653892,
    //         0
    //     ];

    //     uint256[2] memory proof_a = [
    //         18568569282385577752003966587062685654688127322905645867690168113644909624209,
    //         18759903706259146962639961745797835986209265804220236624283397965640158483190
    //     ];

    //     uint256[2][2] memory proof_b = [
    //         [
    //             5803446705026913357518568395981657569264671269353189435142412707651256173413,
    //             8593766898146870509264586194439641404493723665652266429471383540616111544172
    //         ],
    //         [
    //             16046700810774537572443697469030305204645791362097372667928847558873110846124,
    //             20178806529375442298313753931928150693393269974972769756293026303013302674806
    //         ]
    //     ];

    //     uint256[2] memory proof_c = [
    //         13905944782945043014900524454195421236229551576754549828484627488690083504903,
    //         21309166547782902503710040024457074452294672356307955049572131380081774653722
    //     ];

    //     console.log("Calldata");
    //     console.logBytes(abi.encode(proof_a, proof_b, proof_c, publicSignals));

    //     // Test proof verification
    //     bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
    //     assertEq(verified, true);

    //     // Test mint after spoofing msg.sender
    //     Vm vm = Vm(VM_ADDR);
    //     vm.startPrank(0x0000000000000000000000000000000000000001);
    //     bytes memory encodedData = abi.encodeWithSignature(
    //         "transfer(uint256[2],uint256[2][2],uint256[2],uint256[26])",
    //         proof_a, proof_b, proof_c, publicSignals
    //     );
    //     (bool success, bytes memory result) = address(testVerifier).delegatecall(encodedData);

    //     vm.stopPrank();

    //     assert(testVerifier.getBalance("zkemailverify@gmail.com") == 8 * 10 ** erc20.decimals());
    //     assert(testVerifier.getBalance("zkemailverify2@gmail.com") == 12 * 10 ** erc20.decimals());
    // }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)function testTransferWalletEmail3() public {
    // function testTransferWalletEmailCommandVerifier() public {
    //     uint256[34] memory publicSignals = [
    //         uint256(30515164652858234),
    //         18147879272211830,
    //         27917065853693287,
    //         28015,
    //         0,
    //         50,
    //         0,
    //         0,
    //         0,
    //         0,
    //         13762560,
    //         30515164652858234,
    //         14207229598262646,
    //         13067048790615872,
    //         7171939,
    //         0,
    //         1886180949733815343726466520516992271,
    //         1551366393280668736485689616947198994,
    //         1279057759087427731263511728885611780,
    //         1711061746895435768547617398484429347,
    //         2329140368326888129406637741054282011,
    //         2094858442222190249786465516374057361,
    //         2584558507302599829894674874442909655,
    //         1521552483858643935889582214011445675,
    //         176847449040377757035522930003764000,
    //         632921959964166974634188077062540145,
    //         2172441457165086627497230906075093832,
    //         248112436365636977369105357296082574,
    //         1408592841800630696650784801114783401,
    //         364610811473321782531041012695979858,
    //         342338521965453258686441392321054163,
    //         2269703683857229911110544415296249295,
    //         3643644972862751728748413716653892,
    //         0
    //     ];

    //     uint256[2] memory proof_a = [
    //         18568569282385577752003966587062685654688127322905645867690168113644909624209,
    //         18759903706259146962639961745797835986209265804220236624283397965640158483190
    //     ];

    //     uint256[2][2] memory proof_b = [
    //         [
    //             5803446705026913357518568395981657569264671269353189435142412707651256173413,
    //             8593766898146870509264586194439641404493723665652266429471383540616111544172
    //         ],
    //         [
    //             16046700810774537572443697469030305204645791362097372667928847558873110846124,
    //             20178806529375442298313753931928150693393269974972769756293026303013302674806
    //         ]
    //     ];

    //     uint256[2] memory proof_c = [
    //         13905944782945043014900524454195421236229551576754549828484627488690083504903,
    //         21309166547782902503710040024457074452294672356307955049572131380081774653722
    //     ];

    //     console.log("Calldata");
    //     console.logBytes(abi.encode(proof_a, proof_b, proof_c, publicSignals));

    //     // Test proof verification
    //     bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
    //     assertEq(verified, true);

    //     // Test mint after spoofing msg.sender
    //     Vm vm = Vm(VM_ADDR);
    //     vm.startPrank(0x0000000000000000000000000000000000000001);
    //     testVerifier.transfer(proof_a, proof_b, proof_c, publicSignals);
    //     vm.stopPrank();

    //     assert(testVerifier.getBalance("zkemailverify@gmail.com") == 8 * 10 ** erc20.decimals());
    //     assert(testVerifier.getBalance("zkemailverify2@gmail.com") == 12 * 10 ** erc20.decimals());
    // }

    function testMigrateAllERC20() public {
        uint256 fromSalt = 11578046119786885486589898473893761816011340408005885677852497807442621066251;
        uint256 toSalt = 668633821978676526869556450266953888005839843040173803440403455913247484181;
        bytes memory encodedData =
            abi.encodeWithSignature("migrateAllToken(uint256,uint256,string)", fromSalt, toSalt, "DAI");
        (bool success, bytes memory result) = address(testVerifier).delegatecall(encodedData);
        console.log(success);
        console.logBytes(result);
        // assert(testVerifier.getBalance(fromEmail) == 9 * 10 ** erc20.decimals());
        // assert(testVerifier.getBalance(recipientEmail) == 11 * 10 ** erc20.decimals());
    }
}
