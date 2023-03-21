// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
// import "./base64.sol";
import "./hexStrings.sol";
import "./NFTSVG.sol";
import "./emailVerifier.sol";

contract VerifiedTwitterEmail is ERC721Enumerable, Verifier {
  using Counters for Counters.Counter;
  using HexStrings for *;
  using NFTSVG for *;

  Counters.Counter private tokenCounter;

  uint16 public constant msg_len = 21; // header + body
  uint16 public constant bytesInPackedBytes = 7; // 7 bytes in a packed item returned from circom
  uint256 public constant body_len = 3;
  uint256 public constant rsa_modulus_chunks_len = 17;
  uint256 public constant header_len = msg_len - body_len;
  uint256 public constant addressIndexInSignals = msg_len - 1; // TODO: FIX CONSTANT

  mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
  mapping(uint256 => string) public tokenIDToName;
  string constant domain = "twitter.com";

  constructor() ERC721("VerifiedEmail", "VerifiedEmail") {
    // Do dig TXT outgoing._domainkey.twitter.com to verify these.
    // This is the base 2^121 representation of that key.
    // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
    require(rsa_modulus_chunks_len + body_len + 1 == msg_len, "Variable counts are wrong!");
    verifiedMailserverKeys["twitter.com"][0] = 1634582323953821262989958727173988295;
    verifiedMailserverKeys["twitter.com"][1] = 1938094444722442142315201757874145583;
    verifiedMailserverKeys["twitter.com"][2] = 375300260153333632727697921604599470;
    verifiedMailserverKeys["twitter.com"][3] = 1369658125109277828425429339149824874;
    verifiedMailserverKeys["twitter.com"][4] = 1589384595547333389911397650751436647;
    verifiedMailserverKeys["twitter.com"][5] = 1428144289938431173655248321840778928;
    verifiedMailserverKeys["twitter.com"][6] = 1919508490085653366961918211405731923;
    verifiedMailserverKeys["twitter.com"][7] = 2358009612379481320362782200045159837;
    verifiedMailserverKeys["twitter.com"][8] = 518833500408858308962881361452944175;
    verifiedMailserverKeys["twitter.com"][9] = 1163210548821508924802510293967109414;
    verifiedMailserverKeys["twitter.com"][10] = 1361351910698751746280135795885107181;
    verifiedMailserverKeys["twitter.com"][11] = 1445969488612593115566934629427756345;
    verifiedMailserverKeys["twitter.com"][12] = 2457340995040159831545380614838948388;
    verifiedMailserverKeys["twitter.com"][13] = 2612807374136932899648418365680887439;
    verifiedMailserverKeys["twitter.com"][14] = 16021263889082005631675788949457422;
    verifiedMailserverKeys["twitter.com"][15] = 299744519975649772895460843780023483;
    verifiedMailserverKeys["twitter.com"][16] = 3933359104846508935112096715593287;
  }

  function tokenDesc(uint256 tokenId) public view returns (string memory) {
    string memory twitter_username = tokenIDToName[tokenId];
    address address_owner = ownerOf(tokenId);
    string memory result = string(abi.encodePacked("Twitter username", twitter_username, "is owned by", HexStrings.toString(address_owner)));
    return result;
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    string memory username = tokenIDToName[tokenId];
    address owner = ownerOf(tokenId);

    NFTSVG.SVGParams memory svgParams = NFTSVG.SVGParams({
      username: username,
      tokenId: tokenId,
      color0: NFTSVG.tokenToColorHex(uint256(uint160(owner)), 136),
      color1: NFTSVG.tokenToColorHex(uint256(uint160(owner)), 136),
      color2: NFTSVG.tokenToColorHex(uint256(uint160(owner)), 0),
      color3: NFTSVG.tokenToColorHex(uint256(uint160(owner)), 0),
      x1: NFTSVG.scale(NFTSVG.getCircleCoord(uint256(uint160(owner)), 16, tokenId), 0, 255, 16, 274),
      y1: NFTSVG.scale(NFTSVG.getCircleCoord(uint256(uint160(owner)), 16, tokenId), 0, 255, 100, 484),
      x2: NFTSVG.scale(NFTSVG.getCircleCoord(uint256(uint160(owner)), 32, tokenId), 0, 255, 16, 274),
      y2: NFTSVG.scale(NFTSVG.getCircleCoord(uint256(uint160(owner)), 32, tokenId), 0, 255, 100, 484),
      x3: NFTSVG.scale(NFTSVG.getCircleCoord(uint256(uint160(owner)), 48, tokenId), 0, 255, 16, 274),
      y3: NFTSVG.scale(NFTSVG.getCircleCoord(uint256(uint160(owner)), 48, tokenId), 0, 255, 100, 484)
    });
    string memory svgOutput = NFTSVG.generateSVG(svgParams);

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"attributes":[ ',
            '{"trait_type": "Name",',
            '"value": "',
            tokenIDToName[tokenId],
            '"}, {"trait_type": "Owner",',
            '"value": "',
            HexStrings.toHexString(uint256(uint160(ownerOf(tokenId))), 42),
            '"}], "description": "ZK VerifiedEmails are ZK verified proofs of email recieving on Ethereum. They only reveal parts of the email headers and body body, and are verified via mailserver signature verification: there are no special party attesters. We are working to ship more verifiable proofs of signed data including zk blind, and avoid terrible tragedy of the commons scenarios where instituition reputation is slowly spent by its members. VerifiedEmail uses ZK SNARKs to insinuate this social dynamic, with a first demo at zkemail.xyz.", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(svgOutput)),
            '"}'
          )
        )
      )
    );
    string memory output = string(abi.encodePacked("data:application/json;base64,", json));
    return output;
  }

  // Unpacks uint256s into bytes and then extracts the non-zero characters
  // Only extracts contiguous non-zero characters and ensures theres only 1 such state
  // Note that unpackedLen may be more than packedBytes.length * 8 since there may be 0s
  // TODO: Remove console.logs and define this as a pure function instead of a view
  function convertPackedBytesToBytes(uint256[] memory packedBytes, uint256 maxBytes) public pure returns (string memory extractedString) {
    uint8 state = 0;
    // bytes: 0 0 0 0 y u s h _ g 0 0 0
    // state: 0 0 0 0 1 1 1 1 1 1 2 2 2
    bytes memory nonzeroBytesArray = new bytes(packedBytes.length * 7);
    uint256 nonzeroBytesArrayIndex = 0;
    for (uint16 i = 0; i < packedBytes.length; i++) {
      uint256 packedByte = packedBytes[i];
      uint8[] memory unpackedBytes = new uint8[](bytesInPackedBytes);
      for (uint j = 0; j < bytesInPackedBytes; j++) {
        unpackedBytes[j] = uint8(packedByte >> (j * 8));
      }
      for (uint256 j = 0; j < bytesInPackedBytes; j++) {
        uint256 unpackedByte = unpackedBytes[j]; //unpackedBytes[j];
        // console.log(i, j, state, unpackedByte);
        if (unpackedByte != 0) {
          nonzeroBytesArray[nonzeroBytesArrayIndex] = bytes1(uint8(unpackedByte));
          nonzeroBytesArrayIndex++;
          if (state % 2 == 0) {
            state += 1;
          }
        } else {
          if (state % 2 == 1) {
            state += 1;
          }
        }
        packedByte = packedByte >> 8;
      }
    }
    string memory returnValue = string(nonzeroBytesArray);
    require(state == 2, "Invalid final state of packed bytes in email");
    // console.log("Characters in username: ", nonzeroBytesArrayIndex);
    require(nonzeroBytesArrayIndex <= maxBytes, "Twitter username more than 15 chars!");
    return returnValue;
    // Have to end at the end of the email -- state cannot be 1 since there should be an email footer
  }

  function _stringEq(string memory a, string memory b) public pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  // TODO: Remove console.logs and define this as a pure function instead of a view
  function _domainCheck(uint256[] memory headerSignals) public pure returns (bool) {
    string memory senderBytes = convertPackedBytesToBytes(headerSignals, 18);
    string[2] memory domainStrings = ["verify@twitter.com", "info@twitter.com"];
    return _stringEq(senderBytes, domainStrings[0]) || _stringEq(senderBytes, domainStrings[1]);
    // Usage: require(_domainCheck(senderBytes, domainStrings), "Invalid domain");
  }

  function mint(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals) public {
    // Checks: Verify proof and check signals
    // require(signals[0] == 1337, "invalid signals"); // TODO no invalid signal check yet, which is fine since the zk proof does it

    // 3 public signals are the masked packed message bytes, 17 are the modulus.
    uint256[] memory bodySignals = new uint256[](body_len);
    uint256[] memory rsaModulusSignals = new uint256[](header_len);
    for (uint256 i = 0; i < body_len; i++) bodySignals[i] = signals[i];
    for (uint256 i = body_len; i < msg_len - 1; i++) rsaModulusSignals[i - body_len] = signals[i];

    // Check eth address committed to in proof matches msg.sender, to avoid replayability
    require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

    // Check from/to email domains are correct [in this case, only from domain is checked]
    // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
    // We will upload the version with these domain checks soon!
    // require(_domainCheck(headerSignals), "Invalid domain");

    // Verify that the public key for RSA matches the hardcoded one
    for (uint i = body_len; i < msg_len - 1; i++) {
      require(signals[i] == verifiedMailserverKeys[domain][i - body_len], "Invalid: RSA modulus not matched");
    }
    require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    // Effects: Mint token
    uint256 tokenId = tokenCounter.current() + 1;
    string memory messageBytes = convertPackedBytesToBytes(bodySignals, bytesInPackedBytes * body_len);
    tokenIDToName[tokenId] = messageBytes;
    _mint(msg.sender, tokenId);
    tokenCounter.increment();
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
    require(from == address(0), "Cannot transfer - VerifiedEmail is soulbound");
  }
}
