// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ERC-7969 DKIM Registry Interface.
 *
 * @dev This interface provides a standard way to register and validate DKIM public key hashes onchain
 * Domain owners can register their DKIM public key hashes and third parties can verify their validity
 * The interface enables email-based account abstraction and secure account recovery mechanisms.
 *
 * NOTE: The ERC-165 identifier for this interface is `0xdee3d600`.
 */
interface IDKIMRegistry {
    /// @dev Emitted when a new DKIM public key hash is registered for a domain
    /// @param domainHash The keccak256 hash of the lowercase domain name
    /// @param keyHash The keccak256 hash of the DKIM public key
    event KeyHashRegistered(bytes32 domainHash, bytes32 keyHash);

    /// @dev Emitted when a DKIM public key hash is revoked for a domain
    /// @param domainHash The keccak256 hash of the domain name
    event KeyHashRevoked(bytes32 domainHash);

    /// @dev Checks if a DKIM key hash is valid for a given domain
    /// @param domainHash The keccak256 hash of the lowercase domain name
    /// @param keyHash The keccak256 hash of the DKIM public key
    /// @return True if the key hash is valid for the domain, false otherwise
    function isKeyHashValid(
        bytes32 domainHash,
        bytes32 keyHash
    ) external view returns (bool);
}
