// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../ECDSAOwnedDKIMRegistry.sol";

contract ECDSAOwnedDKIMRegistryTest_revokeDKIMPublicKeyHash is Test {
    ECDSAOwnedDKIMRegistry dkim;

    using console for *;
    using ECDSA for *;
    using Strings for *;

    string public selector = "12345";
    string public domainName = "example.com";
    // uint public signValidityDuration = 1 days;
    bytes32 public publicKeyHash = bytes32(uint256(1));

    function setUp() public {
        address signer = vm.addr(1);
        {
            dkim = new ECDSAOwnedDKIMRegistry(signer);
        }
    }

    function test_Revert_IfPublicKeyHashNotSet() public {
        // Attempt to revoke a public key hash that hasn't been set
        string memory revokeMsg = dkim.computeSignedMsg(dkim.REVOKE_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(revokeMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("publicKeyHash is not set");
        dkim.revokeDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);
    }

    function test_Revert_IfSignerIsIncorrect() public {
        // Set a valid public key hash first
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);

        // Attempt to revoke with a signature from a different signer
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(2, digest); // Different signer
        bytes memory invalidSignature = abi.encodePacked(r1, s1, v1);

        vm.expectRevert("Invalid signature");
        dkim.revokeDKIMPublicKeyHash(selector, domainName, publicKeyHash, invalidSignature);
    }

    // Test invalid domain name
    function test_Revert_IfDomainNameIsInvalid() public {
        // Set a valid public key hash first
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);

        // Attempt to revoke with an invalid domain name
        string memory invalidDomainName = "";
        string memory revokeMsg = dkim.computeSignedMsg(dkim.REVOKE_PREFIX(), invalidDomainName, publicKeyHash);
        bytes32 revokeDigest = MessageHashUtils.toEthSignedMessageHash(bytes(revokeMsg));
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(1, revokeDigest);
        bytes memory revokeSig = abi.encodePacked(r1, s1, v1);

        vm.expectRevert("Invalid domain name");
        dkim.revokeDKIMPublicKeyHash(selector, invalidDomainName, publicKeyHash, revokeSig);
    }
    // Test invalid public key hash

    function test_Revert_IfPublicKeyHashIsInvalid() public {
        // Set a valid public key hash first
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);

        // Attempt to revoke with an invalid public key hash
        bytes32 invalidPublicKeyHash = bytes32(0);
        string memory revokeMsg = dkim.computeSignedMsg(dkim.REVOKE_PREFIX(), domainName, invalidPublicKeyHash);
        bytes32 revokeDigest = MessageHashUtils.toEthSignedMessageHash(bytes(revokeMsg));
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(1, revokeDigest);
        bytes memory revokeSig = abi.encodePacked(r1, s1, v1);

        vm.expectRevert("Invalid public key hash");
        dkim.revokeDKIMPublicKeyHash(selector, domainName, invalidPublicKeyHash, revokeSig);
    }
    // Test if publicKeyHash is already revoked

    function test_Revert_IfPublicKeyHashIsAlreadyRevoked() public {
        // Set a valid public key hash first
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);

        // Revoke the public key hash
        string memory revokeMsg = dkim.computeSignedMsg(dkim.REVOKE_PREFIX(), domainName, publicKeyHash);
        bytes32 revokeDigest = MessageHashUtils.toEthSignedMessageHash(bytes(revokeMsg));
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(1, revokeDigest);
        bytes memory revokeSig = abi.encodePacked(r1, s1, v1);
        dkim.revokeDKIMPublicKeyHash(selector, domainName, publicKeyHash, revokeSig);

        // Mock the call to dkimRegistry.isDKIMPublicKeyHashValid to return true
        vm.mockCall(
            address(dkim.dkimRegistry()),
            abi.encodeWithSelector(IDKIMRegistry.isKeyHashValid.selector),
            abi.encode(true)
        );
        // Attempt to revoke the already revoked public key hash
        vm.expectRevert("publicKeyHash is already revoked");
        dkim.revokeDKIMPublicKeyHash(selector, domainName, publicKeyHash, revokeSig);
    }

    function test_Revert_IfSignatureIsInvalid() public {
        // Set a valid public key hash first
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);

        // Attempt to revoke with an invalid signature
        bytes memory invalidSignature = abi.encodePacked(r, s, v + 1); // Alter the signature
        vm.expectRevert("Invalid signature");
        dkim.revokeDKIMPublicKeyHash(selector, domainName, publicKeyHash, invalidSignature);
    }

    function test_Revert_IfDomainNameIsDifferent() public {
        // Set a valid public key hash first
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);

        // Attempt to revoke with a different domain name
        string memory differentDomainName = "different.com";
        string memory revokeMsg = dkim.computeSignedMsg(dkim.REVOKE_PREFIX(), differentDomainName, publicKeyHash);
        bytes32 revokeDigest = MessageHashUtils.toEthSignedMessageHash(bytes(revokeMsg));
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(1, revokeDigest);
        bytes memory revokeSig = abi.encodePacked(r1, s1, v1);

        vm.expectRevert("publicKeyHash is not set");
        dkim.revokeDKIMPublicKeyHash(selector, differentDomainName, publicKeyHash, revokeSig);
    }

    function test_RevokeDKIMPublicKeyHash() public {
        // vm.chainId(1);
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);

        // Revoke
        string memory revokeMsg = dkim.computeSignedMsg(dkim.REVOKE_PREFIX(), domainName, publicKeyHash);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(1, MessageHashUtils.toEthSignedMessageHash(bytes(revokeMsg)));
        bytes memory revokeSig = abi.encodePacked(r1, s1, v1);
        dkim.revokeDKIMPublicKeyHash(selector, domainName, publicKeyHash, revokeSig);

        require(!dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash));
    }
}
