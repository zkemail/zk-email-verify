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

contract WalletEmail is Verifier {
  using HexStrings for *;

  uint16 public constant packSize = 7; // 7 bytes in a packed item returned from circom

  uint16 public constant body_len = 4 * 4;
  uint16 public constant rsa_modulus_chunks_len = 17;
  uint16 public constant commitment_len = 1;
  uint16 public constant msg_len = body_len + rsa_modulus_chunks_len + commitment_len;

  uint16 public constant header_len = msg_len - body_len;
  uint16 public constant addressIndexInSignals = msg_len - 1; // The last index is the commitment

  mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
  mapping(uint256 => string) public tokenIDToName;
  mapping(uint256 => bool) public nullifier;
  string constant domain = "twitter.com";

  constructor() ERC721("VerifiedEmail", "VerifiedEmail") {
    // Do dig TXT outgoing._domainkey.twitter.com to verify these.
    // This is the base 2^121 representation of that key.
    // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
    require(rsa_modulus_chunks_len + body_len + 1 == msg_len, "Variable counts are wrong!");
  }

  function initMailserverKeys() internal {
    // TODO: Create a type that takes in a raw RSA key, the bit count,
    // and whether or not its base64 encoded, and converts it to either 8 or 16 signals
    verifiedMailserverKeys["gmail.com"][0] = 1634582323953821262989958727173988295
    verifiedMailserverKeys["gmail.com"][1] = 1938094444722442142315201757874145583
    verifiedMailserverKeys["gmail.com"][2] = 375300260153333632727697921604599470
    verifiedMailserverKeys["gmail.com"][3] = 1369658125109277828425429339149824874
    verifiedMailserverKeys["gmail.com"][4] = 1589384595547333389911397650751436647
    verifiedMailserverKeys["gmail.com"][5] = 1428144289938431173655248321840778928
    verifiedMailserverKeys["gmail.com"][6] = 1919508490085653366961918211405731923
    verifiedMailserverKeys["gmail.com"][7] = 2358009612379481320362782200045159837
    verifiedMailserverKeys["gmail.com"][8] = 518833500408858308962881361452944175
    verifiedMailserverKeys["gmail.com"][9] = 1163210548821508924802510293967109414
    verifiedMailserverKeys["gmail.com"][10] = 1361351910698751746280135795885107181
    verifiedMailserverKeys["gmail.com"][11] = 1445969488612593115566934629427756345
    verifiedMailserverKeys["gmail.com"][12] = 2457340995040159831545380614838948388
    verifiedMailserverKeys["gmail.com"][13] = 2612807374136932899648418365680887439
    verifiedMailserverKeys["gmail.com"][14] = 16021263889082005631675788949457422
    verifiedMailserverKeys["gmail.com"][15] = 299744519975649772895460843780023483
    verifiedMailserverKeys["gmail.com"][16] = 3933359104846508935112096715593287

    verifiedMailserverKeys["hotmail.com"][0] = 128339925410438117770406273090474249
    verifiedMailserverKeys["hotmail.com"][1] = 2158906895782814996316644028571725310
    verifiedMailserverKeys["hotmail.com"][2] = 2278019331164769360372919938620729773
    verifiedMailserverKeys["hotmail.com"][3] = 1305319804455735154587383372570664109
    verifiedMailserverKeys["hotmail.com"][4] = 2358345194772578919713586294428642696
    verifiedMailserverKeys["hotmail.com"][5] = 1333692900109074470874155333266985021
    verifiedMailserverKeys["hotmail.com"][6] = 2252956899717870524129098594286063236
    verifiedMailserverKeys["hotmail.com"][7] = 1963190090223950324858653797870319519
    verifiedMailserverKeys["hotmail.com"][8] = 2099240641399560863760865662500577339
    verifiedMailserverKeys["hotmail.com"][9] = 1591320380606901546957315803395187883
    verifiedMailserverKeys["hotmail.com"][10] = 1943831890994545117064894677442719428
    verifiedMailserverKeys["hotmail.com"][11] = 2243327453964709681573059557263184139
    verifiedMailserverKeys["hotmail.com"][12] = 1078181067739519006314708889181549671
    verifiedMailserverKeys["hotmail.com"][13] = 2209638307239559037039565345615684964
    verifiedMailserverKeys["hotmail.com"][14] = 1936371786309180968911326337008120155
    verifiedMailserverKeys["hotmail.com"][15] = 2611115500285740051274748743252547506
    verifiedMailserverKeys["hotmail.com"][16] = 3841983033048617585564391738126779

    verifiedMailserverKeys["ethereum.org"][0] = 119886678941863893035426121053426453
    verifiedMailserverKeys["ethereum.org"][1] = 1819786846289142128062035525540154587
    verifiedMailserverKeys["ethereum.org"][2] = 18664768675154515296388092785538021
    verifiedMailserverKeys["ethereum.org"][3] = 2452916380017370778812419704280324749
    verifiedMailserverKeys["ethereum.org"][4] = 147541693845229442834461965414634823
    verifiedMailserverKeys["ethereum.org"][5] = 714676313158744653841521918164405002
    verifiedMailserverKeys["ethereum.org"][6] = 1495951612535183023869749054624579068
    verifiedMailserverKeys["ethereum.org"][7] = 974892773071523448175479681445882254
    verifiedMailserverKeys["ethereum.org"][8] = 53117264910028079
    verifiedMailserverKeys["ethereum.org"][9] = 0
    verifiedMailserverKeys["ethereum.org"][10] = 0
    verifiedMailserverKeys["ethereum.org"][11] = 0
    verifiedMailserverKeys["ethereum.org"][12] = 0
    verifiedMailserverKeys["ethereum.org"][13] = 0
    verifiedMailserverKeys["ethereum.org"][14] = 0
    verifiedMailserverKeys["ethereum.org"][15] = 0
    verifiedMailserverKeys["ethereum.org"][16] = 0

    verifiedMailserverKeys["skiff.com"][0] = 2637270478154147701703365710201556843
    verifiedMailserverKeys["skiff.com"][1] = 2082690054369201099288110516791254232
    verifiedMailserverKeys["skiff.com"][2] = 1108253255381437937379143813840625818
    verifiedMailserverKeys["skiff.com"][3] = 1535554154331979875086566323552212673
    verifiedMailserverKeys["skiff.com"][4] = 273019276149049264013012583938735085
    verifiedMailserverKeys["skiff.com"][5] = 741436192387359949728618527229215889
    verifiedMailserverKeys["skiff.com"][6] = 1851608307869135205473270393049341043
    verifiedMailserverKeys["skiff.com"][7] = 1428718881138594152975742734455140338
    verifiedMailserverKeys["skiff.com"][8] = 778850382237088374273157869416671135
    verifiedMailserverKeys["skiff.com"][9] = 549599381370898291203601849666570597
    verifiedMailserverKeys["skiff.com"][10] = 221161044322752364431317167498442512
    verifiedMailserverKeys["skiff.com"][11] = 2041801755941244198449288035460748224
    verifiedMailserverKeys["skiff.com"][12] = 1083114189020989870026920716001138899
    verifiedMailserverKeys["skiff.com"][13] = 1380362773644527202561949550864154963
    verifiedMailserverKeys["skiff.com"][14] = 1366599807917971505788646146248798329
    verifiedMailserverKeys["skiff.com"][15] = 391565989352979266796804441125988853
    verifiedMailserverKeys["skiff.com"][16] = 3704766395208948862861103932863036
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
    require(state == 2, "Invalid final state of packed bytes in email");
    // console.log("Characters in username: ", nonzeroBytesArrayIndex);
    require(nonzeroBytesArrayIndex <= maxBytes, "Packed bytes more than allowed max length!");
    return returnValue;
    // Have to end at the end of the email -- state cannot be 1 since there should be an email footer
  }

  function _stringEq(string memory a, string memory b) public pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  function mint(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals) public {
    // Checks: Verify proof and check signals
    // require(signals[0] == 1337, "invalid signals"); // TODO no invalid signal check yet, which is fine since the zk proof does it

    // 3 public signals are the masked packed message bytes, 17 are the modulus.
    uint256[] memory bodySignals = new uint256[](body_len);
    uint256[] memory rsaModulusSignals = new uint256[](header_len);
    for (uint256 i = 0; i < body_len; i++) bodySignals[i] = signals[i];
    for (uint256 i = body_len; i < msg_len - 1; i++) rsaModulusSignals[i - body_len] = signals[i];

    // Check eth address committed to in proof matches msg.sender, to avoid doublespend
    // TODO: Note that this is buggy since it is malleable
    // nullifier[a[0]] = 1;
    // require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

    // Check from/to email domains are correct [in this case, only from domain is checked]
    // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
    // We will upload the version with these domain checks soon!
    // require(_domainCheck(headerSignals), "Invalid domain");
    string memory fromEmail = convertPackedBytesToBytes(bodySignals, packSize * body_len);
    string memory recipientEmail = convertPackedBytesToBytes(bodySignals, packSize * body_len);
    string memory amount = convertPackedBytesToBytes(bodySignals, packSize * body_len);
    string memory currency = convertPackedBytesToBytes(bodySignals, packSize * body_len);

    // Verify that the public key for RSA matches the hardcoded one
    for (uint i = body_len; i < msg_len - 1; i++) {
      require(signals[i] == verifiedMailserverKeys[domain][i - body_len], "Invalid: RSA modulus not matched");
    }
    require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

    // Effects: Send money

  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
    require(from == address(0), "Cannot transfer - VerifiedEmail is soulbound");
  }
}
