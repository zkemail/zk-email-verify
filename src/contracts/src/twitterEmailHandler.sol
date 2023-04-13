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

contract VerifiedTwitterEmail is ERC721Enumerable, Verifier {
    using Counters for Counters.Counter;
    using StringUtils for *;
    using NFTSVG for *;

    Counters.Counter private tokenCounter;

    uint16 public constant msg_len = 21; // header + body
    uint16 public constant bytesInPackedBytes = 7; // 7 bytes in a packed item returned from circom
    uint256 public constant body_len = 3;
    uint256 public constant rsa_modulus_chunks_len = 17;
    uint256 public constant header_len = msg_len - body_len;
    uint256 public constant addressIndexInSignals = msg_len - 1;

    mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
    mapping(uint256 => string) public tokenIDToName;
    string constant domain = "twitter.com";

    constructor() ERC721("VerifiedEmail", "VerifiedEmail") {
        // Do dig TXT outgoing._domainkey.twitter.com to verify these.
        // This is the base 2^121 representation of that key.
        // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
        require(rsa_modulus_chunks_len + body_len + 1 == msg_len, "Variable counts are wrong!");

        // TODO: Create a type that takes in a raw RSA key, the bit count,
        // and whether or not its base64 encoded, and converts it to either 8 or 16 signals
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
        string memory result = string(
            abi.encodePacked("Twitter username", twitter_username, "is owned by", StringUtils.toString(address_owner))
        );
        return result;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        string memory username = tokenIDToName[tokenId];
        address owner = ownerOf(tokenId);
        return NFTSVG.constructAndReturnSVG(username, tokenId, owner);
    }

    function _domainCheck(uint256[] memory headerSignals) public pure returns (bool) {
        string memory senderBytes = StringUtils.convertPackedBytesToBytes(headerSignals, 18, bytesInPackedBytes);
        string[2] memory domainStrings = ["verify@twitter.com", "info@twitter.com"];
        return
            StringUtils.stringEq(senderBytes, domainStrings[0]) || StringUtils.stringEq(senderBytes, domainStrings[1]);
        // Usage: require(_domainCheck(senderBytes, domainStrings), "Invalid domain");
    }

    function mint(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals)
        public
    {
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

        // Check eth address committed to in proof matches msg.sender, to avoid replayability
        require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

        // Check from/to email domains are correct [in this case, only from domain is checked]
        // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
        // We will upload the version with these domain checks soon!
        // require(_domainCheck(headerSignals), "Invalid domain");

        // Verify that the public key for RSA matches the hardcoded one
        for (uint256 i = body_len; i < msg_len - 1; i++) {
            require(signals[i] == verifiedMailserverKeys[domain][i - body_len], "Invalid: RSA modulus not matched");
        }
        require(verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first

        // Effects: Mint token
        uint256 tokenId = tokenCounter.current() + 1;
        string memory messageBytes =
            StringUtils.convertPackedBytesToBytes(bodySignals, bytesInPackedBytes * body_len, bytesInPackedBytes);
        tokenIDToName[tokenId] = messageBytes;
        _mint(msg.sender, tokenId);
        tokenCounter.increment();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
        require(from == address(0), "Cannot transfer - VerifiedEmail is soulbound");
    }
}
