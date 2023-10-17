// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDKIMRegistry {
    function getDKIMPublicKeyHash(
        string memory domainName
    ) external returns (bytes32);

    function setDKIMPublicKeyHash(
        string memory domainName,
        bytes32 publicKeyHash
    ) external;
}
