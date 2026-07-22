// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC7969.sol";

/**
 *   A Registry that store the hash(dkim_public_key) for each domain
 *   The hash is calculated by taking Poseidon of DKIM key split into 9 chunks of 242 bits each
 *
 *   https://zkrepl.dev/?gist=43ce7dce2466c63812f6efec5b13aa73 can be used to generate the public key hash.
 *   The same code is used in EmailVerifier.sol
 *   Input is DKIM pub key split into 17 chunks of 121 bits. You can use `helpers` package to fetch/split DKIM keys
 */
contract DKIMRegistry is IDKIMRegistry, Ownable {
    constructor(address _owner) Ownable(_owner) { }

    // Mapping from hashed domain name to DKIM public key hash to enabled
    mapping(bytes32 => mapping(bytes32 => bool)) private _keyHashes;

    /**
     * @notice Checks if a DKIM key hash is valid for a given domain
     * @param domainHash The hash of the domain name
     * @param keyHash The hash of the DKIM public key
     * @return bool True if the key hash is valid for the domain, false otherwise
     */
    function isKeyHashValid(bytes32 domainHash, bytes32 keyHash) public view returns (bool) {
        return _keyHashes[domainHash][keyHash];
    }

    /**
     * @notice Sets a DKIM key hash for a domain
     * @param domainHash The hash of the domain name
     * @param keyHash The hash of the DKIM public key to register
     * @dev Only callable by the contract owner
     * @dev Cannot set zero hash as a valid key hash
     */
    function setDKIMPublicKeyHash(bytes32 domainHash, bytes32 keyHash) public onlyOwner {
        require(keyHash != bytes32(0), "cannot set zero hash");
        _keyHashes[domainHash][keyHash] = true;
        emit KeyHashRegistered(domainHash, keyHash);
    }

    /**
     * @notice Sets multiple DKIM key hashes for a domain in a single transaction
     * @param domainHash The hash of the domain name
     * @param keyHashes Array of DKIM public key hashes to register
     * @dev Only callable by the contract owner
     * @dev Array must not be empty
     * @dev Each key hash must not be zero
     */
    function setDKIMPublicKeyHashes(bytes32 domainHash, bytes32[] memory keyHashes) public onlyOwner {
        require(keyHashes.length > 0, "empty array");
        for (uint256 i = 0; i < keyHashes.length; i++) {
            setDKIMPublicKeyHash(domainHash, keyHashes[i]);
        }
    }

    /**
     * @notice Revokes a DKIM key hash for a domain
     * @param domainHash The hash of the domain name
     * @param keyHash The hash of the DKIM public key to revoke
     * @dev Only callable by the contract owner
     * @dev Sets the key hash mapping to false, effectively revoking it
     */
    function revokeDKIMPublicKeyHash(bytes32 domainHash, bytes32 keyHash) public onlyOwner {
        delete _keyHashes[domainHash][keyHash];
        emit KeyHashRevoked(domainHash);
    }
}
