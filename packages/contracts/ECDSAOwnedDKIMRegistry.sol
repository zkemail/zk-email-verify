// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/IERC7969.sol";
import "./DKIMRegistry.sol";

/// @title ECDSA Owned DKIM Registry
/// @notice This contract allows for the management of DKIM public key hashes through an ECDSA-signed mechanism. It enables the setting and revoking of DKIM public key hashes for domain names, ensuring that only the authorized signer can perform these operations. The contract leverages an underlying DKIMRegistry contract for the actual storage and validation of public key hashes.
/// @dev The contract uses OpenZeppelin's ECDSA library for signature recovery and the DKIMRegistry for storing the DKIM public key hashes.
contract ECDSAOwnedDKIMRegistry is IDKIMRegistry {
    using Strings for uint256;
    using ECDSA for bytes32;

    DKIMRegistry public dkimRegistry;
    address public signer;

    string public constant SET_PREFIX = "SET:";
    string public constant REVOKE_PREFIX = "REVOKE:";

    /// @notice Initializes the contract with a predefined signer and deploys a new DKIMRegistry.
    /// @param _signer The address of the authorized signer who can set or revoke DKIM public key hashes.
    constructor(address _signer) {
        // this contract owns the DKIMRegistry and allows signer to set/revoke public key hashes
        dkimRegistry = new DKIMRegistry(address(this));
        signer = _signer;
    }

    /// @notice Checks if a DKIM public key hash is valid for a given domain name.
    /// @param domainHash The keccak256 hash of the lowercase domain name.
    /// @param keyHash The keccak256 hash of the DKIM public key.
    /// @return bool Returns true if the public key hash is valid, false otherwise.
    function isKeyHashValid(bytes32 domainHash, bytes32 keyHash) public view returns (bool) {
        return dkimRegistry.isKeyHashValid(domainHash, keyHash);
    }

    /// @notice Sets a DKIM public key hash for a domain name after validating the provided signature.
    /// @param selector The selector associated with the DKIM public key.
    /// @param domainName The domain name to set the DKIM public key hash for.
    /// @param publicKeyHash The DKIM public key hash to set.
    /// @param signature The ECDSA signature proving the operation is authorized by the signer.
    /// @dev This function requires that the public key hash is not already set or revoked.
    function setDKIMPublicKeyHash(
        string memory selector,
        string memory domainName,
        bytes32 publicKeyHash,
        bytes memory signature
    ) public {
        bytes32 domainHash = keccak256(bytes(domainName));
        require(bytes(selector).length != 0, "Invalid selector");
        require(bytes(domainName).length != 0, "Invalid domain name");
        require(publicKeyHash != bytes32(0), "Invalid public key hash");
        require(!isKeyHashValid(domainHash, publicKeyHash), "publicKeyHash is already set");
        require(!dkimRegistry.revokedDKIMPublicKeyHashes(publicKeyHash), "publicKeyHash is revoked");

        string memory signedMsg = computeSignedMsg(SET_PREFIX, domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == signer, "Invalid signature");

        dkimRegistry.setDKIMPublicKeyHash(domainHash, publicKeyHash);
    }

    /// @notice Revokes a DKIM public key hash for a domain name after validating the provided signature.
    /// @param selector The selector associated with the DKIM public key.
    /// @param domainName The domain name to revoke the DKIM public key hash for.
    /// @param publicKeyHash The DKIM public key hash to revoke.
    /// @param signature The ECDSA signature proving the operation is authorized by the signer.
    /// @dev This function requires that the public key hash is currently set and not already revoked.
    function revokeDKIMPublicKeyHash(
        string memory selector,
        string memory domainName,
        bytes32 publicKeyHash,
        bytes memory signature
    ) public {
        bytes32 domainHash = keccak256(bytes(domainName));
        require(bytes(selector).length != 0, "Invalid selector");
        require(bytes(domainName).length != 0, "Invalid domain name");
        require(publicKeyHash != bytes32(0), "Invalid public key hash");
        require(isKeyHashValid(domainHash, publicKeyHash), "publicKeyHash is not set");
        require(!dkimRegistry.revokedDKIMPublicKeyHashes(publicKeyHash), "publicKeyHash is already revoked");

        string memory signedMsg = computeSignedMsg(REVOKE_PREFIX, domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == signer, "Invalid signature");

        dkimRegistry.revokeDKIMPublicKeyHash(publicKeyHash);
    }

    /// @notice Computes a signed message string for setting or revoking a DKIM public key hash.
    /// @param prefix The operation prefix (SET: or REVOKE:).
    /// @param domainName The domain name related to the operation.
    /// @param publicKeyHash The DKIM public key hash involved in the operation.
    /// @return string The computed signed message.
    /// @dev This function is used internally to generate the message that needs to be signed for setting or revoking a public key hash.
    function computeSignedMsg(string memory prefix, string memory domainName, bytes32 publicKeyHash)
        public
        pure
        returns (string memory)
    {
        return
            string.concat(prefix, "domain=", domainName, ";public_key_hash=", uint256(publicKeyHash).toHexString(), ";");
    }
}
