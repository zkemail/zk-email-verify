// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
  A Registry that store the hash(dkim_public_key) for each domain
 */
contract DKIMREgistry is Ownable {
    // Mapping from domain name to DKIM public key hash
    mapping(string => bytes32) public dkimPublicKeyHashes;

    function getDKIMPublicKeyHash(
        string memory domainName
    ) public view returns (bytes32) {
        return dkimPublicKeyHashes[domainName];
    }

    function setDKIMPublicKeyHash(
        string memory domainName,
        bytes32 publicKeyHash
    ) public onlyOwner {
        dkimPublicKeyHashes[domainName] = publicKeyHash;
    }
}
