// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
// import "./utils/StringUtils.sol";
import "./utils/NFTSVG.sol";
import {Verifier} from "./Groth16VerifierTwitter.sol";
// import "./utils/MailServer.sol";
import "@zk-email/contracts/EmailVerifier.sol";

contract VerifiedTwitterEmail is ERC721Enumerable, EmailVerifier {
    using Counters for Counters.Counter;
    using StringUtils for *;
    using NFTSVG for *;

    Counters.Counter private tokenCounter;

    uint16 public constant msg_len = 21; // header + body
    uint16 public constant bytesInPackedBytes = 7; // 7 bytes in a packed item returned from circom
    uint32 public constant body_len = 3;
    uint8 public constant rsa_modulus_chunks_len = 17;
    uint256 public constant header_len = msg_len - body_len;
    uint256 public constant addressIndexInSignals = msg_len - 1;

    mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
    mapping(uint256 => string) public tokenIDToName;
    string constant domain = "twitter.com";
    // MailServer mailServer;
    // Verifier public immutable verifier;

    constructor(Verifier v, MailServer m) EmailVerifier(v, m) ERC721("VerifiedEmail", "VerifiedEmail") {
        // verifier = v;
        // mailServer = m;
        require(rsa_modulus_chunks_len + body_len + 1 == msg_len, "Variable counts are wrong!");
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
        string memory senderBytes = StringUtils.convertPackedBytesToString(headerSignals, 18, bytesInPackedBytes);
        string[2] memory domainStrings = ["verify@twitter.com", "info@twitter.com"];
        return
            StringUtils.stringEq(senderBytes, domainStrings[0]) || StringUtils.stringEq(senderBytes, domainStrings[1]);
        // Usage: require(_domainCheck(senderBytes, domainStrings), "Invalid domain");
    }

    function mint(uint256[8] memory proof, uint256[] memory signals)
        public
    {
        // TODO no invalid signal check yet, which is fine since the zk proof does it
        // Checks: Verify proof and check signals
        // require(signals[0] == 1337, "invalid signals");

        // 3 public signals are the masked packed message bytes, 17 are the modulus.
        
        // Check eth address committed to in proof matches msg.sender, to avoid replayability
        // require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

        // Check from/to email domains are correct [in this case, only from domain is checked]
        // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
        // We will upload the version with these domain checks soon!
        // require(_domainCheck(headerSignals), "Invalid domain");

        // Veiry RSA and proof
        verifyEmail(domain, proof, signals, body_len, rsa_modulus_chunks_len);

        uint256[] memory bodySignals = new uint256[](body_len);
        for (uint256 i = 0; i < body_len; i++) {
            bodySignals[i] = signals[i];
        }

        // Effects: Mint token
        uint256 tokenId = tokenCounter.current() + 1;
        string memory messageBytes =
            StringUtils.convertPackedBytesToString(bodySignals, bytesInPackedBytes * body_len, bytesInPackedBytes);
        tokenIDToName[tokenId] = messageBytes;
        _mint(msg.sender, tokenId);
        tokenCounter.increment();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
        require(from == address(0), "Cannot transfer - VerifiedEmail is soulbound");
    }
}
