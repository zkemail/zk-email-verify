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

  // Should fail because it doesnt end in a full 0 byte.
  function testUnpack() public {
    uint256[] memory packedBytes = new uint256[](3);
    packedBytes[0] = 29096824819513600;
    packedBytes[1] = 10;
    packedBytes[2] = 0;
    string memory byteList = testVerifier.convert7PackedBytesToBytes(packedBytes); //, packedBytes.length);
    console.logString(byteList);
  }
}
