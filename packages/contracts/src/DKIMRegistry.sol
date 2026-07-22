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
    constructor(address _signer) Ownable(_signer) { }

    // Mapping from domain name hash to DKIM public key hash
    mapping(bytes32 => mapping(bytes32 => bool)) public dkimPublicKeyHashes;

    function isKeyHashValid(bytes32 domainNameHash, bytes32 publicKeyHash) public view returns (bool) {
        return dkimPublicKeyHashes[domainNameHash][publicKeyHash];
    }

    function setDKIMPublicKeyHash(bytes32 domainHash, bytes32 publicKeyHash) public onlyOwner {
        dkimPublicKeyHashes[domainHash][publicKeyHash] = true;
        emit KeyHashRegistered(domainHash, publicKeyHash);
    }

    function setDKIMPublicKeyHashes(bytes32 domainHash, bytes32[] memory publicKeyHashes) public onlyOwner {
        for (uint256 i = 0; i < publicKeyHashes.length; i++) {
            setDKIMPublicKeyHash(domainHash, publicKeyHashes[i]);
        }
    }

    // Revokes a key hash for a single domain (ERC-7969: scoped and reversible, not a global blacklist).
    function revokeDKIMPublicKeyHash(bytes32 domainHash, bytes32 publicKeyHash) public onlyOwner {
        dkimPublicKeyHashes[domainHash][publicKeyHash] = false;

        emit KeyHashRevoked(domainHash);
    }
}
