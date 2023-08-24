// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
  A Registry that store the hash(dkim_public_key) for each domain
 */
contract DKIMRegistry is Ownable {
    // Use constants for popular domains to save gas on reads
    uint256 constant GMAIL_HASH =
        21238126716164910617487233347059218993958564577330259377744533585136010170208;

    uint256 constant HOTMAIL_HASH =
        2431254542644577945126644490189743659677343436440304264654087065353925216026;

    uint256 constant TWITTER_HASH =
        5857406240302475676709141738935898448223932090884766940073913110146444539372;

    uint256 constant ETHEREUM_ORG_HASH =
        1064717399289379939765004128465682276424933518837235377976999291216925329691;

    uint256 constant SKIFF_HASH =
        7901875575997183258695482461141301358756276811120772965768802311294654527542;

    // Mapping from domain name to DKIM public key hash
    mapping(string => bytes32) public dkimPublicKeyHashes;

    function _stringEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function getDKIMPublicKeyHash(
        string memory domainName
    ) public view returns (bytes32) {
        if (_stringEq(domainName, "gmail.com")) {
            return bytes32(GMAIL_HASH);
        }

        if (_stringEq(domainName, "hotmail.com")) {
            return bytes32(HOTMAIL_HASH);
        }

        if (_stringEq(domainName, "twitter.com")) {
            return bytes32(TWITTER_HASH);
        }

        if (_stringEq(domainName, "ethereum.org")) {
            return bytes32(ETHEREUM_ORG_HASH);
        }

        if (_stringEq(domainName, "skiff.com")) {
            return bytes32(SKIFF_HASH);
        }

        return dkimPublicKeyHashes[domainName];
    }

    function setDKIMPublicKeyHash(
        string memory domainName,
        bytes32 publicKeyHash
    ) public onlyOwner {
        dkimPublicKeyHashes[domainName] = publicKeyHash;
    }
}
