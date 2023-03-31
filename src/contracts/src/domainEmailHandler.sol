// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./base64.sol";
import "./emailVerifier.sol";

contract VerifiedEmail is ERC721Enumerable, Verifier {
  using Counters for Counters.Counter;

  Counters.Counter private tokenCounter;

  mapping(string => uint256[17]) public verifiedMailserverKeys;

  constructor() ERC721("VerifiedEmail", "VerifiedEmail") {
    // Do dig TXT outgoing._domainkey.mit.edu to verify these.
    // This is the base 2^121 representation of that key.
    // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
    verifiedMailserverKeys["mit.edu"][0] = 1362844382337595676288966927845048755;
    verifiedMailserverKeys["mit.edu"][1] = 2051232190029042874602123094057641579;
    verifiedMailserverKeys["mit.edu"][2] = 82180903948917831722803326838373315;
    verifiedMailserverKeys["mit.edu"][3] = 2138065713701593539261187725956930213;
    verifiedMailserverKeys["mit.edu"][4] = 2610113944250628639012720369418287474;
    verifiedMailserverKeys["mit.edu"][5] = 947386626577810308124082119170513710;
    verifiedMailserverKeys["mit.edu"][6] = 536038387946359789768371937196825655;
    verifiedMailserverKeys["mit.edu"][7] = 2153576889316081585234167235144487709;
    verifiedMailserverKeys["mit.edu"][8] = 1287226415982257719800023032828811922;
    verifiedMailserverKeys["mit.edu"][9] = 1018106194828336360857712078662978863;
    verifiedMailserverKeys["mit.edu"][10] = 2182121972991273871088583422676257732;
    verifiedMailserverKeys["mit.edu"][11] = 824080356450773094427801032134768781;
    verifiedMailserverKeys["mit.edu"][12] = 2160330005857484633191775197216017274;
    verifiedMailserverKeys["mit.edu"][13] = 2447512561136956201144186872280764330;
    verifiedMailserverKeys["mit.edu"][14] = 3006152463941257314249890518041106;
    verifiedMailserverKeys["mit.edu"][15] = 820607402446306410974305086636012205;
    verifiedMailserverKeys["mit.edu"][16] = 343542034344264361438243465247009;
  }

  function getDesc(address origin, address sink, uint256 degree) private view returns (string memory) {
    // convert address to string
    string memory originStr = toString(origin);
    string memory sinkStr = toString(sink);
    // concatenate strings
    string memory result = string(abi.encodePacked(sinkStr, "is ", toString(degree), "th degree friends with ", originStr));

    return result;
  }

  function tokenDesc(uint256 tokenId) public view returns (string memory) {
    return string(abi.encodePacked(toString(tokenId)));
  }

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
            "mit.edu",
            '", "tokenId": ',
            toString(tokenId),
            "}",
            '", "description": "VerifiedEmailIDs are ZK verified proofs of email ownership on Ethereum. They only reveal your email domain, nothing about your identity. We can usee this to create trustless oracles, decentralized anonymous KYC, permission-free integration with every company, and secret three letter spying org leaks. VerifiedEmailIDs use ZK SNARKs to insinuate this debauchery. @personae_labs on Twitter for more alpha.", "image": "data:image/svg+xml;base64,',
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

  uint16 public constant msg_len = 21;
  string domain = "mit.edu";

  // Unpacks uint256s into bytes and then extracts the non-zero characters
  // Only extracts contiguous non-zero characters and ensures theres only 2 such states, and they are identical
  // function convert7PackedBytesToDupedBytes(uint256[msg_len] memory packedBytes) public pure returns (bytes memory unpackedBytes) {
  //     string memory domain = "mit.edu";
  //     uint32 fromPointer = 0;
  //     uint32 toPointer = 0;
  //     uint32 domainLength = 0;
  //     uint8 state = 0;
  //     // bytes: 0 0 0 0 m i t . e d u 0 0 0 m i t . e d u 0 0 0
  //     // state: 0 0 0 0 1 1 1 1 1 1 1 2 2 2 3 3 3 3 3 3 3 4 4 4
  //     // Set domain pointers, not including the mailserver key
  //     for (uint32 i = 0; i < msg_len - 17; i++) {
  //         uint256 packedByte = packedBytes[i];
  //         for (uint256 j = 0; j < 7; j++) {
  //             uint8 memory unpackedByte = packedByte & 0xff;
  //             if(unpackedByte != 0) {
  //                 // nonzeroBytes.push(unpackedByte);
  //                 if(state % 2 == 0) {
  //                     state += 1;
  //                 }
  //             } else {
  //                 if(state % 2 == 1) {
  //                     state += 1;
  //                 }
  //             }
  //             if (signals[i] == 0) {
  //                 if (signals[i - 1] != 0) {
  //                     state += 1;
  //                     if (state == 2) {
  //                         domainLength = i - fromPointer;
  //                     } else if (state == 4) {
  //                         require(
  //                             domainLength == i - toPointer,
  //                             "Invalid domain length"
  //                         );
  //                     }
  //                 }
  //                 continue;
  //             } else if (signals[i - 1] == 0) {
  //                 // transition state
  //                 state += 1;
  //                 require(state <= 4, "Invalid state transition"); // 0 is the start, 1 is from, 2 is between from and to, 3 is to, 4 is after the to
  //                 if (state == 1) {
  //                     fromPointer = i;
  //                 } else if (state == 3) {
  //                     toPointer = i;
  //                 }
  //             }
  //             packedByte = packedByte >> 8;
  //         }
  //     }
  //     // Check domains match
  //     bytes memory b = bytes(domain);
  //     for (uint32 i = 0; i < domainLength; i++) {
  //         require(
  //             signals[fromPointer + i] == signals[toPointer + i],
  //             "Invalid: domains do not match"
  //         );
  //         require(signals[fromPointer + i] == domain[i], "Invalid: domain bytes don't match the string");
  //     }
  //     return b;
  // }

  function mint(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals) public {
    // require(signals[0] == 1337, "invalid signals"); // TODO no invalid signal check yet, which is fine since the zk proof does it
    require(signals[0] == 0, "Invalid starting message character");
    // msg_len-17 public signals are the masked message bytes, 17 are the modulus.
    // uint8[] memory message = convert7PackedBytesToDupedBytes(signals);
    for (uint32 i = msg_len - 17; i < msg_len; i++) {
      require(signals[i] == verifiedMailserverKeys[domain][i], "Invalid modulus not matched");
    }

    // ENSURE THE FOLLOWING IS UNCOMMENTED
    require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    uint256 tokenId = tokenCounter.current() + 1;
    _mint(msg.sender, tokenId);
    tokenCounter.increment();
  }

  // TODO: This should override an ERC721 but doesn't
  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal pure {
    revert("Cannot transfer - VerifiedEmail is soulbound");
  }
}
