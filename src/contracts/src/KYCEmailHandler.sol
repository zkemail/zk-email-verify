// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
import "./StringUtils.sol";
import "./NFTSVG.sol";
import { Verifier } from "./Groth16VerifierKYC.sol";
import "./MailServer.sol";

contract VerifiedKYCEmail is ERC721Enumerable, Verifier {
  using Counters for Counters.Counter;
  using StringUtils for *;
  using NFTSVG for *;

  Counters.Counter private tokenCounter;

  uint16 public constant msg_len = 40; // change later when clipping rsa modulus
  // uint public constant msg_len = 25 // change to for 1024-bit RSA
  uint16 public constant bytesInPackedBytes = 7; // 7 bytes in a packed item returned from circom
  uint256 public constant body_len = 5;
  uint256 public constant rsa_modulus_chunks_len = 17;
  // uint256 public constant rsa_modulus_chunks_len = 9; // change to for 1024-bit RSA
  uint256 public constant header_len = msg_len - body_len;
  uint256 public constant addressIndexInSignals = msg_len - 1;

  mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
  mapping(uint256 => string) public tokenIDToName;
  string constant domain_airbnb = "airbnb.com";
  string constant domain_coinbase = "coinbase.com";
  MailServer mailServer;
  Verifier public immutable verifier;

  constructor(Verifier v, MailServer m) ERC721("AnonymousKYC", "AnonKYC") {
    verifier = v;
    mailServer = m;
    require(2 * rsa_modulus_chunks_len + body_len + 1 == msg_len, "Variable counts are wrong!");
  }

  // change to some KYC description
  function tokenDesc(uint256 tokenId) public view returns (string memory) {
    address address_owner = ownerOf(tokenId);
    string memory result = string(abi.encodePacked(StringUtils.toString(address_owner), "has a valid anonymous KYC"));
    return result;
  }

  // TODO: change this function for KYC
  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    string memory username = tokenIDToName[tokenId];
    address owner = ownerOf(tokenId);
    return NFTSVG.constructAndReturnSVG(username, tokenId, owner);
  }

  // TODO: change this function for KYC
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
    uint256[] memory rsaModulusSignals = new uint256[](header_len);
    for (uint256 i = 0; i < body_len; i++){
      bodySignals[i] = signals[i];
    }
    for (uint256 i = body_len; i < msg_len - 1; i++) {
      rsaModulusSignals[i - body_len] = signals[i];
    }
    // Check eth address committed to in proof matches msg.sender, to avoid replayability
    require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

    // Check from/to email domains are correct [in this case, only from domain is checked]
    // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
    // We will upload the version with these domain checks soon!
    // require(_domainCheck(headerSignals), "Invalid domain");

    // Verify that the public key for RSA matches the hardcoded one
    for (uint i = 0; i < rsa_modulus_chunks_len; i++) {
      require(mailServer.isVerified(domain_airbnb, i, signals[body_len + i]), "Invalid: Airbnb RSA modulus not matched");
      require(mailServer.isVerified(domain_coinbase, i, signals[body_len + rsa_modulus_chunks_len + i]), "Invalid: Coinbase RSA modulus not matched");
    }
    require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    // Effects: Mint token
    // TODO: Add nullifier functionality
    uint256 tokenId = tokenCounter.current() + 1;
    string memory messageBytes = StringUtils.convertPackedBytesToBytes(bodySignals, bytesInPackedBytes * body_len, bytesInPackedBytes);
    tokenIDToName[tokenId] = messageBytes;
    _mint(msg.sender, tokenId);
    tokenCounter.increment();
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
    require(from == address(0), "Cannot transfer - AnonKYC is soulbound");
  }
}