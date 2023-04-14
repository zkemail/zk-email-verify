// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
// import "./base64.sol";
import "./StringUtils.sol";
import "./NFTSVG.sol";
import { Verifier } from "./Groth16VerifierWallet.sol";
import "./MailServer.sol";

contract VerifiedWalletEmail {
  using StringUtils for *;

  uint16 public constant packSize = 7; // 7 bytes in a packed item returned from circom

  uint16 public constant body_len = 4 * 4;
  uint16 public constant rsa_modulus_chunks_len = 17;
  uint16 public constant commitment_len = 1;
  uint16 public constant msg_len = body_len + rsa_modulus_chunks_len + commitment_len; // 34

  uint16 public constant header_len = msg_len - body_len;
  uint16 public constant addressIndexInSignals = msg_len - 1; // The last index is the commitment

  mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
  mapping(string => uint256) public balance;
  mapping(uint256 => bool) public nullifier;
  MailServer mailServer;
  Verifier public immutable verifier;

  // v is an Address
  constructor(Verifier v, MailServer m) {
    // Do dig TXT outgoing._domainkey.twitter.com to verify these.
    // This is the base 2^121 representation of that key.
    // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
    require(rsa_modulus_chunks_len + body_len + 1 == msg_len, "Variable counts are wrong!");
    verifier = v;
    mailServer = m;
  }

  function transfer(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals) public {
    // TODO no invalid signal check yet, which is fine since the zk proof does it
    // Checks: Verify proof and check signals
    // require(signals[0] == 1337, "invalid signals");

    // 3 public signals are the masked packed message bytes, 17 are the modulus.
    uint256[] memory bodySignals = new uint256[](body_len);
    uint256[] memory rsaModulusSignals = new uint256[](header_len);
    for (uint256 i = 0; i < body_len; i++) {
      bodySignals[i] = signals[i];
    }
    for (uint256 i = body_len; i < msg_len - 1; i++) {
      rsaModulusSignals[i - body_len] = signals[i];
    }

    // Check eth address committed to in proof matches msg.sender, to avoid doublespend and relayer-frontrunning-relayer-for-profit
    // require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

    // TODO: Note that this is buggy since it is malleable
    require(!nullifier[a[0]], "Value is already true");
    nullifier[a[0]] = true;

    // Check from/to email domains are correct [in this case, only from domain is checked]
    // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
    // We will upload the version with these domain checks soon!
    // require(_domainCheck(headerSignals), "Invalid domain");
    string memory fromEmail = StringUtils.convertPackedBytesToBytes(StringUtils.sliceArray(bodySignals, 0, 4), packSize * 4, packSize);
    string memory recipientEmail = StringUtils.convertPackedBytesToBytes(StringUtils.sliceArray(bodySignals, 4, 8), packSize * 4, packSize);
    string memory amount = StringUtils.convertPackedBytesToBytes(StringUtils.sliceArray(bodySignals, 8, 12), packSize * 4, packSize);
    string memory currency = StringUtils.convertPackedBytesToBytes(StringUtils.sliceArray(bodySignals, 12, 16), packSize * 4, packSize);

    string memory domain = StringUtils.getDomainFromEmail(fromEmail);
    console.log(domain);
    // Verify that the public key for RSA matches the hardcoded one
    for (uint256 i = body_len; i < msg_len - 1; i++) {
      require(mailServer.isVerified(domain, i - body_len, signals[i]), "Invalid: RSA modulus not matched");
    }
    require(verifier.verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    console.log("Proof passed!s");
    // Effects: Send money
    if (balance[fromEmail] == 0) {
      balance[fromEmail] = 10;
    }
    balance[fromEmail] -= StringUtils.stringToUint(amount);
    balance[recipientEmail] += StringUtils.stringToUint(amount);
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
    require(from == address(0), "Cannot transfer - VerifiedEmail is soulbound");
  }
}
