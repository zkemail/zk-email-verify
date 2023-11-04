// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDKIMRegistry {
    function isDKIMPublicKeyHashValid(
        string memory domainName,
        bytes32 publicKeyHash
    ) external view returns (bool);
}
