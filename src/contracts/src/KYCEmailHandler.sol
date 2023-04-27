// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
// import "./base64.sol";
import "./StringUtils.sol";
import "./NFTSVG.sol";
import "./Groth16VerifierTwitter.sol";

contract VerifiedKYCEmail is ERC721Enumerable, Verifier {
  using Counters for Counters.Counter;
  using StringUtils for *;
  using NFTSVG for *;

  Counters.Counter private tokenCounter;

  uint16 public constant msg_len = 41; // change later when clipping rsa modulus
  // uint public constant msg_len = 25 // change to for 1024-bit RSA
  uint16 public constant bytesInPackedBytes = 7; // 7 bytes in a packed item returned from circom
  uint256 public constant body_len = 5;
  uint256 public constant rsa_modulus_chunks_len = 17;
  // uint256 public constant rsa_modulus_chunks_len = 9; // change to for 1024-bit RSA
  uint256 public constant header_len = msg_len - body_len;
  uint256 public constant addressIndexInSignals = msg_len - 1; // TODO: fix constant

  mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
  mapping(uint256 => string) public tokenIDToName;
  string constant domain_airbnb = "airbnb.com";
  string constant domain_coinbase = "coinbase.com";

  constructor() ERC721("VerifiedKYC", "VerifiedKYC") {
    // Do dig TXT outgoing._domainkey.twitter.com to verify these.
    // This is the base 2^121 representation of that key.
    // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
    require(2 * rsa_modulus_chunks_len + body_len + 2 == msg_len, "Variable counts are wrong!");

    // TODO: Create a type that takes in a raw RSA key, the bit count,
    // and whether or not its base64 encoded, and converts it to either 8 or 16 signals
    verifiedMailserverKeys["airbnb.com"][0] = 1782267151472132502396673758441738163;
    verifiedMailserverKeys["airbnb.com"][1] = 211482981992850046267405122085516466;
    verifiedMailserverKeys["airbnb.com"][2] = 454331740279802979553218083106524093;
    verifiedMailserverKeys["airbnb.com"][3] = 2403631535172814929511297080499227501;
    verifiedMailserverKeys["airbnb.com"][4] = 2245858962887391502631714271235221261;
    verifiedMailserverKeys["airbnb.com"][5] = 2622546081161044621195511843069142201;
    verifiedMailserverKeys["airbnb.com"][6] = 1247628895302131918172499597775434966;
    verifiedMailserverKeys["airbnb.com"][7] = 1584816411261150842617500336767389232;
    verifiedMailserverKeys["airbnb.com"][8] = 52914273202064513;
    verifiedMailserverKeys["airbnb.com"][9] = 0;
    verifiedMailserverKeys["airbnb.com"][10] = 0;
    verifiedMailserverKeys["airbnb.com"][11] = 0;
    verifiedMailserverKeys["airbnb.com"][12] = 0;
    verifiedMailserverKeys["airbnb.com"][13] = 0;
    verifiedMailserverKeys["airbnb.com"][14] = 0;
    verifiedMailserverKeys["airbnb.com"][15] = 0;
    verifiedMailserverKeys["airbnb.com"][16] = 0;

    // TODO: Update coinbase public key
    verifiedMailserverKeys["coinbase.com"][0] = 1345060269316532707410324038691477859;
    verifiedMailserverKeys["coinbase.com"][1] = 384766469338727068594017962971556116;
    verifiedMailserverKeys["coinbase.com"][2] = 168911276988157118943281324996362385;
    verifiedMailserverKeys["coinbase.com"][3] = 1165220578700378509253846448878043993;
    verifiedMailserverKeys["coinbase.com"][4] = 1468253564629208485538769233538980768;
    verifiedMailserverKeys["coinbase.com"][5] = 2375057771089481827666297753868306658;
    verifiedMailserverKeys["coinbase.com"][6] = 1859460967236870128489365675225233949;
    verifiedMailserverKeys["coinbase.com"][7] = 2514159567794221963503259554592798082;
    verifiedMailserverKeys["coinbase.com"][8] = 37369779987712517;
    verifiedMailserverKeys["coinbase.com"][9] = 0;
    verifiedMailserverKeys["coinbase.com"][10] = 0;
    verifiedMailserverKeys["coinbase.com"][11] = 0;
    verifiedMailserverKeys["coinbase.com"][12] = 0;
    verifiedMailserverKeys["coinbase.com"][13] = 0;
    verifiedMailserverKeys["coinbase.com"][14] = 0;
    verifiedMailserverKeys["coinbase.com"][15] = 0;
    verifiedMailserverKeys["coinbase.com"][16] = 0;
  }

  // change to some KYC description
  function tokenDesc(uint256 tokenId) public view returns (string memory) {
    address address_owner = ownerOf(tokenId);
    string memory result = string(abi.encodePacked(StringUtils.toString(address_owner), "has a valid zk-KYC"));
    return result;
  }

  // TODO: change this function
  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    string memory username = tokenIDToName[tokenId];
    address owner = ownerOf(tokenId);
    return NFTSVG.constructAndReturnSVG(username, tokenId, owner);
  }

  function _domainCheck(uint256[] memory headerSignals) public pure returns (bool) {
    string memory senderBytes = StringUtils.convertPackedBytesToBytes(headerSignals, 18, bytesInPackedBytes);
    string[2] memory domainStrings = ["verify@twitter.com", "info@twitter.com"];
    return StringUtils.stringEq(senderBytes, domainStrings[0]) || StringUtils.stringEq(senderBytes, domainStrings[1]);
    // Usage: require(_domainCheck(senderBytes, domainStrings), "Invalid domain");
  }

  function mint(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals) public {
    // TODO no invalid signal check yet, which is fine since the zk proof does it
    // Checks: Verify proof and check signals
    // require(signals[0] == 1337, "invalid signals");

    // 3 public signals are the masked packed message bytes, 17 are the modulus.
    uint256[] memory bodySignals = new uint256[](body_len);
    uint256[] memory rsaModulusSignals = new uint256[](header_len); // why is this defined?
    for (uint256 i = 0; i < body_len; i++) bodySignals[i] = signals[i];
    for (uint256 i = body_len; i < msg_len - 1; i++) rsaModulusSignals[i - body_len] = signals[i];

    // Check eth address committed to in proof matches msg.sender, to avoid replayability
    require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

    // Check from/to email domains are correct [in this case, only from domain is checked]
    // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
    // We will upload the version with these domain checks soon!
    // require(_domainCheck(headerSignals), "Invalid domain");

    // Verify that the public key for RSA matches the hardcoded one
    for (uint i = 0; i < rsa_modulus_chunks_len; i++) {
      require(signals[body_len + i] == verifiedMailserverKeys[domain_airbnb][i], "Invalid: Airbnb RSA modulus not matched");
      require(signals[body_len + rsa_modulus_chunks_len + i] == verifiedMailserverKeys[domain_coinbase][i], "Invalid, Coinbase RSA modulus not matched");
    }
    require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    // Effects: Mint token
    uint256 tokenId = tokenCounter.current() + 1;
    string memory messageBytes = StringUtils.convertPackedBytesToBytes(bodySignals, bytesInPackedBytes * body_len, bytesInPackedBytes);
    tokenIDToName[tokenId] = messageBytes;
    _mint(msg.sender, tokenId);
    tokenCounter.increment();
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
    require(from == address(0), "Cannot transfer - VerifiedKYCEmail is soulbound");
  }
}