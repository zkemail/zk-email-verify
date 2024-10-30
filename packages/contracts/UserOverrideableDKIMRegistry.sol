// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IDKIMRegistry.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
  A Registry that store the hash(dkim_public_key) for each domain and each user.
  This functions similarly to [DKIMRegistry](./DKIMRegistry.sol), but it allows users to set their own public keys. 
  Even if the main authorizer, who is the contract owner, has already approved a public key, the user's signature is still required for setting it until the predetermined delay time (`setTimestampDelay`) has passed. 
  Additionally, the public key can be revoked by the signature of either the user or the main authorizer alone.
 */
contract UserOverrideableDKIMRegistry is
    IDKIMRegistry,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using Strings for *;
    using ECDSA for *;

    /// @notice Emitted when a DKIM public key hash is successfully set.
    event DKIMPublicKeyHashRegistered(
        string indexed domainName,
        bytes32 indexed publicKeyHash,
        address indexed authorizer
    );

    /// @notice Emitted when a DKIM public key hash is successfully revoked.
    event DKIMPublicKeyHashRevoked(
        bytes32 indexed publicKeyHash,
        address indexed authorizer
    );

    /// @notice Emitted when a DKIM public key hash is successfully reactivated.
    event DKIMPublicKeyHashReactivated(
        bytes32 indexed publicKeyHash,
        address indexed authorizer
    );

    /// @notice Emitted when the main authorizer address is changed.
    event MainAuthorizerChanged(address indexed newMainAuthorizer);

    /// @notice Main authorizer address.
    address public mainAuthorizer;

    /// @notice Time delay until a DKIM public key hash set by the main authorizer is enabled
    uint public setTimestampDelay;

    /// @notice DKIM public key hashes that are set
    mapping(string => mapping(bytes32 => mapping(address => bool)))
        public dkimPublicKeyHashes;

    /// @notice DKIM public key hashes that are revoked (eg: in case of private key compromise)
    mapping(bytes32 => mapping(address => bool))
        public revokedDKIMPublicKeyHashes;

    /// @notice DKIM public key hashes that are reactivated (eg: in case that a malicious `mainAuthorizer` revokes a valid public key but a user reactivates it.)
    mapping(bytes32 => mapping(address => bool))
        public reactivatedDKIMPublicKeyHashes;

    /// @notice The timestamp from which the set DKIM public key hash is enabled
    mapping(bytes32 => uint) public enabledTimeOfDKIMPublicKeyHash;

    string public constant SET_PREFIX = "SET:";
    string public constant REVOKE_PREFIX = "REVOKE:";
    string public constant REACTIVATE_PREFIX = "REACTIVATE:";

    constructor() {}

    /// @notice Initializes the contract with a predefined signer and deploys a new DKIMRegistry.
    /// @param _initialOwner The address of the initial owner of the contract.
    /// @param _mainAuthorizer The address of the main authorizer.
    /// @param _setTimestampDelay The time delay until a DKIM public key hash set by the main authorizer is enabled.
    function initialize(
        address _initialOwner,
        address _mainAuthorizer,
        uint _setTimestampDelay
    ) public initializer {
        __Ownable_init(_initialOwner);
        mainAuthorizer = _mainAuthorizer;
        setTimestampDelay = _setTimestampDelay;
    }

    /// @notice Checks if a DKIM public key hash is valid for a given domain.
    /// @param domainName The domain name for which the DKIM public key hash is being checked.
    /// @param publicKeyHash The hash of the DKIM public key to be checked.
    /// @return bool True if the DKIM public key hash is valid, false otherwise.
    /// @dev This function returns true if the owner of the given `msg.sender` approves the public key hash before `enabledTimeOfDKIMPublicKeyHash` and neither `mainAuthorizer` nor the owner of `msg.sender` revokes the public key hash. However, after `enabledTimeOfDKIMPublicKeyHash`, only one of their approvals is required. In addition, if the public key hash is reactivated by the owner of `msg.sender`, the public key hash revoked only by `mainAuthorizer` is considered valid.
    function isDKIMPublicKeyHashValid(
        string memory domainName,
        bytes32 publicKeyHash
    ) public view returns (bool) {
        address ownerOfSender = Ownable(msg.sender).owner();
        return
            isDKIMPublicKeyHashValid(domainName, publicKeyHash, ownerOfSender);
    }

    /// @notice Checks if a DKIM public key hash is valid for a given domain.
    /// @param domainName The domain name for which the DKIM public key hash is being checked.
    /// @param publicKeyHash The hash of the DKIM public key to be checked.
    /// @param authorizer The address of the expected authorizer
    /// @return bool True if the DKIM public key hash is valid, false otherwise.
    /// @dev This function returns true if 1) at least the given `authorizer` approves the public key hash before `enabledTimeOfDKIMPublicKeyHash` and 2) neither `mainAuthorizer` nor `authorizer` revokes the public key hash. However, after `enabledTimeOfDKIMPublicKeyHash`, only one of their approvals is required. In addition, if the public key hash is reactivated by the `authorizer`, the public key hash revoked only by `mainAuthorizer` is considered valid.
    /// @dev The domain name, public key hash, and authorizer address must not be zero.
    /// @dev The authorizer address cannot be the mainAuthorizer.
    function isDKIMPublicKeyHashValid(
        string memory domainName,
        bytes32 publicKeyHash,
        address authorizer
    ) public view returns (bool) {
        require(bytes(domainName).length > 0, "domain name cannot be zero");
        require(publicKeyHash != bytes32(0), "public key hash cannot be zero");
        require(authorizer != address(0), "authorizer address cannot be zero");
        require(
            authorizer != mainAuthorizer,
            "authorizer cannot be mainAuthorizer"
        );
        uint256 revokeThreshold = _computeRevokeThreshold(
            publicKeyHash,
            authorizer
        );
        uint256 setThreshold = _computeSetThreshold(
            domainName,
            publicKeyHash,
            authorizer
        );
        if (revokeThreshold >= 1) {
            return false;
        } else if (setThreshold < 2) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * @notice Sets the DKIM public key hash for a given domain with authorization.
     * @dev This function allows an authorized user or a contract to set a DKIM public key hash. It uses EIP-1271 or ECDSA for signature verification.
     * @param domainName The domain name for which the DKIM public key hash is being set.
     * @param publicKeyHash The hash of the DKIM public key to be set.
     * @param authorizer The address of the authorizer who can set the DKIM public key hash.
     * @param signature The signature proving the authorization to set the DKIM public key hash.
     * @custom:require The domain name, public key hash, and authorizer address must not be zero.
     * @custom:require The public key hash must not be revoked.
     * @custom:require The signature must be valid according to EIP-1271 if the authorizer is a contract, or ECDSA if the authorizer is an EOA.
     * @custom:event DKIMPublicKeyHashRegistered Emitted when a DKIM public key hash is successfully set.
     */
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
            dkimPublicKeyHashes[domainName][publicKeyHash][authorizer] == false,
            "public key hash is already set"
        );
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
        if (authorizer == mainAuthorizer) {
            enabledTimeOfDKIMPublicKeyHash[publicKeyHash] =
                block.timestamp +
                setTimestampDelay;
        }

        emit DKIMPublicKeyHashRegistered(domainName, publicKeyHash, authorizer);
    }

    /**
     * @dev Sets the DKIM public key hashes in batch.
     * @param domainNames An array of the domain name for which the DKIM public key hash is being set.
     * @param publicKeyHashes An array of the hash of the DKIM public key to be set.
     * @param authorizers An array of the address of the authorizer who can set the DKIM public key hash.
     * @param signatures An array of the signature proving the authorization to set the DKIM public key hash.
     * @custom:require The domain name, public key hash, and authorizer address must not be zero.
     * @custom:require The public key hash must not be revoked.
     * @custom:require The signature must be valid according to EIP-1271 if the authorizer is a contract, or ECDSA if the authorizer is an EOA.
     * @custom:event DKIMPublicKeyHashRegistered Emitted when a DKIM public key hash is successfully set.
     */
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

    /**
     * @notice Revokes a DKIM public key hash.
     * @dev This function allows the owner to revoke a DKIM public key hash for all users, or an individual user to revoke it for themselves.
     * @param domainName The domain name associated with the DKIM public key hash.
     * @param publicKeyHash The hash of the DKIM public key to be revoked.
     * @param authorizer The address of the authorizer who can revoke the DKIM public key hash.
     * @param signature The signature proving the authorization to revoke the DKIM public key hash.
     * @custom:require The domain name, public key hash, and authorizer address must not be zero.
     * @custom:require The public key hash must not already be revoked.
     * @custom:require The signature must be valid according to EIP-1271 if the authorizer is a contract, or ECDSA if the authorizer is an EOA.
     * @custom:event DKIMPublicKeyHashRevoked Emitted when a DKIM public key hash is successfully revoked.
     */
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

    /**
     * @notice Reactivates a DKIM public key hash.
     * @dev This function allows an authorized user or a contract to reactivate a DKIM public key hash that was revoked by the main authorizer.
     * @param domainName The domain name associated with the DKIM public key hash.
     * @param publicKeyHash The hash of the DKIM public key to be reactivated.
     * @param authorizer The address of the authorizer who can reactivate the DKIM public key hash.
     * @param signature The signature proving the authorization to reactivate the DKIM public key hash.
     * @custom:require The domain name, public key hash, and authorizer address must not be zero.
     * @custom:require The public key hash must be revoked by the main authorizer.
     * @custom:require The signature must be valid according to EIP-1271 if the authorizer is a contract, or ECDSA if the authorizer is an EOA.
     * @custom:event DKIMPublicKeyHashReactivated Emitted when a DKIM public key hash is successfully reactivated.
     */
    function reactivateDKIMPublicKeyHash(
        string memory domainName,
        bytes32 publicKeyHash,
        address authorizer,
        bytes memory signature
    ) public {
        require(bytes(domainName).length > 0, "domain name cannot be zero");
        require(publicKeyHash != bytes32(0), "public key hash cannot be zero");
        require(authorizer != address(0), "authorizer address cannot be zero");
        require(
            authorizer != mainAuthorizer,
            "mainAuthorizer cannot reactivate the public key hash"
        );
        require(
            reactivatedDKIMPublicKeyHashes[publicKeyHash][authorizer] == false,
            "public key hash is already reactivated"
        );
        require(
            _computeRevokeThreshold(publicKeyHash, authorizer) == 1,
            "revoke threshold must be one"
        );
        require(
            _computeSetThreshold(domainName, publicKeyHash, authorizer) >= 2,
            "set threshold must be larger than two"
        );
        if (msg.sender != authorizer) {
            string memory signedMsg = computeSignedMsg(
                REACTIVATE_PREFIX,
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
        reactivatedDKIMPublicKeyHashes[publicKeyHash][authorizer] = true;

        emit DKIMPublicKeyHashReactivated(publicKeyHash, authorizer);
    }

    /**
     * @notice Changes the main authorizer address.
     * @param newMainAuthorizer The address of the new main authorizer.
     * @custom:require Only the owner can change the main authorizer address.
     * @custom:require The new main authorizer address cannot be zero.
     * @custom:require The new main authorizer address cannot be the same as the current main authorizer.
     * @custom:event MainAuthorizerChanged Emitted when the main authorizer address changes.
     */
    function changeMainAuthorizer(address newMainAuthorizer) public onlyOwner {
        require(
            newMainAuthorizer != address(0),
            "newMainAuthorizer address cannot be zero"
        );
        require(
            newMainAuthorizer != mainAuthorizer,
            "newMainAuthorizer address cannot be the same as the current mainAuthorizer"
        );
        mainAuthorizer = newMainAuthorizer;
        emit MainAuthorizerChanged(newMainAuthorizer);
    }

    /**
     * @notice Computes a signed message string for setting or revoking a DKIM public key hash.
     * @param prefix The operation prefix (SET: or REVOKE:).
     * @param domainName The domain name related to the operation.
     * @param publicKeyHash The DKIM public key hash involved in the operation.
     * @return string The computed signed message.
     * @dev This function is used internally to generate the message that needs to be signed for setting or revoking a public key hash.
     */
    function computeSignedMsg(
        string memory prefix,
        string memory domainName,
        bytes32 publicKeyHash
    ) public pure returns (string memory) {
        return
            string.concat(
                prefix,
                "domain=",
                domainName,
                ";public_key_hash=",
                uint256(publicKeyHash).toHexString(),
                ";"
            );
    }

    function _computeSetThreshold(
        string memory domainName,
        bytes32 publicKeyHash,
        address authorizer
    ) private view returns (uint256) {
        uint256 threshold = 0;
        if (
            dkimPublicKeyHashes[domainName][publicKeyHash][mainAuthorizer] ==
            true
        ) {
            if (
                block.timestamp < enabledTimeOfDKIMPublicKeyHash[publicKeyHash]
            ) {
                threshold += 1;
            } else {
                threshold += 2;
            }
        }
        if (
            dkimPublicKeyHashes[domainName][publicKeyHash][authorizer] == true
        ) {
            threshold += 2;
        }
        return threshold;
    }

    function _computeRevokeThreshold(
        bytes32 publicKeyHash,
        address authorizer
    ) private view returns (uint256) {
        uint256 threshold = 0;
        if (revokedDKIMPublicKeyHashes[publicKeyHash][mainAuthorizer] == true) {
            threshold += 1;
        }
        if (revokedDKIMPublicKeyHashes[publicKeyHash][authorizer] == true) {
            threshold += 2;
        }
        if (
            threshold == 1 &&
            reactivatedDKIMPublicKeyHashes[publicKeyHash][authorizer] == true
        ) {
            threshold -= 1;
        }
        return threshold;
    }

    function _stringEq(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /// @notice Upgrade the implementation of the proxy.
    /// @param newImplementation Address of the new implementation.
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
