// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import { DKIMRegistry } from "../../../src/DKIMRegistry.sol";

contract DKIMRegistryTest_revokeDKIMPublicKeyHash is Test {
    DKIMRegistry internal registry;

    address internal owner = vm.addr(1);
    address internal nonOwner = vm.addr(2);

    bytes32 internal domainHash = keccak256(bytes("example.com"));
    bytes32 internal anotherDomainHash = keccak256(bytes("another.com"));
    bytes32 internal keyHash = keccak256(bytes("old-key"));
    bytes32 internal replacementKeyHash = keccak256(bytes("new-key"));

    function setUp() public {
        registry = new DKIMRegistry(owner);
    }

    function test_RevokesAndInvalidatesKey() public {
        vm.startPrank(owner);
        registry.setDKIMPublicKeyHash(domainHash, keyHash);
        registry.revokeDKIMPublicKeyHash(domainHash, keyHash);
        vm.stopPrank();

        assertFalse(registry.isKeyHashValid(domainHash, keyHash));
    }

    function test_RevocationIsScopedToDomain() public {
        vm.startPrank(owner);
        registry.setDKIMPublicKeyHash(domainHash, keyHash);
        registry.setDKIMPublicKeyHash(anotherDomainHash, keyHash);
        registry.revokeDKIMPublicKeyHash(domainHash, keyHash);
        vm.stopPrank();

        assertFalse(registry.isKeyHashValid(domainHash, keyHash));
        assertTrue(registry.isKeyHashValid(anotherDomainHash, keyHash));
    }

    function test_RotationOldKeyRevokedNewKeyValid() public {
        vm.startPrank(owner);
        registry.setDKIMPublicKeyHash(domainHash, keyHash);
        registry.setDKIMPublicKeyHash(domainHash, replacementKeyHash);
        registry.revokeDKIMPublicKeyHash(domainHash, keyHash);
        vm.stopPrank();

        assertFalse(registry.isKeyHashValid(domainHash, keyHash));
        assertTrue(registry.isKeyHashValid(domainHash, replacementKeyHash));
    }

    function test_RevertIfCalledByNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        registry.revokeDKIMPublicKeyHash(domainHash, keyHash);
    }
}
