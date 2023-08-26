// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
  A Registry that store the hash(dkim_public_key) for each domain
  The hash is calculated by taking Poseidon of DKIM key split into 9 chunks of 242 bits each
 */
contract DKIMRegistry is Ownable {
    // Mapping from domain name to DKIM public key hash
    mapping(string => uint256) public dkimPublicKeyHashes;

    constructor() {
        // Set values for popular domains
        dkimPublicKeyHashes["gmail.com"] = uint256(20579775636546222313859320423592165398188168817714003219389601176739340973605);
        dkimPublicKeyHashes["hotmail.com"] = uint256(2750248559912404074361997670683337416910370052869160728223409986079552486582);
        dkimPublicKeyHashes["twitter.com"] = uint256(12431732230788297063498039481224031586256793440953465069048041914965586355958);
        dkimPublicKeyHashes["ethereum.org"] = uint256(13749471426528386843484698195116860745506750565298853141220185289842769029726);
        dkimPublicKeyHashes["skiff.com"] = uint256(11874169184886542147081299005924838984240934585001783050565158265014763417816);
    }

    function _stringEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function getDKIMPublicKeyHash(
        string memory domainName
    ) public view returns (uint256) {
        return dkimPublicKeyHashes[domainName];
    }

    function setDKIMPublicKeyHash(
        string memory domainName,
        uint256 publicKeyHash
    ) public onlyOwner {
        dkimPublicKeyHashes[domainName] = publicKeyHash;
    }
}
