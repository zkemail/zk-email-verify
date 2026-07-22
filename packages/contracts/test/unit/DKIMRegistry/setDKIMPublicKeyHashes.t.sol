// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { DKIMRegistry } from "../../../src/DKIMRegistry.sol";

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
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        registry.setDKIMPublicKeyHashes(domainHash, keyHashes);
    }

    function test_RevertIfArrayIsEmpty() public {
        bytes32[] memory keyHashes = new bytes32[](0);

        vm.prank(owner);
        vm.expectRevert("empty array");
        registry.setDKIMPublicKeyHashes(domainHash, keyHashes);
    }

    function test_RevertIfBatchContainsZeroHash() public {
        bytes32[] memory keyHashes = new bytes32[](2);
        keyHashes[0] = oldKeyHash;
        keyHashes[1] = bytes32(0);

        vm.prank(owner);
        vm.expectRevert("cannot set zero hash");
        registry.setDKIMPublicKeyHashes(domainHash, keyHashes);

        // The revert must be atomic: the valid entry earlier in the same batch
        // must not have been persisted either.
        assertFalse(registry.isKeyHashValid(domainHash, oldKeyHash));
    }

    function test_BatchCanReRegisterPreviouslyRevokedKey() public {
        vm.startPrank(owner);
        registry.setDKIMPublicKeyHash(domainHash, oldKeyHash);
        registry.revokeDKIMPublicKeyHash(domainHash, oldKeyHash);

        bytes32[] memory keyHashes = new bytes32[](2);
        keyHashes[0] = oldKeyHash;
        keyHashes[1] = newKeyHash;
        registry.setDKIMPublicKeyHashes(domainHash, keyHashes);
        vm.stopPrank();

        assertTrue(registry.isKeyHashValid(domainHash, oldKeyHash));
        assertTrue(registry.isKeyHashValid(domainHash, newKeyHash));
    }
}
