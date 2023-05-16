pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
// import "../TwitterEmailHandler.sol";
// import "../Groth16VerifierTwitter.sol";
import "../KYCEmailHandler.sol";
import "../Groth16VerifierKYC.sol";

contract TwitterUtilsTest is Test {
  using StringUtils for *;

  address constant VM_ADDR = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D; // Hardcoded address of the VM from foundry

  Verifier proofVerifier;
  MailServer mailServer;
  VerifiedKYCEmail testVerifier;

  uint16 public constant packSize = 7;

  function setUp() public {
    proofVerifier = new Verifier();
    mailServer = new MailServer();
    testVerifier = new VerifiedKYCEmail(proofVerifier, mailServer);
  }

  // function testMint() public {
  //   testVerifier.mint
  // }

  // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
  function testUnpack1() public {
    uint256[] memory packedBytes = new uint256[](3);
    packedBytes[0] = 29096824819513600;
    packedBytes[1] = 0;
    packedBytes[2] = 0;

    // This is 0x797573685f670000000000000000000000000000000000000000000000000000
    // packSize = 7
    string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 15, packSize);
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
  }

  function testUnpack2() public {
    uint256[] memory packedBytes = new uint256[](3);
    packedBytes[0] = 28557011619965818;
    packedBytes[1] = 1818845549;
    packedBytes[2] = 0;
    string memory byteList = StringUtils.convertPackedBytesToBytes(packedBytes, 15, packSize);
    string memory intended_value = "zktestemail";
    assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
    console.logString(byteList);
  }

  // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
  function testVerifyTestEmail() public {
    uint256[40] memory publicSignals;
    publicSignals[0] = 70690609871614406;
    publicSignals[1] = 58055581588623508;
    publicSignals[2] = 22397246651374549;
    publicSignals[3] = 37318600150826822;
    publicSignals[4] = 2261577407;
    publicSignals[5] = 746442972966401920475725247700175361147866454362;
    publicSignals[6] = 1782267151472132502396673758441738163;
    publicSignals[7] = 211482981992850046267405122085516466;
    publicSignals[8] = 454331740279802979553218083106524093;
    publicSignals[9] = 2403631535172814929511297080499227501;
    publicSignals[10] = 2245858962887391502631714271235221261;
    publicSignals[11] = 2622546081161044621195511843069142201;
    publicSignals[12] = 1247628895302131918172499597775434966;
    publicSignals[13] = 1584816411261150842617500336767389232;
    publicSignals[14] = 52914273202064513;
    publicSignals[15] = 0;
    publicSignals[16] = 0;
    publicSignals[17] = 0;
    publicSignals[18] = 0;
    publicSignals[19] = 0;
    publicSignals[20] = 0;
    publicSignals[21] = 0;
    publicSignals[22] = 0;
    publicSignals[23] = 1345060269316532707410324038691477859;
    publicSignals[24] = 384766469338727068594017962971556116;
    publicSignals[25] = 168911276988157118943281324996362385;
    publicSignals[26] = 1165220578700378509253846448878043993;
    publicSignals[27] = 1468253564629208485538769233538980768;
    publicSignals[28] = 2375057771089481827666297753868306658;
    publicSignals[29] = 1859460967236870128489365675225233949;
    publicSignals[30] = 2514159567794221963503259554592798082;
    publicSignals[31] = 37369779987712517;
    publicSignals[32] = 0;
    publicSignals[33] = 0;
    publicSignals[34] = 0;
    publicSignals[35] = 0;
    publicSignals[36] = 0;
    publicSignals[37] = 0;
    publicSignals[38] = 0;
    publicSignals[39] = 0;


    uint256[2] memory proof_a = [
        10862079222762785405941280086399026869200326165206154620732603812878833885377,
        4208139996377154785195812689695308432097093394702441574332516425978972244739
    ];

    uint256[2][2] memory proof_b = [
        [9479317161521317673805716203059784868565164065844597368177915626332459107498, 9843182691571915655087350056319266721175223408718168238551325859304800994205],
        [17629199875460838247663679794879603175329419799461256868402688444214598051409, 2002658621721373627570318787729557231703934573405726404696838197310474396618]
    ];

    uint256[2] memory proof_c = [
        18044975281122236912928498020946409345131533244841032618058344425298894334856,
        2535152307925787078717326492571479491716008880650244024542736428184268425484
    ];


    // Test proof verification
    bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
    assertEq(verified, true);

    // Test mint after spoofing msg.sender
    Vm vm = Vm(VM_ADDR);
    vm.startPrank(0x82Bfa918D51e8b6Ac23cC5425b50B60BdccC195a);
    testVerifier.mint(proof_a, proof_b, proof_c, publicSignals);
    vm.stopPrank();
  }
}