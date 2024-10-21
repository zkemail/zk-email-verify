// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IDKIMRegistry.sol";

interface IDKIMRegistryExt is IDKIMRegistry {
    function isDKIMPublicKeyHashValid(
        string memory domainName,
        bytes32 publicKeyHash,
        address authorizer
    ) external view returns (bool);
}
