// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDKIMRegistry {
    function getDKIMPublicKeyHash(
        string memory domainName
    ) external view returns (bytes32);
}
