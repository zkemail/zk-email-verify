// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { DKIMRegistry } from "../../../src/DKIMRegistry.sol";
import { IDKIMRegistry } from "../../../src/interfaces/IERC7969.sol";

contract DKIMRegistryTest_setDKIMPublicKeyHash is Test {
    DKIMRegistry internal registry;

    address internal owner = vm.addr(1);
    address internal nonOwner = vm.addr(2);

    bytes32 internal domainHash = keccak256(bytes("example.com"));
    bytes32 internal keyHash = keccak256(bytes("key-hash"));

    function setUp() public {
        registry = new DKIMRegistry(owner);
    }

    function test_RegistersKeyHashAndMarksValid() public {
        vm.prank(owner);
        vm.expectEmit();
        emit IDKIMRegistry.KeyHashRegistered(domainHash, keyHash);
        registry.setDKIMPublicKeyHash(domainHash, keyHash);

        assertTrue(registry.isKeyHashValid(domainHash, keyHash));
    }

    function test_RevertIfCalledByNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, nonOwner));
        registry.setDKIMPublicKeyHash(domainHash, keyHash);
    }

    function test_CanReRegisterAfterRevocation() public {
        vm.startPrank(owner);
        registry.setDKIMPublicKeyHash(domainHash, keyHash);
        registry.revokeDKIMPublicKeyHash(domainHash, keyHash);
        registry.setDKIMPublicKeyHash(domainHash, keyHash);
        vm.stopPrank();

        assertTrue(registry.isKeyHashValid(domainHash, keyHash));
    }

    function test_RevertIfKeyHashIsZero() public {
        vm.prank(owner);
        vm.expectRevert("cannot set zero hash");
        registry.setDKIMPublicKeyHash(domainHash, bytes32(0));
    }
}
