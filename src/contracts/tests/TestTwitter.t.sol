pragma solidity ^0.8.0;
import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/twitterEmailHandler.sol";

contract TwitterUtilsTest is Test {
  address internal constant zero = 0x0000000000000000000000000000000000000000;

  function setUp() public {
    testVerifier = new VerifiedTwitterEmail();
  }

  // function testMint() public {
  //   testVerifier.mint
  // }

  function testUnpack() public {
    uint256[] memory packedBytes = [
      10862,
      11919,
      11260,
      12319,
      10641,
      10009,
      6225,
      6696,
      6742,
      5817,
      11772,
      11618,
      13939,
      14305,
      8449,
      12835,
      12084,
      9577,
      13362,
      14197,
      12613,
      8737,
      13240,
      13908,
      12924,
      13219,
      12976,
      13807,
      8189,
      12711,
      7419,
      12975,
      12405,
      7126,
      11290,
      11722,
      13441,
      6979,
      6898,
      7859,
      10335,
      8601,
      9045,
      11325,
      14055,
      9586,
      12899,
      10073,
      13765,
      8694,
      128,
      0,
      0,
      0,
      7840
    ];
    byteList = testVerifier.convert7PackedBytesToBytes(packedBytes, packedBytes.length);
    console.log(byteList);
  }
}
