// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "forge-std/src/Test.sol";
import "forge-std/src/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../UserOverrideableDKIMRegistry.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./helpers/ExampleERC1271.sol";
import "./helpers/ExampleOwnable.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract UserOverrideableDKIMRegistryTest is Test {
    UserOverrideableDKIMRegistry registry;
    using console for *;
    using ECDSA for *;
    using Strings for *;

    string public domainName = "example.com";
    bytes32 public publicKeyHash = bytes32(uint256(1));
    bytes32 public publicKeyHash2 = bytes32(uint256(2));
    uint256 public setTimestampDelay = 1 days;

    address deployer;
    address mainAuthorizer;
    address user1;
    address user2;

    UserOverrideableDKIMRegistry registryWithContract;
    ExampleERC1271 mainAuthorizerContract;
    ExampleOwnable exampleOwnable1;
    ExampleOwnable exampleOwnable2;

    function setUp() public {
        deployer = vm.addr(1);
        mainAuthorizer = vm.addr(9);
        user1 = vm.addr(2);
        user2 = vm.addr(3);
        {
            UserOverrideableDKIMRegistry registryImpl = new UserOverrideableDKIMRegistry();
            ERC1967Proxy proxy = new ERC1967Proxy(
                address(registryImpl),
                abi.encodeCall(
                    UserOverrideableDKIMRegistry.initialize,
                    (deployer, mainAuthorizer, setTimestampDelay)
                )
            );
            registry = UserOverrideableDKIMRegistry(address(proxy));
        }
        exampleOwnable1 = new ExampleOwnable(user1);
        exampleOwnable2 = new ExampleOwnable(user2);
        mainAuthorizerContract = new ExampleERC1271(mainAuthorizer);

        {
            UserOverrideableDKIMRegistry registryImpl = new UserOverrideableDKIMRegistry();
            ERC1967Proxy proxy = new ERC1967Proxy(
                address(registryImpl),
                abi.encodeCall(
                    UserOverrideableDKIMRegistry.initialize,
                    (
                        deployer,
                        address(mainAuthorizerContract),
                        setTimestampDelay
                    )
                )
            );
            registryWithContract = UserOverrideableDKIMRegistry(address(proxy));
        }
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
        vm.stopPrank();
        vm.startPrank(address(exampleOwnable1));
        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashByMainAuthorizerBeforeEnabled() public {
        vm.startPrank(mainAuthorizer);

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
            new bytes(0)
        );
        vm.stopPrank();

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
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // setThreshold = 3
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashByMainAuthorizerAfterEnabled() public {
        vm.startPrank(mainAuthorizer);

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
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        vm.warp(block.timestamp + setTimestampDelay);
        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashByMainAuthorizerECDSABeforeEnabled()
        public
    {
        vm.startPrank(deployer);
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
        vm.stopPrank();

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
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashByMainAuthorizerECDSAAfterEnabled()
        public
    {
        vm.startPrank(deployer);
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
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        vm.warp(block.timestamp + setTimestampDelay);
        // setThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashByMainAuthorizerContractBeforeEnabled()
        public
    {
        vm.startPrank(deployer);
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
            address(mainAuthorizerContract)
        );
        registryWithContract.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract),
            signature
        );
        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRegistered(
            domainName,
            publicKeyHash,
            user1
        );
        registryWithContract.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // setThreshold = 2
        require(
            registryWithContract.isDKIMPublicKeyHashValid(
                domainName,
                publicKeyHash
            ),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testSetDKIMPublicKeyHashByMainAuthorizerContractAfterEnabled()
        public
    {
        vm.startPrank(deployer);
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
            address(mainAuthorizerContract)
        );
        registryWithContract.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract),
            signature
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        vm.warp(block.timestamp + setTimestampDelay);
        // setThreshold = 2
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

        vm.startPrank(address(exampleOwnable1));
        require(
            !registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "public key hash is not revoked"
        );
        vm.stopPrank();
    }

    function testRevokeDKIMPublicKeyHashByMainAuthorizer() public {
        vm.startPrank(mainAuthorizer);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.DKIMPublicKeyHashRevoked(
            publicKeyHash,
            mainAuthorizer
        );
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        require(
            !registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "public key hash is not revoked"
        );
        vm.stopPrank();
    }

    function testRevokeDKIMPublicKeyHashByMainAuthorizerECDSA() public {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(deployer);
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

        vm.startPrank(address(exampleOwnable1));
        require(
            !registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "public key hash is not revoked"
        );
        vm.stopPrank();
    }

    function testRevokeDKIMPublicKeyHashByMainAuthorizerContract() public {
        testSetDKIMPublicKeyHashByMainAuthorizerContractBeforeEnabled();

        vm.startPrank(deployer);
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
            address(mainAuthorizerContract)
        );
        registryWithContract.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract),
            signature
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        require(
            !registryWithContract.isDKIMPublicKeyHashValid(
                domainName,
                publicKeyHash
            ),
            "public key hash is not revoked"
        );
        vm.stopPrank();
    }

    function testDKIMPublicKeyHashValidByUser1AfterRevokedByUser2() public {
        testSetDKIMPublicKeyHashByMainAuthorizerAfterEnabled();

        vm.startPrank(user2);
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user2,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 0
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testDKIMPublicKeyHashValidByUser1AfterSetByMainAuthorizerBeforeEnabledReactivatedByUser1()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerBeforeEnabled();

        vm.startPrank(mainAuthorizer);
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(user1);
        registry.reactivateDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 1
        // reactivated
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testDKIMPublicKeyHashValidByUser1AfterSetByMainAuthorizerAfterEnabledReactivatedByUser1()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerAfterEnabled();

        vm.startPrank(mainAuthorizer);
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(user1);
        registry.reactivateDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 1
        // reactivated
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testDKIMPublicKeyHashValidByUser1AfterSetByMainAuthorizerAfterEnabledReactivatedByUser2()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerAfterEnabled();

        vm.startPrank(mainAuthorizer);
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(user2);
        registry.reactivateDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user2,
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 1
        // not reactivated
        require(
            !registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "public key hash must be valid"
        );
        vm.stopPrank();
    }

    function testChangeMainAuthorizer() public {
        vm.startPrank(deployer);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.MainAuthorizerChanged(user1);
        registry.changeMainAuthorizer(user1);
        vm.stopPrank();
    }

    function testChangeMainAuthorizerContract() public {
        vm.startPrank(deployer);
        vm.expectEmit();
        emit UserOverrideableDKIMRegistry.MainAuthorizerChanged(user1);
        registryWithContract.changeMainAuthorizer(address(user1));
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser2() public {
        testSetDKIMPublicKeyHashByUser1();

        vm.startPrank(address(exampleOwnable2));
        // setThreshold = 0
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashBeforeEnabledWithoutUserConfirm()
        public
    {
        vm.startPrank(mainAuthorizer);

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
            new bytes(0)
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // setThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashBeforeEnabledWithoutUserConfirmECDSA()
        public
    {
        vm.startPrank(deployer);

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
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
        // setThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashBeforeEnabledWithoutUserConfirmContract()
        public
    {
        vm.startPrank(deployer);

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
            address(mainAuthorizerContract)
        );
        registryWithContract.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract),
            signature
        );
        vm.stopPrank();

        vm.startPrank(address(exampleOwnable1));
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

    function testExpectRevertInvalidECDSA() public {
        vm.startPrank(deployer);
        string memory signedMsg = registry.computeSignedMsg(
            registry.SET_PREFIX(),
            domainName,
            publicKeyHash
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            bytes(signedMsg)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(110, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        vm.expectRevert("invalid ecdsa signature");
        registry.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            signature
        );
        vm.stopPrank();
    }

    function testExpectRevertInvalidEip1271() public {
        vm.startPrank(deployer);
        string memory signedMsg = registry.computeSignedMsg(
            registry.SET_PREFIX(),
            "dummy.com",
            publicKeyHash
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            bytes(signedMsg)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(9, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        vm.expectRevert("invalid eip1271 signature");
        registryWithContract.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            address(mainAuthorizerContract),
            signature
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

    function testExpectRevertPublicKeyHashIsAlreadySetDKIMPublicKeyHashByMainAuthorizer()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerAfterEnabled();
        vm.startPrank(mainAuthorizer);

        vm.expectRevert("public key hash is already set");
        registry.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectRevertPublicKeyHashIsAlreadyRevokedByUser1() public {
        testRevokeDKIMPublicKeyHashByUser1();
        vm.startPrank(user1);

        vm.expectRevert("public key hash is already revoked");
        registry.setDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );

        vm.expectRevert("public key hash is already revoked");
        registry.revokeDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectRevertReactivateDKIMPublicKeyHashByMainAuthorizer()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerAfterEnabled();
        testRevokeDKIMPublicKeyHashByMainAuthorizer();

        vm.startPrank(mainAuthorizer);
        vm.expectRevert("mainAuthorizer cannot reactivate the public key hash");
        registry.reactivateDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            mainAuthorizer,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectReactivatePublicKeyHashIsAlreadyRevokedByUser1() public {
        testDKIMPublicKeyHashValidByUser1AfterSetByMainAuthorizerBeforeEnabledReactivatedByUser1();

        vm.startPrank(user1);
        vm.expectRevert("public key hash is already reactivated");
        registry.reactivateDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectReactivatePublicKeyHashIsNotRevokedByMainAuthorizer()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerBeforeEnabled();
        vm.startPrank(user1);
        vm.expectRevert("revoke threshold must be one");
        registry.reactivateDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectReactivatePublicKeyHashIsRevokedByUser1() public {
        testRevokeDKIMPublicKeyHashByUser1();

        vm.startPrank(user1);
        vm.expectRevert("revoke threshold must be one");
        registry.reactivateDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectReactivatePublicKeyHashIsNotSetByAnyone() public {
        testRevokeDKIMPublicKeyHashByMainAuthorizer();

        vm.startPrank(user1);
        vm.expectRevert("set threshold must be larger than two");
        registry.reactivateDKIMPublicKeyHash(
            domainName,
            publicKeyHash,
            user1,
            new bytes(0)
        );
        vm.stopPrank();
    }

    function testExpectReactivatePublicKeyHashIsNotSetByUser1() public {
        testRevokeDKIMPublicKeyHashByMainAuthorizer();

        vm.startPrank(user1);
        vm.expectRevert("set threshold must be larger than two");
        registry.reactivateDKIMPublicKeyHash(
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

    function testFailIsDKIMPublicKeyHashValidByUser1AfterRevokedByMainAuthorizer()
        public
    {
        testRevokeDKIMPublicKeyHashByMainAuthorizer();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser1AfterRevokedByUser1()
        public
    {
        testRevokeDKIMPublicKeyHashByUser1();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser1AfterSetByUser1RevokedByMainAuthorizer()
        public
    {
        testSetDKIMPublicKeyHashByUser1();
        testRevokeDKIMPublicKeyHashByMainAuthorizer();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser1AfterSetByMainAuthorizerBeforeEnabledRevokedByMainAuthorizer()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerBeforeEnabled();
        testRevokeDKIMPublicKeyHashByMainAuthorizer();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser1AfterSetByMainAuthorizerAfterEnabledRevokedByMainAuthorizer()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerAfterEnabled();
        testRevokeDKIMPublicKeyHashByMainAuthorizer();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 1
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser1AfterSetByUser1RevokedByUser1()
        public
    {
        testSetDKIMPublicKeyHashByUser1();
        testRevokeDKIMPublicKeyHashByUser1();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser1AfterSetByMainAuthorizerBeforeEnabledRevokedByUser1()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerBeforeEnabled();
        testRevokeDKIMPublicKeyHashByUser1();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testFailIsDKIMPublicKeyHashValidByUser1AfterSetByMainAuthorizerAfterEnabledRevokedByUser1()
        public
    {
        testSetDKIMPublicKeyHashByMainAuthorizerAfterEnabled();
        testRevokeDKIMPublicKeyHashByUser1();

        vm.startPrank(address(exampleOwnable1));
        // revokeThreshold = 2
        require(
            registry.isDKIMPublicKeyHashValid(domainName, publicKeyHash),
            "Invalid public key hash"
        );
        vm.stopPrank();
    }

    function testcomputeSetSignedMsg() public view {
        string memory signedMsg = registry.computeSignedMsg(
            registry.SET_PREFIX(),
            domainName,
            publicKeyHash
        );
        require(
            Strings.equal(
                signedMsg,
                "SET:domain=example.com;public_key_hash=0x01;"
            ),
            "Invalid signed message"
        );
        console.log(signedMsg);
    }

    function testcomputeRevokeSignedMsg() public view {
        string memory signedMsg = registry.computeSignedMsg(
            registry.REVOKE_PREFIX(),
            domainName,
            publicKeyHash
        );
        require(
            Strings.equal(
                signedMsg,
                "REVOKE:domain=example.com;public_key_hash=0x01;"
            ),
            "Invalid signed message"
        );
        console.log(signedMsg);
    }

    function testcomputeReactivateSignedMsg() public view {
        string memory signedMsg = registry.computeSignedMsg(
            registry.REACTIVATE_PREFIX(),
            domainName,
            publicKeyHash
        );
        require(
            Strings.equal(
                signedMsg,
                "REACTIVATE:domain=example.com;public_key_hash=0x01;"
            ),
            "Invalid signed message"
        );
        console.log(signedMsg);
    }

    function testExpectRevertChangeMainAuthorizerByNonOwner() public {
        vm.startPrank(mainAuthorizer);
        vm.expectRevert(
            abi.encodeWithSelector(
                OwnableUpgradeable.OwnableUnauthorizedAccount.selector,
                mainAuthorizer
            )
        );
        registry.changeMainAuthorizer(user1);
        vm.stopPrank();
    }

    function testExpectRevertChangeMainAuthorizerIsZero() public {
        vm.startPrank(deployer);
        vm.expectRevert("newMainAuthorizer address cannot be zero");
        registry.changeMainAuthorizer(address(0));
        vm.stopPrank();
    }

    function testExpectRevertChangeMainAuthorizerIsSame() public {
        vm.startPrank(deployer);
        vm.expectRevert(
            "newMainAuthorizer address cannot be the same as the current mainAuthorizer"
        );
        registry.changeMainAuthorizer(mainAuthorizer);
        vm.stopPrank();
    }
}
