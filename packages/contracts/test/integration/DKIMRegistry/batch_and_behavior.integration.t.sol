// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import { DKIMRegistry } from "../../../src/DKIMRegistry.sol";

contract DKIMRegistryBatchAndBehaviorIntegrationTest is Test {
    DKIMRegistry internal registry;

    address internal owner = vm.addr(1);
    bytes32 internal domainHash = keccak256(bytes("example.com"));
    bytes32 internal anotherDomainHash = keccak256(bytes("another.com"));
    bytes32 internal sharedKeyHash = keccak256(bytes("shared-key"));
    bytes32 internal keyA = keccak256(bytes("key-a"));
    bytes32 internal keyB = keccak256(bytes("key-b"));

    function setUp() public {
        registry = new DKIMRegistry(owner);
    }

    function test_Integration_BatchRegistrationAndValidation() public {
        bytes32[] memory keys = new bytes32[](2);
        keys[0] = keyA;
        keys[1] = keyB;

        vm.prank(owner);
        registry.setDKIMPublicKeyHashes(domainHash, keys);

        assertTrue(registry.isKeyHashValid(domainHash, keyA));
        assertTrue(registry.isKeyHashValid(domainHash, keyB));
    }

    function test_Integration_RevocationIsScopedToDomainAcrossDomains() public {
        vm.startPrank(owner);
        registry.setDKIMPublicKeyHash(domainHash, sharedKeyHash);
        registry.setDKIMPublicKeyHash(anotherDomainHash, sharedKeyHash);
        assertTrue(registry.isKeyHashValid(domainHash, sharedKeyHash));
        assertTrue(registry.isKeyHashValid(anotherDomainHash, sharedKeyHash));

        registry.revokeDKIMPublicKeyHash(domainHash, sharedKeyHash);
        vm.stopPrank();

        assertFalse(registry.isKeyHashValid(domainHash, sharedKeyHash));
        assertTrue(registry.isKeyHashValid(anotherDomainHash, sharedKeyHash));
    }
}
