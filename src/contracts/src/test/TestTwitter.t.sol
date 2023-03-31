pragma solidity ^0.8.0;
import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../twitterEmailHandler.sol";
import "../emailVerifier.sol";

contract TwitterUtilsTest is Test {
  address internal constant zero = 0x0000000000000000000000000000000000000000;
  address constant VM_ADDR = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D;
  VerifiedTwitterEmail testVerifier;
  Verifier proofVerifier;

  function setUp() public {
    testVerifier = new VerifiedTwitterEmail();
    proofVerifier = new Verifier();
  }

  // function testMint() public {
  //   testVerifier.mint
  // }

  // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
  function testUnpack() public {
    uint256[] memory packedBytes = new uint256[](3);
    packedBytes[0] = 29096824819513600;
    packedBytes[1] = 0;
    packedBytes[2] = 0;

    // This is 0x797573685f670000000000000000000000000000000000000000000000000000
    string memory byteList = testVerifier.convertPackedBytesToBytes(packedBytes, 15);
    // This is 0x797573685f67, since strings are internally arbitrary length arrays
    string memory intended_value = "yush_g";

    // We need to cast both to bytes32, which works since usernames can be at most 15, alphanumeric + '_' characters
    // Note that this may not generalize to non-ascii characters.
    // Weird characters are allowed in email addresses, see https://en.wikipedia.org/wiki/Email_address#Local-part
    // See https://stackoverflow.com/a/2049510/3977093 -- you can even have international characters with RFC 6532
    // Our regex should just disallow most of these emails, but they may end up taking more than two bytes
    // ASCII should fit in 2 bytes but emails may not be ASCII
    assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    console.logString(byteList);

    packedBytes[0] = 28557011619965818;
    packedBytes[1] = 1818845549;
    packedBytes[2] = 0;
    byteList = testVerifier.convertPackedBytesToBytes(packedBytes, 15);
    intended_value = "zktestemail";
    assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    console.logString(byteList);

    packedBytes[0] = 28557011619965818;
    packedBytes[1] = 1818845549;
    packedBytes[2] = 0;
    byteList = testVerifier.convertPackedBytesToBytes(packedBytes, 15);
    intended_value = "zktestemail";
    assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    console.logString(byteList);
  }

  // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
  function testVerifyTestEmail() public {
    uint256[21] memory publicSignals;
    publicSignals[0] = 28557011619965818;
    publicSignals[1] = 1818845549;
    publicSignals[2] = 0;
    publicSignals[3] = 1634582323953821262989958727173988295;
    publicSignals[4] = 1938094444722442142315201757874145583;
    publicSignals[5] = 375300260153333632727697921604599470;
    publicSignals[6] = 1369658125109277828425429339149824874;
    publicSignals[7] = 1589384595547333389911397650751436647;
    publicSignals[8] = 1428144289938431173655248321840778928;
    publicSignals[9] = 1919508490085653366961918211405731923;
    publicSignals[10] = 2358009612379481320362782200045159837;
    publicSignals[11] = 518833500408858308962881361452944175;
    publicSignals[12] = 1163210548821508924802510293967109414;
    publicSignals[13] = 1361351910698751746280135795885107181;
    publicSignals[14] = 1445969488612593115566934629427756345;
    publicSignals[15] = 2457340995040159831545380614838948388;
    publicSignals[16] = 2612807374136932899648418365680887439;
    publicSignals[17] = 16021263889082005631675788949457422;
    publicSignals[18] = 299744519975649772895460843780023483;
    publicSignals[19] = 3933359104846508935112096715593287;
    publicSignals[20] = 1;

    // TODO switch order
    uint256[2] memory proof_a = [
      19927878014774420599335762081097643265718718256586894795640382494403322204498,
      14891682495744632566900850738763676245933032364192093662622519454269163038775
    ];
    // Note: you need to swap the order of the two elements in each subarray
    uint256[2][2] memory proof_b = [
      [14339187615496075499805495539746225674931332745294633353238109947200788411047, 5073539291744271938197991858884932464126239394557616491779032788471213143054],
      [14306493036235766258625927887837901586089699893867499630969317589097278736626, 6852189668501753411744690866678572576357476484128490006857314905430126107219]
    ];
    uint256[2] memory proof_c = [
      410487323277858030399204852640011945213610339130647561627952237033421360197,
      6281805762334485380296289707165572755690746355667398246912272308643846746573
    ];

    // Test proof verification
    bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
    assertEq(verified, true);

    // Test mint after spoofing msg.sender
    Vm vm = Vm(VM_ADDR);
    vm.startPrank(0x0000000000000000000000000000000000000001);
    testVerifier.mint(proof_a, proof_b, proof_c, publicSignals);
    vm.stopPrank();
  }

  // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
  function testVerifyYushEmail() public {
    uint256[21] memory publicSignals;
    publicSignals[0] = 113659471951225;
    publicSignals[1] = 0;
    publicSignals[2] = 0;
    publicSignals[3] = 1634582323953821262989958727173988295;
    publicSignals[4] = 1938094444722442142315201757874145583;
    publicSignals[5] = 375300260153333632727697921604599470;
    publicSignals[6] = 1369658125109277828425429339149824874;
    publicSignals[7] = 1589384595547333389911397650751436647;
    publicSignals[8] = 1428144289938431173655248321840778928;
    publicSignals[9] = 1919508490085653366961918211405731923;
    publicSignals[10] = 2358009612379481320362782200045159837;
    publicSignals[11] = 518833500408858308962881361452944175;
    publicSignals[12] = 1163210548821508924802510293967109414;
    publicSignals[13] = 1361351910698751746280135795885107181;
    publicSignals[14] = 1445969488612593115566934629427756345;
    publicSignals[15] = 2457340995040159831545380614838948388;
    publicSignals[16] = 2612807374136932899648418365680887439;
    publicSignals[17] = 16021263889082005631675788949457422;
    publicSignals[18] = 299744519975649772895460843780023483;
    publicSignals[19] = 3933359104846508935112096715593287;
    publicSignals[20] = 556307310756571904145052207427031380052712977221;

    // TODO switch order
    uint256[2] memory proof_a = [
      9363006867611269678582925935753021647889027030446896413835957187406043727690,
      21630169556253404895678159104497446719574525736987888783761908716313881927992
    ];
    // Note: you need to swap the order of the two elements in each subarray
    uint256[2][2] memory proof_b = [
      [16566593201830840943252718762249962483142131594763397873538075518277702645082, 18567659038303546225106951504886253604470228016916658528973206870511276829533],
      [2266080565824575322432873090363833504418041632970946239667340737263413898232, 2242723441612422425510136818011613824051492998493014918147869951941405078798]
    ];
    uint256[2] memory proof_c = [
      12224501323997049527817799755022184802988108888333268634200461535503052305125,
      3177656185967472916322211236519001250723481802804621893491948147849123768548
    ];
    // Test proof verification
    bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
    assertEq(verified, true);

    // Test mint after spoofing msg.sender
    Vm vm = Vm(VM_ADDR);
    vm.startPrank(0x6171aeBcC9e9B9E1D90EC9C2E124982932297345);
    testVerifier.mint(proof_a, proof_b, proof_c, publicSignals);
    vm.stopPrank();
  }

  function testSVG() public {
    testVerifyYushEmail();
    testVerifyTestEmail();
    string memory svgValue = testVerifier.tokenURI(1);
    // console.log(svgValue);
  }
}
