// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {CircomUtils} from "../../../utils/CircomUtils.sol";
import {CircomUtilsHelper} from "./_CircomUtilsHelper.sol";

contract PackBytes2FieldsTest is Test {
    CircomUtilsHelper private _helper;

    function setUp() public {
        _helper = new CircomUtilsHelper();
    }

    function test_revertsWhen_paddedSizeSmallerThanData() public {
        bytes memory input = "This is a longer string that should revert";
        uint256 paddedSize = 10;

        vm.expectRevert(CircomUtils.InvalidDataLength.selector);
        _helper.callPackFieldsArray(input, paddedSize);
    }

    function test_emptyBytes() public view {
        bytes memory input = "";
        uint256 paddedSize = 0;

        bytes32[] memory expected = new bytes32[](0);

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function test_singleByte() public view {
        bytes memory input = bytes("A");
        uint256 paddedSize = 1;

        bytes32[] memory expected = new bytes32[](1);
        expected[0] = bytes32(uint256(0x41));

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function test_31Bytes() public view {
        bytes memory input = new bytes(31);
        uint256 paddedSize = 31;

        bytes32[] memory expected = new bytes32[](1);
        expected[0] = bytes32(uint256(0));

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function test_32Bytes() public view {
        bytes memory input = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            input[i] = bytes1(uint8(i + 1));
        }
        uint256 paddedSize = 32;

        bytes32[] memory expected = new bytes32[](2);
        for (uint256 i = 0; i < 31; i++) {
            expected[0] = bytes32(uint256(expected[0]) + (uint256(uint8(input[i])) << (8 * i)));
        }
        expected[1] = bytes32(uint256(uint8(input[31])));

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function test_withPadding() public view {
        bytes memory input = bytes("ABC");
        uint256 paddedSize = 10;

        bytes32[] memory expected = new bytes32[](1);
        expected[0] = bytes32(
            uint256(
                0x41 // A
                    + (0x42 << 8) // B
                    + (0x43 << 16) // C
            )
        );

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function test_exactFieldBoundaries() public view {
        bytes memory input = new bytes(62);
        for (uint256 i = 0; i < 62; i++) {
            input[i] = bytes1(uint8(i + 1));
        }
        uint256 paddedSize = 62;

        bytes32[] memory expected = new bytes32[](2);
        for (uint256 i = 0; i < 31; i++) {
            expected[0] = bytes32(uint256(expected[0]) + (uint256(uint8(input[i])) << (8 * i)));
        }
        for (uint256 i = 31; i < 62; i++) {
            expected[1] = bytes32(uint256(expected[1]) + (uint256(uint8(input[i])) << (8 * (i - 31))));
        }

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function test_allZeros() public view {
        bytes memory input = new bytes(31);
        uint256 paddedSize = 31;

        bytes32[] memory expected = new bytes32[](1);

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function test_maxByteValues() public view {
        bytes memory input = new bytes(31);
        for (uint256 i = 0; i < 31; i++) {
            input[i] = 0xFF;
        }
        uint256 paddedSize = 31;

        bytes32[] memory expected = new bytes32[](1);
        for (uint256 i = 0; i < 31; i++) {
            expected[0] = bytes32(uint256(expected[0]) + (0xFF << (8 * i)));
        }

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function test_realisticString() public view {
        bytes memory input = "gmail.com";
        uint256 paddedSize = 255;

        bytes32[] memory expected = new bytes32[](9);
        expected[0] = bytes32(
            uint256(
                0x67 // g
                    + (0x6d << 8) // m
                    + (0x61 << 16) // a
                    + (0x69 << 24) // i
                    + (0x6c << 32) // l
                    + (0x2e << 40) // .
                    + (0x63 << 48) // c
                    + (0x6f << 56) // o
                    + (0x6d << 64) // m
            )
        );

        bytes32[] memory fields = _helper.callPackFieldsArray(input, paddedSize);
        _assertEq(fields, expected);
    }

    function _assertEq(bytes32[] memory fields, bytes32[] memory expected) internal pure {
        assertEq(keccak256(abi.encode(fields)), keccak256(abi.encode(expected)));
    }
}
