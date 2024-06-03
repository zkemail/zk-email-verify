// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IDKIMRegistry.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
  A Registry that store the hash(dkim_public_key) for each domain
  The hash is calculated by taking Poseidon of DKIM key split into 9 chunks of 242 bits each

  https://zkrepl.dev/?gist=43ce7dce2466c63812f6efec5b13aa73 can be used to generate the public key hash. 
  The same code is used in EmailVerifier.sol
  Input is DKIM pub key split into 17 chunks of 121 bits. You can use `helpers` package to fetch/split DKIM keys
 */
contract UserOverrideableDKIMRegistry is IDKIMRegistry, Ownable {
    using Strings for *;
    using ECDSA for *;

    event DKIMPublicKeyHashRegistered(
        string domainName,
        bytes32 publicKeyHash,
        address register
    );
    event DKIMPublicKeyHashRevoked(bytes32 publicKeyHash, address register);

    // Main authorizer address.
    address public mainAuthorizer;

    // Mapping from domain name to DKIM public key hash
    mapping(string => mapping(bytes32 => mapping(address => bool)))
        public dkimPublicKeyHashes;

    // DKIM public that are revoked (eg: in case of private key compromise)
    mapping(bytes32 => mapping(address => bool))
        public revokedDKIMPublicKeyHashes;

    string public constant SET_PREFIX = "SET:";
    string public constant REVOKE_PREFIX = "REVOKE:";

    constructor(address _owner, address _mainAuthorizer) Ownable(_owner) {
        mainAuthorizer = _mainAuthorizer;
    }

    function isDKIMPublicKeyHashValid(
        string memory domainName,
        bytes32 publicKeyHash
    ) public view returns (bool) {
        return isDKIMPublicKeyHashValid(domainName, publicKeyHash, msg.sender);
    }

    function isDKIMPublicKeyHashValid(
        string memory domainName,
        bytes32 publicKeyHash,
        address user
    ) public view returns (bool) {
        require(bytes(domainName).length > 0, "domain name cannot be zero");
        require(publicKeyHash != bytes32(0), "public key hash cannot be zero");
        require(user != address(0), "user address cannot be zero");
        uint256 revokeThreshold = _computeRevokeThreshold(publicKeyHash, user);
        uint256 setThreshold = _computeSetThreshold(
            domainName,
            publicKeyHash,
            user
        );
        if (revokeThreshold >= 1) {
            return false;
        } else if (setThreshold < 2) {
            return false;
        } else {
            return true;
        }
    }

    // /**
    //  * @notice Sets the DKIM public key hash for a given domain.
    //  * @dev This function allows the owner to set a DKIM public key hash for all users, or an individual user to set it for themselves.
    //  * @param domainName The domain name for which the DKIM public key hash is being set.
    //  * @param publicKeyHash The hash of the DKIM public key to be set.
    //  * @param individual A boolean indicating whether the hash is being set for an individual user (true) or for all users (false).
    //  * @custom:require Only the owner can set the DKIM public key hash for all users when `individual` is false.
    //  * @custom:require The public key hash must not be revoked.
    //  * @custom:event DKIMPublicKeyHashRegistered Emitted when a DKIM public key hash is successfully set.
    //  */
    function setDKIMPublicKeyHash(
        string memory domainName,
        bytes32 publicKeyHash,
        address authorizer,
        bytes memory signature
    ) public {
        require(bytes(domainName).length > 0, "domain name cannot be zero");
        require(publicKeyHash != bytes32(0), "public key hash cannot be zero");
        require(authorizer != address(0), "authorizer address cannot be zero");
        require(
            revokedDKIMPublicKeyHashes[publicKeyHash][authorizer] == false,
            "public key hash is already revoked"
        );
        if (msg.sender != authorizer) {
            string memory signedMsg = computeSignedMsg(
                SET_PREFIX,
                domainName,
                publicKeyHash
            );
            bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
                bytes(signedMsg)
            );
            if (authorizer.code.length > 0) {
                require(
                    IERC1271(authorizer).isValidSignature(digest, signature) ==
                        0x1626ba7e,
                    "invalid eip1271 signature"
                );
            } else {
                address recoveredSigner = digest.recover(signature);
                require(
                    recoveredSigner == authorizer,
                    "invalid ecdsa signature"
                );
            }
        }

        dkimPublicKeyHashes[domainName][publicKeyHash][authorizer] = true;

        emit DKIMPublicKeyHashRegistered(domainName, publicKeyHash, authorizer);
    }

    function setDKIMPublicKeyHashes(
        string[] memory domainNames,
        bytes32[] memory publicKeyHashes,
        address[] memory authorizers,
        bytes[] memory signatures
    ) public {
        require(
            domainNames.length == publicKeyHashes.length,
            "invalid publicKeyHashes length"
        );
        require(
            domainNames.length == authorizers.length,
            "invalid authorizers length"
        );
        require(
            domainNames.length == signatures.length,
            "invalid signatures length"
        );
        for (uint256 i = 0; i < domainNames.length; i++) {
            setDKIMPublicKeyHash(
                domainNames[i],
                publicKeyHashes[i],
                authorizers[i],
                signatures[i]
            );
        }
    }

    // /**
    //  * @notice Revokes a DKIM public key hash.
    //  * @dev This function allows the owner to revoke a DKIM public key hash for all users, or an individual user to revoke it for themselves.
    //  * @param publicKeyHash The hash of the DKIM public key to be revoked.
    //  * @param individual A boolean indicating whether the hash is being revoked for an individual user (true) or for all users (false).
    //  * @custom:require Only the owner can revoke the DKIM public key hash for all users when `individual` is false.
    //  * @custom:event DKIMPublicKeyHashRevoked Emitted when a DKIM public key hash is successfully revoked.
    //  */
    function revokeDKIMPublicKeyHash(
        string memory domainName,
        bytes32 publicKeyHash,
        address authorizer,
        bytes memory signature
    ) public {
        require(bytes(domainName).length > 0, "domain name cannot be zero");
        require(publicKeyHash != bytes32(0), "public key hash cannot be zero");
        require(authorizer != address(0), "authorizer address cannot be zero");
        require(
            revokedDKIMPublicKeyHashes[publicKeyHash][authorizer] == false,
            "public key hash is already revoked"
        );
        if (msg.sender != authorizer) {
            string memory signedMsg = computeSignedMsg(
                REVOKE_PREFIX,
                domainName,
                publicKeyHash
            );
            bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
                bytes(signedMsg)
            );
            if (authorizer.code.length > 0) {
                require(
                    IERC1271(authorizer).isValidSignature(digest, signature) ==
                        0x1626ba7e,
                    "invalid eip1271 signature"
                );
            } else {
                address recoveredSigner = digest.recover(signature);
                require(
                    recoveredSigner == authorizer,
                    "invalid ecdsa signature"
                );
            }
        }
        revokedDKIMPublicKeyHashes[publicKeyHash][authorizer] = true;

        emit DKIMPublicKeyHashRevoked(publicKeyHash, authorizer);
    }

    // / @notice Computes a signed message string for setting or revoking a DKIM public key hash.
    // / @param prefix The operation prefix (SET: or REVOKE:).
    // / @param selector The selector associated with the DKIM public key.
    // / @param domainName The domain name related to the operation.
    // / @param publicKeyHash The DKIM public key hash involved in the operation.
    // / @return string The computed signed message.
    // / @dev This function is used internally to generate the message that needs to be signed for setting or revoking a public key hash.
    function computeSignedMsg(
        string memory prefix,
        string memory domainName,
        bytes32 publicKeyHash
    ) public pure returns (string memory) {
        return
            string.concat(
                prefix,
                ";domain=",
                domainName,
                ";public_key_hash=",
                uint256(publicKeyHash).toHexString(),
                ";"
            );
    }

    function _computeSetThreshold(
        string memory domainName,
        bytes32 publicKeyHash,
        address user
    ) private view returns (uint256) {
        uint256 threshold = 0;
        if (
            dkimPublicKeyHashes[domainName][publicKeyHash][mainAuthorizer] ==
            true
        ) {
            threshold += 1;
        }
        if (dkimPublicKeyHashes[domainName][publicKeyHash][user] == true) {
            threshold += 2;
        }
        return threshold;
    }

    function _computeRevokeThreshold(
        bytes32 publicKeyHash,
        address user
    ) private view returns (uint256) {
        uint256 threshold = 0;
        if (revokedDKIMPublicKeyHashes[publicKeyHash][mainAuthorizer] == true) {
            threshold += 1;
        }
        if (revokedDKIMPublicKeyHashes[publicKeyHash][user] == true) {
            threshold += 2;
        }
        return threshold;
    }

    function _stringEq(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}
