// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "forge-std/src/Test.sol";
import "forge-std/src/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../UserOverrideableDKIMRegistry.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./helpers/ExampleERC1271.sol";

contract UserOverrideableDKIMRegistryTest is Test {
    UserOverrideableDKIMRegistry registry;
    using console for *;
    using ECDSA for *;
    using Strings for *;

    string public domainName = "example.com";
    bytes32 public publicKeyHash = bytes32(uint256(1));
    bytes32 public publicKeyHash2 = bytes32(uint256(2));

    address deployer;
    address mainAuthorizer;
    address user1;
    address user2;

    UserOverrideableDKIMRegistry registryWithContract;
    ExampleERC1271 mainAuthorizerContract;

    function setUp() public {
        deployer = vm.addr(1);
        mainAuthorizer = vm.addr(9);
        user1 = vm.addr(2);
        user2 = vm.addr(3);
        registry = new UserOverrideableDKIMRegistry(deployer, mainAuthorizer);

        mainAuthorizerContract = new ExampleERC1271(mainAuthorizer);
        registryWithContract = new UserOverrideableDKIMRegistry(
            deployer,
            address(mainAuthorizerContract)
        );
    }

    function testSetDKIMPublicKeyHashByUser1() public {
        vm.startPrank(user1);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            user1
        );
        registry.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();

        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash, user1),
            "Invalid public key hash"
        );
    }

    function testIsDKIMPublicKeyHashValidByUser2() public {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(user1);

        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash, user1),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser2() public {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(user2);

        // setThreshold = 0
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testExpectRevertDomainNameCannotBeZeroSetDKIMPublicKeyHashByUser1()
        public
    {
        vm.startPrank(user1);

        vm.expectRevert("domain name cannot be zero");
        registry.setDKIMPublicKeyHash("", publicKeyHash, user1, new bytes(0));
        vm.stopPrank();
    }

    function testExpectRevertPublicKeyHashCannotBeZeroSetDKIMPublicKeyHashByUser1()
        public
    {
        vm.startPrank(user1);

        vm.expectRevert("public key hash cannot be zero");
        registry.setDKIMPublicKeyHash(
            domainName,
            bytes32(uint256(0)),
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectRevertAuthorizerAddressCannotBeZeroSetDKIMPublicKeyHashByUser1()
        public
    {
        vm.startPrank(user1);

        vm.expectRevert("authorizer address cannot be zero");
        registry.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(0),
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectRevertPublicKeyHashIsAlreadyRevokedSetDKIMPublicKeyHashByUser1()
        public
    {
        testRevokeDKIMPublicKeyHashByUser1();
        vm.startPrank(user1);

        vm.expectRevert("public key hash is already revoked");
        registry.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashOfMainAuthorizerByUser1() public {
        vm.startPrank(user1);

        string memory signedMsg = registry.computeSignedMsg(
            registry.SET_PREFIX(),
            domainName,
            publicKeyHash
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            bytes(signedMsg)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(9, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            mainAuthorizer
        );
        registry.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            signature
        );
        // setThreshold = 3
        require(
            registry.isDKIMPublicKeyHashValid(
                domainName,
                publicKeyHash,
                mainAuthorizer
            ),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailSetDKIMPublicKeyHashOfMainAuthorizerByUser1() public {
        vm.startPrank(user1);

        string memory signedMsg = registry.computeSignedMsg(
            registry.SET_PREFIX(),
            domainName,
            publicKeyHash
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            bytes(signedMsg)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(9, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            mainAuthorizer
        );
        registry.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            signature
        );
        // setThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashOfMainAuthorizerAsContractByUser1()
        public
    {
        vm.startPrank(user1);

        string memory signedMsg = registryWithContract.computeSignedMsg(
            registryWithContract.SET_PREFIX(),
            domainName,
            publicKeyHash
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            bytes(signedMsg)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(9, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract)
        );
        registryWithContract.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract),
            signature
        );
        // setThreshold = 3
        require(
            registryWithContract.isDKIMPublicKeyHashValid(
                domainName,
                publicKeyHash,
                address(mainAuthorizerContract)
            ),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailSetDKIMPublicKeyHashOfMainAuthorizerAsContractByUser1()
        public
    {
        vm.startPrank(user1);

        string memory signedMsg = registryWithContract.computeSignedMsg(
            registryWithContract.SET_PREFIX(),
            domainName,
            publicKeyHash
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            bytes(signedMsg)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(9, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract)
        );
        registryWithContract.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract),
            signature
        );
        // setThreshold = 1
        require(
            registryWithContract.isDKIMPublicKeyHashValid(
                domainName,
                publicKeyHash
            ),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testRevokeDKIMPublicKeyHashByUser1() public {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(user1);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRevoked(
            publicKeyHash,
            user1
        );
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectRevertDomainNameCannotBeZeroRevokeDKIMPublicKeyHashByUser1()
        public
    {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(user1);
        vm.expectRevert("domain name cannot be zero");
        registry.revokeDKIMPublicKeyHash(
            "",
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectRevertPublicKeyHashCannotBeZeroRevokeDKIMPublicKeyHashByUser1()
        public
    {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(user1);
        vm.expectRevert("public key hash cannot be zero");
        registry.revokeDKIMPublicKeyHash(
            domainName,
            bytes32(uint256(0)),
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectRevertAuthorizerAddressCannotBeZeroRevokeDKIMPublicKeyHashByUser1()
        public
    {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(user1);
        vm.expectRevert("authorizer address cannot be zero");
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(0),
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectRevertPublicKeyHashIsAlreadyRevokedRevokeDKIMPublicKeyHashByUser1()
        public
    {
        testRevokeDKIMPublicKeyHashByUser1();

        vm.startPrank(user1);
        vm.expectRevert("public key hash is already revoked");
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testRevokeDKIMPublicKeyHashOfMainAuthorizerByUser1() public {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(user1);

        string memory signedMsg = registry.computeSignedMsg(
            registry.REVOKE_PREFIX(),
            domainName,
            publicKeyHash
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            bytes(signedMsg)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(9, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRevoked(
            publicKeyHash,
            mainAuthorizer
        );
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            signature
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser1AfterRevokedByMainAuthorizer()
        public
    {
        testRevokeDKIMPublicKeyHashOfMainAuthorizerByUser1();

        vm.startPrank(user1);
        // removeThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testRevokeDKIMPublicKeyHashOfMainAuthorizerAsContractByUser1()
        public
    {
        testSetDKIMPublicKeyHashOfMainAuthorizerAsContractByUser1();

        vm.startPrank(user1);

        string memory signedMsg = registryWithContract.computeSignedMsg(
            registryWithContract.REVOKE_PREFIX(),
            domainName,
            publicKeyHash
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            bytes(signedMsg)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(9, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRevoked(
            publicKeyHash,
            address(mainAuthorizerContract)
        );
        registryWithContract.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract),
            signature
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashesByUser1() public {
        vm.startPrank(user1);
        string[] memory domainNames = new string[](2);
        domainNames[0] = domainName;
        domainNames[1] = domainName;
        bytes32[] memory publicKeyHashes = new bytes32[](2);
        publicKeyHashes[0] = publicKeyHash;
        publicKeyHashes[1] = publicKeyHash2;
        address[] memory authorizers = new address[](2);
        authorizers[0] = user1;
        authorizers[1] = user1;
        bytes[] memory signatures = new bytes[](2);
        signatures[0] = new bytes(0);
        signatures[1] = new bytes(0);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHashes[0],
            authorizers[0]
        );
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHashes[1],
            authorizers[1]
        );
        registry.setDKIMPublicKeyHashes(
            domainNames,
            publicKeyHashes,
            authorizers,
            signatures
        );

        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHashes[0]),
            "Invalid public key hash"
        );
        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHashes[1]),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailisDKIMPublicKeyHashValidByUser2() public {
        testSetDKIMPublicKeyHashesByUser1();

        vm.startPrank(user2);
        // setThreshold = 0
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testcomputeSignedMsg() public {
        string memory signedMsg = registry.computeSignedMsg(
            registry.SET_PREFIX(),
            domainName,
            publicKeyHash
        );
        require(
            Strings.equal(
                signedMsg,
                "SET:;domain=example.com;public_key_hash=0x01;"
            ),
            "Invalid signed message"
        );
        console.log(signedMsg);
    }
}
