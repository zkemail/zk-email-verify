// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./utils/StringUtils.sol";
import "./utils/MailServer.sol";

interface Groth16Verifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) external returns (bool);
}

contract EmailVerifier {
    using StringUtils for *;

    MailServer mailServer;
    Groth16Verifier public immutable verifier;

    constructor(Groth16Verifier _verifier, MailServer _mailServer) {
        verifier = _verifier;
        mailServer = _mailServer;
    }

    function verifyEmail(
        string domain,
        uint256[8] proof,
        uint256[] memory signals,
        uint32 rsaKeyStartIndex,
        uint8 rsaKeyChuckLength
    ) public {
        require(
            signals.length >= rsaKeyStartIndex + rsaKeyChuckLength,
            "Invalid signals length"
        );

        // Extract RSA Key from signals
        uint256[] memory rsaKey = new uint256[](rsaKeyChuckLength);

        for (uint256 i = 0; i < rsaKeyChuckLength; i++) {
            uint32 index = i + rsaKeyStartIndex;
            rsaKey[i] = signals[index];
        }

        // Verify RSA Key
        require(mailServer.verifyKeyForDomain(domain, rsaKey), "Invalid RSA Key");

        // Verify Proof
        (uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c) = abi.decode(proof, (uint256[2], uint256[2][2], uint256[2]));
        require(verifier.verifyProof(a, b, c, signals), "Invalid Proof");
    }
}
