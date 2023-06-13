// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
    MailServer mailServer;
    Groth16Verifier public immutable _verifier;

    constructor(Groth16Verifier v, MailServer m) {
        _verifier = v;
        mailServer = m;
    }

    function verifyEmail(
        string memory domain,
        uint256[8] memory proof,
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

        for (uint32 i = 0; i < rsaKeyChuckLength; i++) {
            uint32 index = i + rsaKeyStartIndex;
            rsaKey[i] = signals[index];
        }

        // Verify RSA Key
        require(
            mailServer.verifyKeyForDomain(domain, rsaKey),
            "Invalid RSA Key"
        );

        // Verify Proof
        require(
            _verifier.verifyProof(
                [proof[0], proof[1]],
                [[proof[2], proof[3]], [proof[4], proof[5]]],
                [proof[6], proof[7]],
                signals
            ),
            "Invalid Proof"
        );
    }
}
