// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
import "./base64.sol";
import "./emailVerifier.sol";

contract VerifiedTwitterEmail is ERC721Enumerable, Verifier {
  using Counters for Counters.Counter;

  Counters.Counter private tokenCounter;

  mapping(string => uint256[17]) public verifiedMailserverKeys;
  mapping(uint256 => string) public tokenToName;
  string constant domain = "twitter.com";

  uint16 public constant msg_len = 163; // header + body
  uint256 public constant header_len = 50; // TODO: FIX CONSTANT
  uint256 public constant body_len = msg_len - header_len;
  uint256 public constant addressIndexInSignals = 163; // TODO: FIX CONSTANT

  constructor() ERC721("VerifiedEmail", "VerifiedEmail") {
    // Do dig TXT outgoing._domainkey.twitter.com to verify these.
    // This is the base 2^121 representation of that key.
    // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)

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

  // function getDesc(
  //     address origin,
  //     address sink,
  //     uint256 degree
  // ) private view returns (string memory) {
  //     // convert address to string
  //     string memory originStr = toString(origin);
  //     string memory sinkStr = toString(sink);
  //     // concatenate strings
  //     string memory result = string(
  //         abi.encodePacked(
  //             sinkStr,
  //             "is ",
  //             toString(degree),
  //             "th degree friends with ",
  //             originStr
  //         )
  //     );

  //     return result;
  // }

  // function tokenDesc(uint256 tokenId) public view returns (string memory) {
  //     address origin = originAddress[tokenId];
  //     address sink = sinkAddress[tokenId];
  //     uint256 degree = degree[tokenId];
  //     return getDesc(origin, sink, degree);
  // }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    string[3] memory parts;
    parts[
      0
    ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';

    // parts[1] = tokenDesc(tokenId);

    parts[2] = "</text></svg>";

    string memory output = string(abi.encodePacked(parts[0], parts[1], parts[2]));

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"domain": "',
            domain,
            '", "tokenId": ',
            toString(tokenId),
            "}",
            '", "description": "VerifiedEmails are ZK verified proofs of email ownership on Ethereum. They only reveal your email domain, nothing about your identity. We can construct both goods like Glassdoor and Blind, and terrible tragedy of the commons scenarios where instituition reputation is slowly spent by its members. VerifiedEmail uses ZK SNARKs to insinuate this social dynamic.", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(output)),
            '"}'
          )
        )
      )
    );
    output = string(abi.encodePacked("data:application/json;base64,", json));

    return output;
  }

  function toString(address account) public pure returns (string memory) {
    return toString(abi.encodePacked(account));
  }

  function toString(uint256 value) public pure returns (string memory) {
    return toString(abi.encodePacked(value));
  }

  function toString(bytes32 value) public pure returns (string memory) {
    return toString(abi.encodePacked(value));
  }

  function toString(bytes memory data) public pure returns (string memory) {
    bytes memory alphabet = "0123456789abcdef";

    bytes memory str = new bytes(2 + data.length * 2);
    str[0] = "0";
    str[1] = "x";
    for (uint256 i = 0; i < data.length; i++) {
      str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
      str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
    }
    return string(str);
  }

  // Unpacks uint256s into bytes and then extracts the non-zero characters
  // Only extracts contiguous non-zero characters and ensures theres only 1 such state
  // Note that unpackedLen may be more than packedBytes.length * 8 since there may be 0s
  // TODO: Remove console.logs and define this as a pure function instead of a view (done)
  function convert7PackedBytesToBytes(uint256[] memory packedBytes) public pure returns (string memory extractedString) {
    uint8 state = 0;
    // bytes: 0 0 0 0 y u s h _ g 0 0 0
    // state: 0 0 0 0 1 1 1 1 1 1 2 2 2
    bytes memory nonzeroBytesArray = new bytes(packedBytes.length * 7);
    uint256 nonzeroBytesArrayIndex = 0;
    for (uint16 i = 0; i < packedBytes.length; i++) {
      uint256 packedByte = packedBytes[i];
      uint8[7] memory unpackedBytes = [
        uint8(packedByte),
        uint8(packedByte >> 8),
        uint8(packedByte >> 16),
        uint8(packedByte >> 24),
        uint8(packedByte >> 32),
        uint8(packedByte >> 40),
        uint8(packedByte >> 48)
      ];
      for (uint256 j = 0; j < 7; j++) {
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
    // require(state == 2, string(state));
    require(state == 2, "Invalid final state of packed bytes in email");
    require(nonzeroBytesArrayIndex <= 15, "Twitter username more than 15 chars!");
    return returnValue;
    // Have to end at the end of the email -- state cannot be 1 since there should be an email footer
  }

  function _stringEq(string memory a, string memory b) public pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  // TODO: Remove console.logs and define this as a pure function instead of a view (done)
  function _domainCheck(uint256[] memory headerSignals) public pure returns (bool) {
    string memory senderBytes = convert7PackedBytesToBytes(headerSignals);
    string[2] memory domainStrings = ["verify@twitter.com", "info@twitter.com"];
    return _stringEq(senderBytes, domainStrings[0]) || _stringEq(senderBytes, domainStrings[1]);
    // Usage: require(_domainCheck(senderBytes, domainStrings), "Invalid domain");
  }

  function mint(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals) public {
    // Checks: Verify proof and check signals
    // require(signals[0] == 1337, "invalid signals"); // TODO no invalid signal check yet, which is fine since the zk proof does it
    require(signals[0] == 0, "Invalid starting message character");

    // msg_len-17 public signals are the masked message bytes, 17 are the modulus.
    uint256[] memory headerSignals = new uint256[](header_len);
    uint256[] memory bodySignals = new uint256[](body_len);
    for (uint256 i = 0; i < header_len; i++) headerSignals[i] = signals[i];
    for (uint256 i = header_len; i < msg_len; i++) bodySignals[i] = signals[i];

    // Check eth address committed to in proof matches msg.sender, to avoid replayability
    require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

    // Check from/to email domains are correct [in this case, only from domain is checked]
    require(_domainCheck(headerSignals), "Invalid domain");

    // Verify that the public key for RSA matches the hardcoded one
    string memory messageBytes = convert7PackedBytesToBytes(bodySignals);
    for (uint32 i = msg_len - 17; i < msg_len; i++) {
      require(signals[i] == verifiedMailserverKeys[domain][i], "Invalid modulus not matched");
    }
    require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    // Effects: Mint token
    uint256 tokenId = tokenCounter.current() + 1;
    tokenToName[tokenId] = messageBytes;
    _mint(msg.sender, tokenId);
    tokenCounter.increment();
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
    require(from == address(0), "Cannot transfer - VerifiedEmail is soulbound");
  }
}
