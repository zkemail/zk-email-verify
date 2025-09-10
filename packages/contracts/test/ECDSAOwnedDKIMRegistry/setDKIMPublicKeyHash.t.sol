// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../ECDSAOwnedDKIMRegistry.sol";

contract ECDSAOwnedDKIMRegistryTest_setDKIMPublicKeyHash is Test {
    ECDSAOwnedDKIMRegistry dkim;

    using console for *;
    using ECDSA for *;
    using Strings for *;

    string public selector = "12345";
    string public domainName = "example.com";
    // uint public signValidityDuration = 1 days;
    bytes32 public publicKeyHash = bytes32(uint256(1));

    function setUp() public {
        address signer = vm.addr(1);
        {
            dkim = new ECDSAOwnedDKIMRegistry(signer);
        }
    }

    function test_Revert_IfInvalidSelector() public {
        string memory invalidSelector = ""; // Example of an invalid selector (empty string)
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Invalid selector");
        dkim.setDKIMPublicKeyHash(invalidSelector, domainName, publicKeyHash, signature);
    }

    function test_Revert_IfInvalidDomainName() public {
        string memory invalidDomainName = ""; // Example of an invalid domain name (empty string)
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), invalidDomainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Invalid domain name");
        dkim.setDKIMPublicKeyHash(selector, invalidDomainName, publicKeyHash, signature);
    }

    function test_MinLengthSelectorAndDomainName() public {
        string memory minSelector = "a";
        string memory minDomainName = "b";
        bytes32 minPublicKeyHash = bytes32(uint256(1));
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), minDomainName, minPublicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        dkim.setDKIMPublicKeyHash(minSelector, minDomainName, minPublicKeyHash, signature);
        require(dkim.isKeyHashValid(keccak256(bytes(minDomainName)), minPublicKeyHash), "Invalid public key hash");
    }

    function test_MaxLengthSelectorAndDomainName() public {
        string memory maxSelector = new string(256);
        string memory maxDomainName = new string(256);
        bytes32 aPublicKeyHash = bytes32(uint256(1));
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), maxDomainName, aPublicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        dkim.setDKIMPublicKeyHash(maxSelector, maxDomainName, aPublicKeyHash, signature);
        require(dkim.isKeyHashValid(keccak256(bytes(maxDomainName)), aPublicKeyHash), "Invalid public key hash");
    }

    function test_Revert_IfInvalidPublicKeyHash() public {
        bytes32 zeroPublicKeyHash = bytes32(0);
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, zeroPublicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Invalid public key hash");
        dkim.setDKIMPublicKeyHash(selector, domainName, zeroPublicKeyHash, signature);
    }

    function test_MaxValuePublicKeyHash() public {
        bytes32 maxPublicKeyHash = bytes32(type(uint256).max);
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, maxPublicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        dkim.setDKIMPublicKeyHash(selector, domainName, maxPublicKeyHash, signature);
        require(dkim.isKeyHashValid(keccak256(bytes(domainName)), maxPublicKeyHash), "Invalid public key hash");
    }

    function test_SetDKIMPublicKeyHash() public {
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);
        require(dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash), "Invalid public key hash");
    }

    function test_SetDKIMPublicKeyHashMultiDomain() public {
        // vm.chainId(1);
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);
        require(dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash), "Invalid public key hash");

        selector = "67890";
        domainName = "example2.com";
        publicKeyHash = bytes32(uint256(2));
        signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (v, r, s) = vm.sign(1, digest);
        signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);
        require(dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash), "Invalid public key hash");
    }

    function test_RevokeDKIMPublicKeyHash() public {
        // vm.chainId(1);
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);

        // Revoke
        string memory revokeMsg = dkim.computeSignedMsg(dkim.REVOKE_PREFIX(), domainName, publicKeyHash);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(1, MessageHashUtils.toEthSignedMessageHash(bytes(revokeMsg)));
        bytes memory revokeSig = abi.encodePacked(r1, s1, v1);
        dkim.revokeDKIMPublicKeyHash(selector, domainName, publicKeyHash, revokeSig);

        require(!dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash));
    }

    function test_RevertIfDuplicated() public {
        // vm.chainId(1);
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);
        require(dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash), "Invalid public key hash");

        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(1, digest);
        bytes memory signature1 = abi.encodePacked(r1, s1, v1);
        vm.expectRevert("publicKeyHash is already set");
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature1);
    }

    function test_Revert_IfRevorked() public {
        // vm.chainId(1);
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);
        require(dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash), "Invalid public key hash");

        // Revoke
        string memory revokeMsg = dkim.computeSignedMsg(dkim.REVOKE_PREFIX(), domainName, publicKeyHash);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(1, MessageHashUtils.toEthSignedMessageHash(bytes(revokeMsg)));
        bytes memory revokeSig = abi.encodePacked(r1, s1, v1);
        dkim.revokeDKIMPublicKeyHash(selector, domainName, publicKeyHash, revokeSig);
        require(!dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash));

        signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(1, digest);
        bytes memory signature2 = abi.encodePacked(r2, s2, v2);
        vm.expectRevert("publicKeyHash is revoked");
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature2);
    }

    function test_Revert_IfSignatureInvalid() public {
        // vm.chainId(1);
        string memory signedMsg = dkim.computeSignedMsg(dkim.SET_PREFIX(), domainName, publicKeyHash);
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(bytes(signedMsg));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(2, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        vm.expectRevert("Invalid signature");
        dkim.setDKIMPublicKeyHash(selector, domainName, publicKeyHash, signature);
    }

    function test_Dfinity_Oracle_Response() public {
        vm.chainId(1);
        {
            dkim = new ECDSAOwnedDKIMRegistry(0x6293A80BF4Bd3fff995a0CAb74CBf281d922dA02);
        }
        selector = "20230601";
        domainName = "gmail.com";
        publicKeyHash = 0x0ea9c777dc7110e5a9e89b13f0cfc540e3845ba120b2b6dc24024d61488d4788;
        dkim.setDKIMPublicKeyHash(
            selector,
            domainName,
            publicKeyHash,
            vm.parseBytes(
                "0xb491dad31ddd0fd9994e76e0325f29a0f44732c56220b6df0e2672750b87fb2d46e41069e3e93d88ee55e45bb6c712e2b077749c8392908a1a862432e68b104b1b"
            )
        );
        require(dkim.isKeyHashValid(keccak256(bytes(domainName)), publicKeyHash), "Invalid public key hash");
    }
}
