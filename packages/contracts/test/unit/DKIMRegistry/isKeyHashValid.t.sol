// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import { DKIMRegistry } from "../../src/DKIMRegistry.sol";

contract DKIMRegistryTest_isKeyHashValid is Test {
    DKIMRegistry internal registry;
    address internal owner = vm.addr(1);

    bytes32 internal domainHash = keccak256(bytes("example.com"));
    bytes32 internal keyHash = keccak256(bytes("key-hash"));

    function setUp() public {
        registry = new DKIMRegistry(owner);
    }

    function test_ReturnsTrueForRegisteredAndNotRevokedKey() public {
        vm.prank(owner);
        registry.setDKIMPublicKeyHash(domainHash, keyHash);

        assertTrue(registry.isKeyHashValid(domainHash, keyHash));
    }

    function test_ReturnsFalseForUnregisteredKey() public view {
        assertFalse(registry.isKeyHashValid(domainHash, keyHash));
    }

    function test_ReturnsFalseForRevokedKey() public {
        vm.startPrank(owner);
        registry.setDKIMPublicKeyHash(domainHash, keyHash);
        registry.revokeDKIMPublicKeyHash(keyHash);
        vm.stopPrank();

        assertFalse(registry.isKeyHashValid(domainHash, keyHash));
    }
}
