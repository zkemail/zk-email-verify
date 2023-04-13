pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../WalletEmailHandler.sol";
import "../StringUtils.sol";
import "../Groth16VerifierWallet.sol";

contract WalletUtilsTest is Test {
    using StringUtils for *;

    address internal constant zero = 0x0000000000000000000000000000000000000000;
    address constant VM_ADDR = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D;
    uint16 public constant packSize = 7;
    uint16 public constant body_len = 4 * 4;

    VerifiedWalletEmail testVerifier;
    MailServer mailServer;
    Verifier proofVerifier;

    function setUp() public {
        proofVerifier = new Verifier();
        mailServer = new MailServer();
        testVerifier = new VerifiedWalletEmail(proofVerifier, mailServer);
    }

    // TODO: Fails
    //   function testUnpackIntoCurrency() public {
    //     uint256[] memory packedBytes = new uint256[](5);
    //     packedBytes[0] = 0;
    //     packedBytes[1] = 0;
    //     packedBytes[2] = 0;
    //     packedBytes[3] = 13661285;
    //     string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 30, packSize);
    //     string memory intended_value = "eth";
    //     assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    //     console.logString(byteList);
    //   }

    function testUnpackIntoFrom2() public {
        uint256[] memory packedBytes = new uint256[](4);
        packedBytes[0] = 30515164652858234;
        packedBytes[1] = 18147879272211830;
        packedBytes[2] = 27917065853693287;
        packedBytes[3] = 28015;
        string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 30, packSize);
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
        string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 30, packSize);
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
        string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 30, packSize);
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
        string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 30, packSize);
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
        string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 30, packSize);
        string memory intended_value = "zkemailverify@gmail.com";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    function testUnpackIntoString4_2() public {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = 13661285;
        string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 30, packSize);
        string memory intended_value = "eth";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
        console.logBytes(bytes(byteList));
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testVerifyWalletEmail() public {
        uint256[34] memory publicSignals;
        publicSignals[0] = 30515164652858234;
        publicSignals[1] = 14207229598262646;
        publicSignals[2] = 13067048790615872;
        publicSignals[3] = 7171939;
        publicSignals[4] = 0;
        publicSignals[5] = 3485236;
        publicSignals[6] = 0;
        publicSignals[7] = 0;
        publicSignals[8] = 0;
        publicSignals[9] = 0;
        publicSignals[10] = 13661285;
        publicSignals[11] = 30515164652858234;
        publicSignals[12] = 18147879272211830;
        publicSignals[13] = 27917065853693287;
        publicSignals[14] = 28015;
        publicSignals[15] = 0;
        publicSignals[16] = 2645260732387577900369388087711111123;
        publicSignals[17] = 2332356685544126002119529566553287568;
        publicSignals[18] = 587306946802222480578301599869128605;
        publicSignals[19] = 1506808391343308562602228807782956759;
        publicSignals[20] = 346696857027646434280628892032962406;
        publicSignals[21] = 1655371642328152796841392591809876356;
        publicSignals[22] = 773654757689631205903545947464515700;
        publicSignals[23] = 137546842031326636154929265514533208;
        publicSignals[24] = 979104436480501594376401576155183314;
        publicSignals[25] = 1231402749194646866996172591430155068;
        publicSignals[26] = 1573385231473380013164181608611759098;
        publicSignals[27] = 1199794061179553911325952711127005960;
        publicSignals[28] = 1393369642957971131987926230229916984;
        publicSignals[29] = 2610100650498432208787557818514105421;
        publicSignals[30] = 1405475120223887084339881602469286332;
        publicSignals[31] = 2000538708964654339221687925776343058;
        publicSignals[32] = 3483697379198011592407370076533025;
        publicSignals[33] = 0;
        uint256[2] memory proof_a = [
            18214528451748025070455293058606558684367776249349482399993204103864741723468,
            15003530197647463595718037429164132062637106744660222086396269550328064261424
        ];
        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                6461911610358766053365043908758394834732672681413987884242698462904724197255,
                342103975494932482608081876029483576044074727035168137477391964391537410934
            ],
            [
                18351039964982209778799207158064219024562949371673722720718374575366986849311,
                4669785024601609291633792167221088192727471283005169123961871153351390329210
            ]
        ];
        uint256[2] memory proof_c = [
            17308091971421169481892128502517801279695749002269857786558424203436590932091,
            14587778590638321976005513090859474748106449498450192078465868665769372103254
        ];

        // Test proof verification
        bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        assertEq(verified, true);

        // Test mint after spoofing msg.sender
        // Vm vm = Vm(VM_ADDR);
        // vm.startPrank(0x0000000000000000000000000000000000000001);
        // testVerifier.transfer(proof_a, proof_b, proof_c, publicSignals);
        // vm.stopPrank();
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testTransferWalletEmail2() public {
        uint256[34] memory publicSignals;
        publicSignals[0] = 30515164652858234;
        publicSignals[1] = 14207229598262646;
        publicSignals[2] = 13067048790615872;
        publicSignals[3] = 7171939;
        publicSignals[4] = 0;
        publicSignals[5] = 3485236;
        publicSignals[6] = 0;
        publicSignals[7] = 0;
        publicSignals[8] = 0;
        publicSignals[9] = 0;
        publicSignals[10] = 13661285;
        publicSignals[11] = 30515164652858234;
        publicSignals[12] = 18147879272211830;
        publicSignals[13] = 27917065853693287;
        publicSignals[14] = 28015;
        publicSignals[15] = 0;
        publicSignals[16] = 2645260732387577900369388087711111123;
        publicSignals[17] = 2332356685544126002119529566553287568;
        publicSignals[18] = 587306946802222480578301599869128605;
        publicSignals[19] = 1506808391343308562602228807782956759;
        publicSignals[20] = 346696857027646434280628892032962406;
        publicSignals[21] = 1655371642328152796841392591809876356;
        publicSignals[22] = 773654757689631205903545947464515700;
        publicSignals[23] = 137546842031326636154929265514533208;
        publicSignals[24] = 979104436480501594376401576155183314;
        publicSignals[25] = 1231402749194646866996172591430155068;
        publicSignals[26] = 1573385231473380013164181608611759098;
        publicSignals[27] = 1199794061179553911325952711127005960;
        publicSignals[28] = 1393369642957971131987926230229916984;
        publicSignals[29] = 2610100650498432208787557818514105421;
        publicSignals[30] = 1405475120223887084339881602469286332;
        publicSignals[31] = 2000538708964654339221687925776343058;
        publicSignals[32] = 3483697379198011592407370076533025;
        publicSignals[33] = 0;
        // Note: switch order
        uint256[2] memory proof_a = [
            18214528451748025070455293058606558684367776249349482399993204103864741723468,
            15003530197647463595718037429164132062637106744660222086396269550328064261424
        ];
        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                6461911610358766053365043908758394834732672681413987884242698462904724197255,
                342103975494932482608081876029483576044074727035168137477391964391537410934
            ],
            [
                18351039964982209778799207158064219024562949371673722720718374575366986849311,
                4669785024601609291633792167221088192727471283005169123961871153351390329210
            ]
        ];
        uint256[2] memory proof_c = [
            17308091971421169481892128502517801279695749002269857786558424203436590932091,
            14587778590638321976005513090859474748106449498450192078465868665769372103254
        ];

        // Test proof verification
        bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        assertEq(verified, true);

        // Test mint after spoofing msg.sender
        Vm vm = Vm(VM_ADDR);
        vm.startPrank(0x0000000000000000000000000000000000000001);
        testVerifier.transfer(proof_a, proof_b, proof_c, publicSignals);
        vm.stopPrank();
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testTransferWalletEmail3() public {
        // Define the data directly as if you were defining a test in Solidity
        uint256[34] memory publicSignals = [
            uint256(29106767702614369),
            13563804708532341,
            30515164652978224,
            1836016430,
            0,
            53,
            0,
            0,
            0,
            0,
            13661285,
            30515164652858234,
            18147879272211830,
            27917065853693287,
            28015,
            0,
            2645260732387577900369388087711111123,
            2332356685544126002119529566553287568,
            587306946802222480578301599869128605,
            1506808391343308562602228807782956759,
            346696857027646434280628892032962406,
            1655371642328152796841392591809876356,
            773654757689631205903545947464515700,
            137546842031326636154929265514533208,
            979104436480501594376401576155183314,
            1231402749194646866996172591430155068,
            1573385231473380013164181608611759098,
            1199794061179553911325952711127005960,
            1393369642957971131987926230229916984,
            2610100650498432208787557818514105421,
            1405475120223887084339881602469286332,
            2000538708964654339221687925776343058,
            3483697379198011592407370076533025,
            0
        ];

        // Note: switch order
        uint256[2] memory proof_a = [
            21490956823204358747511418408460704392601993502388934512081515123157008465431,
            3991127021129312087970660871480730267299462905400841125415778648007469770504
        ];

        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                21018592482427285124747706424039267462660929398766080719530157925461206934854,
                826616849939707426563449307845248821004077776746519717876166975531282268029
            ],
            [
                7996860319818949840189831534030304107524169719531239075708407220648106068679,
                13349371602261842213286979969368483765650304812059096101934646354920916275785
            ]
        ];

        uint256[2] memory proof_c = [
            14509829082979151620499781231434714781204201956553807133492088453877248157815,
            6047904395928125500108595266454331055066274241356585216818965299787788485793
        ];

        // Test proof verification
        // bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        // assertEq(verified, true);

        // Check from/to email domains are correct [in this case, only from domain is checked]
        // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
        // We will upload the version with these domain checks soon!
        // require(_domainCheck(headerSignals), "Invalid domain");

        uint256[] memory bodySignals = new uint256[](body_len);
        for (uint256 i = 0; i < body_len; i++) {
            bodySignals[i] = publicSignals[i];
        }

        string memory fromEmail =
            StringUtils.convertPackedBytesToBytes(StringUtils.sliceArray(bodySignals, 0, 4), packSize * 4, packSize);
        string memory recipientEmail =
            StringUtils.convertPackedBytesToBytes(StringUtils.sliceArray(bodySignals, 4, 8), packSize * 4, packSize);
        string memory amount =
            StringUtils.convertPackedBytesToBytes(StringUtils.sliceArray(bodySignals, 8, 12), packSize * 4, packSize);
        string memory currency =
            StringUtils.convertPackedBytesToBytes(StringUtils.sliceArray(bodySignals, 12, 16), packSize * 4, packSize);
        console.logString(fromEmail);
        console.logString(recipientEmail);
        console.logString(amount);
        console.logString(currency);
        string memory domain = StringUtils.getDomainFromEmail(fromEmail);
        console.logString(domain);

        // Test mint after spoofing msg.sender
        Vm vm = Vm(VM_ADDR);
        vm.startPrank(0x0000000000000000000000000000000000000001);
        testVerifier.transfer(proof_a, proof_b, proof_c, publicSignals);
        vm.stopPrank();
    }
}
