// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@zk-email/contracts/DKIMRegistry.sol";
import "./utils/StringUtils.sol";
import "./utils/NFTSVG.sol";
import { Verifier } from "./Groth16VerifierTwitter.sol";


contract VerifiedTwitterEmail is ERC721Enumerable {
    using Counters for Counters.Counter;
    using StringUtils for *;
    using NFTSVG for *;

    uint16 public constant bytesInPackedBytes = 7; // 7 bytes in a packed item returned from circom
    string constant domain = "twitter.com";
    
    uint16 public constant signalLength = 5; // length of signals array
    uint32 public constant pubKeyHashIndexInSignals = 0; // index of DKIM public key hash in signals array
    uint32 public constant usernameIndexInSignals = 1; // index of first packed twitter username in signals array
    uint32 public constant usernameLengthInSignals = 3; // length of packed twitter username in signals array
    uint32 public constant addressIndexInSignals = 4; // index of ethereum address in signals array

    Counters.Counter private tokenCounter;
    DKIMRegistry dkimRegistry;
    Verifier public immutable verifier;

    mapping(uint256 => string) public tokenIDToName;

    constructor(Verifier v, DKIMRegistry d) ERC721("VerifiedEmail", "VerifiedEmail") {
        verifier = v;
        dkimRegistry = d;
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

    /// Mint a token proving twitter ownership by verifying proof of email
    /// @param proof ZK proof of the circuit - a[2], b[4] and c[2] encoded in series
    /// @param signals Public signals of the circuit. First item is pubkey_hash, next 3 are twitter username, the last one is etherum address
    function mint(uint256[8] memory proof, uint256[5] memory signals) public {
        // TODO no invalid signal check yet, which is fine since the zk proof does it
        // Checks: Verify proof and check signals
        // require(signals[0] == 1337, "invalid signals");

        // public signals are the masked packed message bytes, and hash of public key.

        // Check eth address committed to in proof matches msg.sender, to avoid replayability
        // require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

        // Check from/to email domains are correct [in this case, only from domain is checked]
        // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
        // We will upload the version with these domain checks soon!
        // require(_domainCheck(headerSignals), "Invalid domain");

        // Verify the DKIM public key hash stored on-chain matches the one used in circuit
        bytes32 dkimPublicKeyHashInCircuit = bytes32(signals[pubKeyHashIndexInSignals]);
        bytes32 dkimPublicKeyHashOnChain = dkimRegistry.getDKIMPublicKeyHash(domain);

        require(dkimPublicKeyHashOnChain != bytes32(0), "dkim for domain not found");

        require(dkimPublicKeyHashInCircuit == dkimPublicKeyHashOnChain, "invalid signature"); 

        // Veiry RSA and proof
        require(
            verifier.verifyProof(
                [proof[0], proof[1]],
                [[proof[2], proof[3]], [proof[4], proof[5]]],
                [proof[6], proof[7]],
                signals
            ),
            "Invalid Proof"
        );

        uint256[] memory bodySignals = new uint256[](usernameLengthInSignals);
        for (uint256 i = usernameIndexInSignals; i < (usernameIndexInSignals + usernameLengthInSignals); i++) {
            bodySignals[i - usernameIndexInSignals] = signals[i];
        }

        // Effects: Mint token
        uint256 tokenId = tokenCounter.current() + 1;

        // TODO: Change bytesInPackedBytes * usernameLengthInSignals -> usernameLengthInSignals
        string memory messageBytes = StringUtils.convertPackedBytesToString(
            bodySignals,
            bytesInPackedBytes * usernameLengthInSignals,
            bytesInPackedBytes
        );
        tokenIDToName[tokenId] = messageBytes;
        _mint(msg.sender, tokenId);
        tokenCounter.increment();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal {
        require(
            from == address(0),
            "Cannot transfer - VerifiedEmail is soulbound"
        );
    }
}
