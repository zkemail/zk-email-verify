// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
// import "./base64.sol";
import "./HexStrings.sol";
import "./NFTSVG.sol";
import "./Groth16VerifierWallet.sol";
import "./MailServer.sol";

contract VerifiedWalletEmail is Verifier {
  using HexStrings for *;
  using MailServer for MailServer.Server;

  uint16 public constant packSize = 7; // 7 bytes in a packed item returned from circom

  uint16 public constant body_len = 4 * 4;
  uint16 public constant rsa_modulus_chunks_len = 17;
  uint16 public constant commitment_len = 1;
  uint16 public constant msg_len = body_len + rsa_modulus_chunks_len + commitment_len;

  uint16 public constant header_len = msg_len - body_len;
  uint16 public constant addressIndexInSignals = msg_len - 1; // The last index is the commitment

  mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
  mapping(string => uint256) public balance;
  mapping(uint256 => bool) public nullifier;
  MailServer.Server server;

  //   string constant domain = "twitter.com";

  constructor() {
    // Do dig TXT outgoing._domainkey.twitter.com to verify these.
    // This is the base 2^121 representation of that key.
    // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
    require(rsa_modulus_chunks_len + body_len + 1 == msg_len, "Variable counts are wrong!");
    server.initMailserverKeys();
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
      uint8[] memory unpackedBytes = new uint8[](packSize);
      for (uint j = 0; j < packSize; j++) {
        unpackedBytes[j] = uint8(packedByte >> (j * 8));
      }
      for (uint256 j = 0; j < packSize; j++) {
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
    require(state >= 1, "Invalid final state of packed bytes in email");
    // console.log("Characters in username: ", nonzeroBytesArrayIndex);
    require(nonzeroBytesArrayIndex <= maxBytes, "Packed bytes more than allowed max length!");
    return returnValue;
    // Have to end at the end of the email -- state cannot be 1 since there should be an email footer
  }

  function _stringEq(string memory a, string memory b) public pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  function transfer(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals) public {
    // Checks: Verify proof and check signals
    // require(signals[0] == 1337, "invalid signals"); // TODO no invalid signal check yet, which is fine since the zk proof does it

    // 3 public signals are the masked packed message bytes, 17 are the modulus.
    uint256[] memory bodySignals = new uint256[](body_len);
    uint256[] memory rsaModulusSignals = new uint256[](header_len);
    for (uint256 i = 0; i < body_len; i++) bodySignals[i] = signals[i];
    for (uint256 i = body_len; i < msg_len - 1; i++) rsaModulusSignals[i - body_len] = signals[i];

    // Check eth address committed to in proof matches msg.sender, to avoid doublespend and relayer-frontrunning-relayer-for-profit
    // require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

    // TODO: Note that this is buggy since it is malleable
    require(!nullifier[a[0]], "Value is already true");
    nullifier[a[0]] = true;

    // Check from/to email domains are correct [in this case, only from domain is checked]
    // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
    // We will upload the version with these domain checks soon!
    // require(_domainCheck(headerSignals), "Invalid domain");
    string memory fromEmail = convertPackedBytesToBytes(sliceArray(bodySignals, 0, 4), packSize * 4);
    string memory recipientEmail = convertPackedBytesToBytes(sliceArray(bodySignals, 4, 8), packSize * 4);
    string memory amount = convertPackedBytesToBytes(sliceArray(bodySignals, 8, 12), packSize * 4);
    string memory currency = convertPackedBytesToBytes(sliceArray(bodySignals, 12, 16), packSize * 4);

    string memory domain = getDomainFromEmail(fromEmail);
    console.log(domain);
    // Verify that the public key for RSA matches the hardcoded one
    for (uint i = body_len; i < msg_len - 1; i++) {
      require(server.isVerified(domain, i - body_len, signals[i]), "Invalid: RSA modulus not matched");
    }
    require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    // Effects: Send money
    if (balance[fromEmail] == 0) {
      balance[fromEmail] = 10;
    }
    balance[fromEmail] -= stringToUint(amount);
    balance[recipientEmail] += stringToUint(amount);
  }

  function bytes32ToString(bytes32 input) internal pure returns (string memory) {
    uint256 i;
    for (i = 0; i < 32 && input[i] != 0; i++) {}
    bytes memory resultBytes = new bytes(i);
    for (i = 0; i < 32 && input[i] != 0; i++) {
      resultBytes[i] = input[i];
    }
    return string(resultBytes);
  }

  function sliceArray(uint256[] memory input, uint256 start, uint256 end) internal pure returns (uint256[] memory) {
    require(start <= end && end <= input.length, "Invalid slice indices");
    uint256[] memory result = new uint256[](end - start);
    for (uint256 i = start; i < end; i++) {
      result[i - start] = input[i];
    }
    return result;
  }

  function stringToUint(string memory s) internal pure returns (uint256) {
    bytes memory b = bytes(s);
    uint256 result = 0;
    for (uint i = 0; i < b.length; i++) {
      if (b[i] >= 0x30 && b[i] <= 0x39) {
        result = result * 10 + (uint256(uint8(b[i])) - 48);
      }
    }
    return result;
  }

  function getDomainFromEmail(string memory fromEmail) public pure returns (string memory) {
    bytes memory emailBytes = bytes(fromEmail);
    uint atIndex;
    for (uint i = 0; i < emailBytes.length; i++) {
      if (emailBytes[i] == "@") {
        atIndex = i;
        break;
      }
    }

    bytes memory domainBytes = new bytes(emailBytes.length - atIndex - 1);
    for (uint j = 0; j < domainBytes.length; j++) {
      domainBytes[j] = emailBytes[atIndex + 1 + j];
    }
    return bytes32ToString(bytes32(bytes(domainBytes)));
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
    require(from == address(0), "Cannot transfer - VerifiedEmail is soulbound");
  }
}
