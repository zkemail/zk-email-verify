pragma solidity ^0.8.0;
import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../twitterEmailHandler.sol";

contract TwitterUtilsTest is Test {
  address internal constant zero = 0x0000000000000000000000000000000000000000;
  VerifiedTwitterEmail testVerifier;

  function setUp() public {
    testVerifier = new VerifiedTwitterEmail();
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
    string memory byteList = testVerifier.convert7PackedBytesToBytes(packedBytes);
    // This is 0x797573685f67, since strings are internally arbitrary length arrays
    string memory intended_value = "yush_g";

    // We need to cast both to bytes32, which works since usernames can be at most 15, alphanumeric + '_' characters
    // Note that this may not generalize to non-ascii characters.
    // Weird characters are allowed in email addresses, see https://en.wikipedia.org/wiki/Email_address#Local-part
    // See https://stackoverflow.com/a/2049510/3977093 -- you can even have international characters with RFC 6532
    // Our regex should just disallow most of these emails, but they may end up taking more than two bytes
    // ASCII should fit in 2 bytes but emails may not be ASCII
    assertEq(bytes32(bytes(byteList)), bytes32(bytes(value)));
    console.logString(byteList);
  }
}
