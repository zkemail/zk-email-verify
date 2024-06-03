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
contract UserOverrideableDKIMRegistry is IDKIMRegistry, Ownable {
    constructor(address _owner) Ownable(_owner) {}

    event DKIMPublicKeyHashRegistered(
        string domainName,
        bytes32 publicKeyHash,
        address register
    );
    event DKIMPublicKeyHashRevoked(bytes32 publicKeyHash, address register);

    // Mapping from domain name to DKIM public key hash
    mapping(string => mapping(bytes32 => mapping(address => bool)))
        public dkimPublicKeyHashes;

    // DKIM public that are revoked (eg: in case of private key compromise)
    mapping(bytes32 => mapping(address => bool))
        public revokedDKIMPublicKeyHashes;

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
        if (
            revokedDKIMPublicKeyHashes[publicKeyHash][address(0)] ||
            revokedDKIMPublicKeyHashes[publicKeyHash][msg.sender]
        ) {
            return false;
        }

        if (dkimPublicKeyHashes[domainName][publicKeyHash][address(0)]) {
            return true;
        }

        if (dkimPublicKeyHashes[domainName][publicKeyHash][msg.sender]) {
            return true;
        }

        return false;
    }

    /**
     * @notice Sets the DKIM public key hash for a given domain.
     * @dev This function allows the owner to set a DKIM public key hash for all users, or an individual user to set it for themselves.
     * @param domainName The domain name for which the DKIM public key hash is being set.
     * @param publicKeyHash The hash of the DKIM public key to be set.
     * @param individual A boolean indicating whether the hash is being set for an individual user (true) or for all users (false).
     * @custom:require Only the owner can set the DKIM public key hash for all users when `individual` is false.
     * @custom:require The public key hash must not be revoked.
     * @custom:event DKIMPublicKeyHashRegistered Emitted when a DKIM public key hash is successfully set.
     */
    function setDKIMPublicKeyHash(
        string memory domainName,
        bytes32 publicKeyHash,
        bool individual
    ) public {
        address register = msg.sender;
        if (!individual) {
            require(
                msg.sender == owner(),
                "only owner can set DKIM public key hash for all users"
            );
            register = address(0);
        }
        require(
            !revokedDKIMPublicKeyHashes[publicKeyHash][register],
            "cannot set revoked pubkey"
        );

        dkimPublicKeyHashes[domainName][publicKeyHash][register] = true;

        emit DKIMPublicKeyHashRegistered(domainName, publicKeyHash, register);
    }

    function setDKIMPublicKeyHashes(
        string memory domainName,
        bytes32[] memory publicKeyHashes,
        bool individual
    ) public {
        for (uint256 i = 0; i < publicKeyHashes.length; i++) {
            setDKIMPublicKeyHash(domainName, publicKeyHashes[i], individual);
        }
    }

    /**
     * @notice Revokes a DKIM public key hash.
     * @dev This function allows the owner to revoke a DKIM public key hash for all users, or an individual user to revoke it for themselves.
     * @param publicKeyHash The hash of the DKIM public key to be revoked.
     * @param individual A boolean indicating whether the hash is being revoked for an individual user (true) or for all users (false).
     * @custom:require Only the owner can revoke the DKIM public key hash for all users when `individual` is false.
     * @custom:event DKIMPublicKeyHashRevoked Emitted when a DKIM public key hash is successfully revoked.
     */
    function revokeDKIMPublicKeyHash(
        bytes32 publicKeyHash,
        bool individual
    ) public {
        address register = msg.sender;
        if (!individual) {
            require(
                msg.sender == owner(),
                "only owner can revoke DKIM public key hash for all users"
            );
            register = address(0);
        }
        revokedDKIMPublicKeyHashes[publicKeyHash][register] = true;

        emit DKIMPublicKeyHashRevoked(publicKeyHash, register);
    }
}
