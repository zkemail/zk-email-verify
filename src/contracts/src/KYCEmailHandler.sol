// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
// import "./base64.sol";
import "./NFTSVG.sol";
import "./emailVerifier.sol";

contract VerifiedKYCEmail is ERC721Enumerable, Verifier {
  using Counters for Counters.Counter;

  Counters.Counter private tokenCounter;

  // uint16 public constant msg_len = 21; // header + body
  uint16 public constant msg_len = 20; // two rsa moduli of length 9 as well as two (identical) addresses of length 1
  uint16 public constant bytesInPackedBytes = 7; // 7 bytes in a packed item returned from circom
  // uint256 public constant body_len = 3;
  // uint256 public constant body_len = 0; // no body
  // uint256 public constant rsa_modulus_chunks_len = 17;
  uint256 public constant rsa_modulus_chunks_len = 9; // 1024 bit RSA
  // uint256 public constant header_len = msg_len - body_len;
  uint256 public constant addressIndexInSignals = msg_len - 1; // TODO: FIX CONSTANT

  // mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
  mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
  mapping(uint256 => string) public tokenIDToName;
  // string constant domain = "twitter.com";
  string constant domain_airbnb = "airbnb.com";
  string constant domain_coinbase = "coinbase.com";

  constructor() ERC721("VerifiedKYC", "VerifiedKYC") {
    // Do dig TXT outgoing._domainkey.twitter.com to verify these.
    // This is the base 2^121 representation of that key.
    // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
    require(2 * rsa_modulus_chunks_len + 2 == msg_len, "Variable counts are wrong!");
    verifiedMailserverKeys["airbnb.com"][0] = 1782267151472132502396673758441738163;
    verifiedMailserverKeys["airbnb.com"][1] = 211482981992850046267405122085516466;
    verifiedMailserverKeys["airbnb.com"][2] = 454331740279802979553218083106524093;
    verifiedMailserverKeys["airbnb.com"][3] = 2403631535172814929511297080499227501;
    verifiedMailserverKeys["airbnb.com"][4] = 2245858962887391502631714271235221261;
    verifiedMailserverKeys["airbnb.com"][5] = 2622546081161044621195511843069142201;
    verifiedMailserverKeys["airbnb.com"][6] = 1247628895302131918172499597775434966;
    verifiedMailserverKeys["airbnb.com"][7] = 1584816411261150842617500336767389232;
    verifiedMailserverKeys["airbnb.com"][8] = 52914273202064513;

    verifiedMailserverKeys["coinbase.com"][0] = 1345060269316532707410324038691477859;
    verifiedMailserverKeys["coinbase.com"][1] = 384766469338727068594017962971556116;
    verifiedMailserverKeys["coinbase.com"][2] = 168911276988157118943281324996362385;
    verifiedMailserverKeys["coinbase.com"][3] = 1165220578700378509253846448878043993;
    verifiedMailserverKeys["coinbase.com"][4] = 1468253564629208485538769233538980768;
    verifiedMailserverKeys["coinbase.com"][5] = 2375057771089481827666297753868306658;
    verifiedMailserverKeys["coinbase.com"][6] = 1859460967236870128489365675225233949;
    verifiedMailserverKeys["coinbase.com"][7] = 2514159567794221963503259554592798082;
    verifiedMailserverKeys["coinbase.com"][8] = 37369779987712517;
  }

  // change to some KYC description
  function tokenDesc(uint256 tokenId) public view returns (string memory) {
    // string memory twitter_username = tokenIDToName[tokenId];
    address address_owner = ownerOf(tokenId);
    string memory result = string(abi.encodePacked(HexStrings.toString(address_owner), "has completed KYC"));
    return result;
  }

  // modify later lol
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

  // Need to change but doesn't seem to be called?
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
    // uint256[] memory bodySignals = new uint256[](body_len);
    // uint256[] memory rsaModulusSignals = new uint256[](msg_len);
    // for (uint256 i = 0; i < body_len; i++) bodySignals[i] = signals[i];
    // for (uint256 i = 0; i < 2 * rsa_modulus_chunks_len; i++) rsaModulusSignals[i] = signals[i];

    // Check eth address committed to in proof matches msg.sender, to avoid replayability
    require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

    // Check from/to email domains are correct [in this case, only from domain is checked]
    // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
    // We will upload the version with these domain checks soon!
    // require(_domainCheck(headerSignals), "Invalid domain");

	// Verify that the two addresses match (although it should be impossible that they are not equal)
	require(signals[addressIndexInSignals - 1] == signals[addressIndexInSignals], "Invalid: addresses don't match");

    // Verify that the public key for RSA matches the hardcoded one
    for (uint i = 0; i < rsa_modulus_chunks_len; i++) {
      require(signals[i] == verifiedMailserverKeys[domain_airbnb][i], string(abi.encodePacked("Invalid: RSA modulus not matched for", domain_airbnb)));
	  require(signals[i + rsa_modulus_chunks_len] == verifiedMailserverKeys[domain_coinbase][i], string(abi.encodePacked("Invalid: RSA modulus not matched for", domain_coinbase)));
    }
    require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    // Effects: Mint token
    uint256 tokenId = tokenCounter.current() + 1;
    // string memory messageBytes = convertPackedBytesToBytes(bodySignals, bytesInPackedBytes * body_len);
    // tokenIDToName[tokenId] = messageBytes;
    _mint(msg.sender, tokenId);
    tokenCounter.increment();
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
    require(from == address(0), "Cannot transfer - VerifiedKYCEmail is soulbound");
  }
}