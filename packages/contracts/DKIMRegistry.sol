// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
  A Registry that store the hash(dkim_public_key) for each domain
  The hash is calculated by taking Poseidon of DKIM key split into 9 chunks of 242 bits each
 */
contract DKIMRegistry is Ownable {
    // Mapping from domain name to DKIM public key hash
    mapping(string => bytes32) public dkimPublicKeyHashes;

    constructor() {
        // Set values for popular domains
        dkimPublicKeyHashes["gmail.com"] = bytes32(uint256(11483187309550492434251393097147598294827822464091613159350479758365859455414));
        dkimPublicKeyHashes["hotmail.com"] = bytes32(uint256(6788424163244466163589797850030385900652275445139855140541297907972797628425));
        dkimPublicKeyHashes["twitter.com"] = bytes32(uint256(19743418439863821416546296228517660207871960362882681521377768877432202058884));
        dkimPublicKeyHashes["ethereum.org"] = bytes32(uint256(11683950163249901682501659643486019690915583392583995752022252838546453911974));
        dkimPublicKeyHashes["skiff.com"] = bytes32(uint256(2799953142570278748798388713281200160833907590098308815252667444994197276860));
    }

    function _stringEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

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
