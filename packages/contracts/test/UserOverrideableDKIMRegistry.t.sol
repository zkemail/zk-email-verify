// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "forge-std/src/Test.sol";
import "forge-std/src/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../UserOverrideableDKIMRegistry.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract UserOverrideableDKIMRegistryTest is Test {
    UserOverrideableDKIMRegistry registry;
    using console for *;
    using ECDSA for *;
    using Strings for *;

    string public domainName = "example.com";
    bytes32 public publicKeyHash = bytes32(uint256(1));
    bytes32 public publicKeyHash2 = bytes32(uint256(2));

    address deployer;
    address user1;
    address user2;

    function setUp() public {
        deployer = vm.addr(1);
        user1 = vm.addr(2);
        user2 = vm.addr(3);
        registry = new UserOverrideableDKIMRegistry(deployer);
    }

    function testSetDKIMPublicKeyHashForAll() public {
        vm.startPrank(deployer);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            address(0)
        );
        registry.setDKIMPublicKeyHash(domainName, publicKeyHash, false);
        vm.stopPrank();
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
    }

    function testFuzzSetDKIMPublicKeyHashForAll(
        string memory randomDomainName,
        bytes32 randomPublicKeyHash
    ) public {
        vm.startPrank(deployer);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            randomDomainName,
            randomPublicKeyHash,
            address(0)
        );
        registry.setDKIMPublicKeyHash(
            randomDomainName,
            randomPublicKeyHash,
            false
        );
        vm.stopPrank();
        require(
            registry.isDKIMPublicKeyHashValid(
                randomDomainName,
                randomPublicKeyHash
            ),
            "Invalid public key hash"
        );
    }

    function testFailDKIMPublicKeyHashForAllByUser1() public {
        vm.startPrank(user1);
        registry.setDKIMPublicKeyHash(domainName, publicKeyHash, false);
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashForPersonalByUser1() public {
        vm.startPrank(user1);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            user1
        );
        registry.setDKIMPublicKeyHash(domainName, publicKeyHash, true);
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFuzzSetDKIMPublicKeyHashForPersonalByUser1(
        string memory randomDomainName,
        bytes32 randomPublicKeyHash
    ) public {
        vm.startPrank(user1);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            randomDomainName,
            randomPublicKeyHash,
            user1
        );
        registry.setDKIMPublicKeyHash(
            randomDomainName,
            randomPublicKeyHash,
            true
        );
        require(
            registry.isDKIMPublicKeyHashValid(
                randomDomainName,
                randomPublicKeyHash
            ),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailSetDKIMPublicKeyHashForPersonalByUser1ReadByUser2()
        public
    {
        vm.startPrank(user1);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            user1
        );
        registry.setDKIMPublicKeyHash(domainName, publicKeyHash, true);
        vm.stopPrank();
        vm.startPrank(user2);
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testRevokeDKIMPublicKeyHashForAll() public {
        testSetDKIMPublicKeyHashForAll();
        vm.startPrank(deployer);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRevoked(
            publicKeyHash,
            address(0)
        );
        registry.revokeDKIMPublicKeyHash(publicKeyHash, false);
        vm.stopPrank();
        require(
            !registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Revoke failed"
        );
    }

    function testFailRevokeDKIMPublicKeyHashForAllByUser1() public {
        testSetDKIMPublicKeyHashForAll();
        vm.startPrank(user1);
        registry.revokeDKIMPublicKeyHash(publicKeyHash, false);
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashesForAll() public {
        vm.startPrank(deployer);
        bytes32[] memory publicKeyHashes = new bytes32[](2);
        publicKeyHashes[0] = publicKeyHash;
        publicKeyHashes[1] = publicKeyHash2;
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            address(0)
        );
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash2,
            address(0)
        );
        registry.setDKIMPublicKeyHashes(domainName, publicKeyHashes, false);
        vm.stopPrank();
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash2),
            "Invalid public key hash"
        );
    }

    function testFailDKIMPublicKeyHashesForAllByUser1() public {
        vm.startPrank(user1);
        bytes32[] memory publicKeyHashes = new bytes32[](2);
        publicKeyHashes[0] = publicKeyHash;
        publicKeyHashes[1] = publicKeyHash2;
        registry.setDKIMPublicKeyHashes(domainName, publicKeyHashes, false);
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashesForPersonalByUser1() public {
        vm.startPrank(user1);
        bytes32[] memory publicKeyHashes = new bytes32[](2);
        publicKeyHashes[0] = publicKeyHash;
        publicKeyHashes[1] = publicKeyHash2;
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            user1
        );
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash2,
            user1
        );
        registry.setDKIMPublicKeyHashes(domainName, publicKeyHashes, true);
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash2),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailSetDKIMPublicKeyHashesForPersonalByUser1ReadByUser2()
        public
    {
        vm.startPrank(user1);
        bytes32[] memory publicKeyHashes = new bytes32[](2);
        publicKeyHashes[0] = publicKeyHash;
        publicKeyHashes[1] = publicKeyHash2;
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            user1
        );
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash2,
            user1
        );
        registry.setDKIMPublicKeyHashes(domainName, publicKeyHashes, true);
        vm.stopPrank();
        vm.startPrank(user2);
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }
}
