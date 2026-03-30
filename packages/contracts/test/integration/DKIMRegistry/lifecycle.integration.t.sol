// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import { DKIMRegistry } from "../../../src/DKIMRegistry.sol";
import { IDKIMRegistry } from "../../../src/interfaces/IERC7969.sol";

contract DKIMRegistryLifecycleIntegrationTest is Test {
    DKIMRegistry internal registry;

    address internal owner = vm.addr(1);
    address internal attacker = vm.addr(2);

    bytes32 internal domainHash = keccak256(bytes("example.com"));
    bytes32 internal oldKeyHash = keccak256(bytes("old-key-hash"));
    bytes32 internal newKeyHash = keccak256(bytes("new-key-hash"));

    function setUp() public {
        registry = new DKIMRegistry(owner);
    }

    function test_Integration_LifecycleRegistrationRotationRevocation() public {
        vm.startPrank(owner);

        vm.expectEmit();
        emit IDKIMRegistry.KeyHashRegistered(domainHash, oldKeyHash);
        registry.setDKIMPublicKeyHash(domainHash, oldKeyHash);
        assertTrue(registry.isKeyHashValid(domainHash, oldKeyHash));

        vm.expectEmit();
        emit IDKIMRegistry.KeyHashRegistered(domainHash, newKeyHash);
        registry.setDKIMPublicKeyHash(domainHash, newKeyHash);
        assertTrue(registry.isKeyHashValid(domainHash, newKeyHash));

        vm.expectEmit();
        emit IDKIMRegistry.KeyHashRevoked(oldKeyHash);
        registry.revokeDKIMPublicKeyHash(oldKeyHash);

        vm.stopPrank();

        assertFalse(registry.isKeyHashValid(domainHash, oldKeyHash));
        assertTrue(registry.isKeyHashValid(domainHash, newKeyHash));
    }

    function test_Integration_AuthorizationBoundary() public {
        vm.prank(attacker);
        vm.expectRevert();
        registry.setDKIMPublicKeyHash(domainHash, oldKeyHash);

        vm.prank(attacker);
        vm.expectRevert();
        registry.revokeDKIMPublicKeyHash(oldKeyHash);
    }
}
