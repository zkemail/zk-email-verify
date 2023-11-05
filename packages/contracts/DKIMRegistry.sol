// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IDKIMRegistry.sol";

/**
  A Registry that store the hash(dkim_public_key) for each domain
  The hash is calculated by taking Poseidon of DKIM key split into 9 chunks of 242 bits each

  https://zkrepl.dev/?gist=43ce7dce2466c63812f6efec5b13aa73 can be used to generate the public key hash. 
  The same code is used in EmailVerifier.sol
  Input is DKIM pub key split into 17 chunks of 121 bits. You can use `helpers` package to fetch/split DKIM keys
 */
contract DKIMRegistry is IDKIMRegistry, Ownable {
    event DKIMPublicKeyHashRegistered(string domainName, bytes32 publicKeyHash);
    event DKIMPublicKeyHashRevoked(bytes32 publicKeyHash);

    // Mapping from domain name to DKIM public key hash
    mapping(string => mapping(bytes32 => bool)) public dkimPublicKeyHashes;

    // DKIM public that are revoked (eg: in case of private key compromise)
    mapping(bytes32 => bool) public revokedDKIMPublicKeyHashes;

    constructor() {
        // Set values for popular domains
        dkimPublicKeyHashes["gmail.com"][
            bytes32(uint256(21238126716164910617487233347059218993958564577330259377744533585136010170208))
        ] = true;

        dkimPublicKeyHashes["hotmail.com"][
            bytes32(uint256(2431254542644577945126644490189743659677343436440304264654087065353925216026))
        ] = true;

        dkimPublicKeyHashes["twitter.com"][
            bytes32(uint256(5857406240302475676709141738935898448223932090884766940073913110146444539372))
        ] = true;

        dkimPublicKeyHashes["ethereum.org"][
            bytes32(uint256(1064717399289379939765004128465682276424933518837235377976999291216925329691))
        ] = true;

        dkimPublicKeyHashes["skiff.com"][
            bytes32(uint256(7901875575997183258695482461141301358756276811120772965768802311294654527542))
        ] = true;
    }

    function _stringEq(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function isDKIMPublicKeyHashValid(
        string memory domainName,
        bytes32 publicKeyHash
    ) public view returns (bool) {
        if (revokedDKIMPublicKeyHashes[publicKeyHash]) {
            return false;
        }

        if (dkimPublicKeyHashes[domainName][publicKeyHash]) {
            return true;
        }

        return false;
    }

    function setDKIMPublicKeyHash(
        string memory domainName,
        bytes32 publicKeyHash
    ) public onlyOwner {
        require(
            !revokedDKIMPublicKeyHashes[publicKeyHash],
            "cannot set revoked pubkey"
        );

        dkimPublicKeyHashes[domainName][publicKeyHash] = true;

        emit DKIMPublicKeyHashRegistered(domainName, publicKeyHash);
    }

    function revokeDKIMPublicKeyHash(bytes32 publicKeyHash) public onlyOwner {
        revokedDKIMPublicKeyHashes[publicKeyHash] = true;

        emit DKIMPublicKeyHashRevoked(publicKeyHash);
    }
}
