// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {CircuitUtilsHelper} from "./_CircuitUtilsHelper.sol";

contract UnpackFields2BytesTest is Test {
    CircuitUtilsHelper private _helper;

    function setUp() public {
        _helper = new CircuitUtilsHelper();
    }

    function test_emptyFields() public view {
        bytes32[] memory fields = new bytes32[](0);
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 0);
        assertEq(result.length, 0);
    }

    function test_singleFieldSingleByte() public view {
        bytes32[] memory fields = new bytes32[](1);
        fields[0] = bytes32(uint256(0x41));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 1);
        assertEq(result.length, 1);
        assertEq(uint8(result[0]), 0x41);
    }

    function test_singleFieldMultipleBytes() public view {
        bytes32[] memory fields = new bytes32[](1);
        fields[0] = bytes32(uint256(0x41 + (0x42 << 8) + (0x43 << 16)));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 3);
        assertEq(result.length, 3);
        assertEq(uint8(result[0]), 0x41);
        assertEq(uint8(result[1]), 0x42);
        assertEq(uint8(result[2]), 0x43);
    }

    function test_multipleFields() public view {
        bytes32[] memory fields = new bytes32[](2);
        fields[0] = bytes32(uint256(0x41 + (0x42 << 8) + (0x43 << 16)));
        fields[1] = bytes32(uint256(0x44 + (0x45 << 8) + (0x46 << 16)));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 6);
        // Only the first 3 bytes are non-zero, the rest are zeros and will be trimmed
        assertEq(result.length, 3);
        assertEq(uint8(result[0]), 0x41);
        assertEq(uint8(result[1]), 0x42);
        assertEq(uint8(result[2]), 0x43);
    }

    function test_trimTrailingZeros() public view {
        bytes32[] memory fields = new bytes32[](1);
        fields[0] = bytes32(uint256(0x41 + (0x42 << 8) + (0x00 << 16)));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 3);
        assertEq(result.length, 2);
        assertEq(uint8(result[0]), 0x41);
        assertEq(uint8(result[1]), 0x42);
    }

    function test_zerosInMiddle() public view {
        bytes32[] memory fields = new bytes32[](1);
        fields[0] = bytes32(uint256(0x41 + (0x00 << 8) + (0x43 << 16)));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 3);
        assertEq(result.length, 3);
        assertEq(uint8(result[0]), 0x41);
        assertEq(uint8(result[1]), 0x00);
        assertEq(uint8(result[2]), 0x43);
    }

    function test_withOffset() public view {
        bytes32[] memory fields = new bytes32[](3);
        fields[0] = bytes32(uint256(0x11 + (0x12 << 8)));
        fields[1] = bytes32(uint256(0x21 + (0x22 << 8) + (0x23 << 16)));
        fields[2] = bytes32(uint256(0x31 + (0x32 << 8)));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 1, 3);
        assertEq(result.length, 3);
        assertEq(uint8(result[0]), 0x21);
        assertEq(uint8(result[1]), 0x22);
        assertEq(uint8(result[2]), 0x23);
    }

    function test_moreFieldsThanAvailable() public view {
        bytes32[] memory fields = new bytes32[](1);
        fields[0] = bytes32(uint256(0x41 + (0x42 << 8)));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 4);
        assertEq(result.length, 2);
        assertEq(uint8(result[0]), 0x41);
        assertEq(uint8(result[1]), 0x42);
    }

    function test_allZeros() public view {
        bytes32[] memory fields = new bytes32[](1);
        fields[0] = bytes32(uint256(0));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 31);
        assertEq(result.length, 0);
    }

    function test_maxFieldValue() public view {
        bytes32[] memory fields = new bytes32[](1);
        uint256 fieldValue = 0;
        for (uint256 i = 0; i < 31; i++) {
            fieldValue += 0xFF << (8 * i);
        }
        fields[0] = bytes32(fieldValue);
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 31);
        assertEq(result.length, 31);
        for (uint256 i = 0; i < 31; i++) {
            assertEq(uint8(result[i]), 0xFF);
        }
    }

    function test_multipleFieldsWithPadding() public view {
        bytes32[] memory fields = new bytes32[](2);
        fields[0] = bytes32(uint256(0x41 + (0x42 << 8) + (0x43 << 16)));
        fields[1] = bytes32(uint256(0x44 + (0x45 << 8)));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 5);
        // Only the first 3 bytes are non-zero, the rest are zeros and will be trimmed
        assertEq(result.length, 3);
        assertEq(uint8(result[0]), 0x41);
        assertEq(uint8(result[1]), 0x42);
        assertEq(uint8(result[2]), 0x43);
    }

    function test_partialFieldUnpack() public view {
        bytes32[] memory fields = new bytes32[](1);
        fields[0] = bytes32(uint256(0x41 + (0x42 << 8) + (0x43 << 16) + (0x44 << 24)));
        bytes memory result = _helper.callUnpackFields2Bytes(fields, 0, 2);
        assertEq(result.length, 2);
        assertEq(uint8(result[0]), 0x41);
        assertEq(uint8(result[1]), 0x42);
    }
}
