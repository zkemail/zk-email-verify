pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../WalletEmailHandler.sol";
import "../TestERC20.sol";
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
  TestEmailToken erc20;

  function setUp() public {
    proofVerifier = new Verifier();
    mailServer = new MailServer();
    erc20 = new TestEmailToken(5000);
    testVerifier = new VerifiedWalletEmail(proofVerifier, mailServer, erc20);
  }

  // TODO: Fails
  //   function testUnpackIntoCurrency() public {
  //     uint256[] memory packedBytes = new uint256[](5);
  //     packedBytes[0] = 0;
  //     packedBytes[1] = 0;
  //     packedBytes[2] = 0;
  //     packedBytes[3] = 13661285;
  //     string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
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
    string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
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
    string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
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
    string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
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
    string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
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
    string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
    string memory intended_value = "zkemailverify@gmail.com";
    assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    console.logString(byteList);
  }

  function testUnpackIntoString4_2() public {
    uint256[] memory packedBytes = new uint256[](1);
    packedBytes[0] = 13661285;
    string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 30, packSize);
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
      [6461911610358766053365043908758394834732672681413987884242698462904724197255, 342103975494932482608081876029483576044074727035168137477391964391537410934],
      [18351039964982209778799207158064219024562949371673722720718374575366986849311, 4669785024601609291633792167221088192727471283005169123961871153351390329210]
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
  // The last value constrains the proof to only execute on one chain or with one verifier etc
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
      [6461911610358766053365043908758394834732672681413987884242698462904724197255, 342103975494932482608081876029483576044074727035168137477391964391537410934],
      [18351039964982209778799207158064219024562949371673722720718374575366986849311, 4669785024601609291633792167221088192727471283005169123961871153351390329210]
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

  // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)function testTransferWalletEmail3() public {
  function testTransferWalletEmail3() public {
    uint256[34] memory publicSignals = [
      uint256(30515164652858234),
      18147879272211830,
      27917065853693287,
      28015,
      0,
      50,
      0,
      0,
      0,
      0,
      13762560,
      30515164652858234,
      14207229598262646,
      13067048790615872,
      7171939,
      0,
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
      18568569282385577752003966587062685654688127322905645867690168113644909624209,
      18759903706259146962639961745797835986209265804220236624283397965640158483190
    ];

    uint256[2][2] memory proof_b = [
      [5803446705026913357518568395981657569264671269353189435142412707651256173413, 8593766898146870509264586194439641404493723665652266429471383540616111544172],
      [16046700810774537572443697469030305204645791362097372667928847558873110846124, 20178806529375442298313753931928150693393269974972769756293026303013302674806]
    ];

    uint256[2] memory proof_c = [
      13905944782945043014900524454195421236229551576754549828484627488690083504903,
      21309166547782902503710040024457074452294672356307955049572131380081774653722
    ];

    console.log("Calldata");
    console.logBytes(abi.encode(proof_a, proof_b, proof_c, publicSignals));

    // Test proof verification
    bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
    assertEq(verified, true);

    // Test mint after spoofing msg.sender
    Vm vm = Vm(VM_ADDR);
    vm.startPrank(0x0000000000000000000000000000000000000001);
    testVerifier.transfer(proof_a, proof_b, proof_c, publicSignals);
    vm.stopPrank();

    assert(testVerifier.getBalance("zkemailverify@gmail.com") == 8 * 10 ** erc20.decimals());
    assert(testVerifier.getBalance("zkemailverify2@gmail.com") == 12 * 10 ** erc20.decimals());
  }

  function testMoveERC20() public {
    string memory fromEmail = "zkemailverify@gmail.com";
    string memory recipientEmail = "zkemailverify2@gmail.com";
    uint256 amountToTransfer = 1 * 10 ** erc20.decimals();
    testVerifier.moveTokens(bytes32(bytes(fromEmail)), bytes32(bytes(recipientEmail)), amountToTransfer);
    assert(testVerifier.getBalance(fromEmail) == 9 * 10 ** erc20.decimals());
    assert(testVerifier.getBalance(recipientEmail) == 11 * 10 ** erc20.decimals());
  }
}
