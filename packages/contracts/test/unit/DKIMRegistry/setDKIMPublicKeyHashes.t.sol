// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import { DKIMRegistry } from "../../src/DKIMRegistry.sol";

contract DKIMRegistryTest_setDKIMPublicKeyHashes is Test {
    DKIMRegistry internal registry;

    address internal owner = vm.addr(1);
    address internal nonOwner = vm.addr(2);

    bytes32 internal domainHash = keccak256(bytes("example.com"));
    bytes32 internal oldKeyHash = keccak256(bytes("old-key"));
    bytes32 internal newKeyHash = keccak256(bytes("new-key"));

    function setUp() public {
        registry = new DKIMRegistry(owner);
    }

    function test_BatchRegistersMultipleKeys() public {
        bytes32[] memory keyHashes = new bytes32[](2);
        keyHashes[0] = oldKeyHash;
        keyHashes[1] = newKeyHash;

        vm.prank(owner);
        registry.setDKIMPublicKeyHashes(domainHash, keyHashes);

        assertTrue(registry.isKeyHashValid(domainHash, oldKeyHash));
        assertTrue(registry.isKeyHashValid(domainHash, newKeyHash));
    }

    function test_RevertIfCalledByNonOwner() public {
        bytes32[] memory keyHashes = new bytes32[](1);
        keyHashes[0] = oldKeyHash;

        vm.prank(nonOwner);
        vm.expectRevert();
        registry.setDKIMPublicKeyHashes(domainHash, keyHashes);
    }
}
