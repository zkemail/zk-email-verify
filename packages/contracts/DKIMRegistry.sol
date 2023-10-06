// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
        dkimPublicKeyHashes["gmail.com"] = bytes32(uint256(21238126716164910617487233347059218993958564577330259377744533585136010170208));
        dkimPublicKeyHashes["hotmail.com"] = bytes32(uint256(2431254542644577945126644490189743659677343436440304264654087065353925216026));
        dkimPublicKeyHashes["twitter.com"] = bytes32(uint256(5857406240302475676709141738935898448223932090884766940073913110146444539372));
        dkimPublicKeyHashes["ethereum.org"] = bytes32(uint256(1064717399289379939765004128465682276424933518837235377976999291216925329691));
        dkimPublicKeyHashes["skiff.com"] = bytes32(uint256(7901875575997183258695482461141301358756276811120772965768802311294654527542));
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
