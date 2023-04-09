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
  VerifiedWalletEmail testVerifier;
  Verifier proofVerifier;

  function setUp() public {
    testVerifier = new VerifiedWalletEmail();
    proofVerifier = new Verifier();
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

  function testUnpackIntoFloat4() public {
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
}
