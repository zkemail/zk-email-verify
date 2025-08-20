// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Test } from "forge-std/Test.sol";
import { CircuitUtilsHelper } from "./_CircuitUtilsHelper.sol";

contract PackBytes2FieldsTest is Test {
    CircuitUtilsHelper private _helper;

    function setUp() public {
        _helper = new CircuitUtilsHelper();
    }

    function test_emptyBytes() public view {
        bytes memory emptyBytes = "";
        uint256[] memory fields = _helper.callPackBytes2Fields(emptyBytes, 0);
        assertEq(fields.length, 0);
    }

    function test_singleByte() public view {
        bytes memory singleByte = hex"41";
        uint256[] memory fields = _helper.callPackBytes2Fields(singleByte, 1);
        assertEq(fields.length, 1);
        assertEq(uint8(fields[0]), 0x41);
    }

    function test_exactly31Bytes() public view {
        bytes memory data = new bytes(31);
        for (uint256 i = 0; i < 31; i++) {
            data[i] = bytes1(uint8(i + 1));
        }
        uint256[] memory fields = _helper.callPackBytes2Fields(data, 31);
        assertEq(fields.length, 1);
        uint256 expected = 0;
        for (uint256 i = 0; i < 31; i++) {
            expected += uint256(uint8(data[i])) << (8 * i);
        }
        assertEq(fields[0], expected);
    }

    function test_32Bytes() public view {
        bytes memory data = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            data[i] = bytes1(uint8(i + 1));
        }
        uint256[] memory fields = _helper.callPackBytes2Fields(data, 32);
        assertEq(fields.length, 2);
        uint256 expectedFirst = 0;
        for (uint256 i = 0; i < 31; i++) {
            expectedFirst += uint256(uint8(data[i])) << (8 * i);
        }
        assertEq(fields[0], expectedFirst);
        assertEq(fields[1], uint256(uint8(data[31])));
    }

    function test_withPadding() public view {
        bytes memory data = hex"414243";
        uint256[] memory fields = _helper.callPackBytes2Fields(data, 10);
        assertEq(fields.length, 1);
        uint256 expected = 0x41 + (0x42 << 8) + (0x43 << 16);
        assertEq(fields[0], expected);
    }

    function test_exactFieldBoundaries() public view {
        bytes memory data = new bytes(62);
        for (uint256 i = 0; i < 62; i++) {
            data[i] = bytes1(uint8(i + 1));
        }
        uint256[] memory fields = _helper.callPackBytes2Fields(data, 62);
        assertEq(fields.length, 2);
        uint256 expectedFirst = 0;
        for (uint256 i = 0; i < 31; i++) {
            expectedFirst += uint256(uint8(data[i])) << (8 * i);
        }
        assertEq(fields[0], expectedFirst);
        uint256 expectedSecond = 0;
        for (uint256 i = 31; i < 62; i++) {
            expectedSecond += uint256(uint8(data[i])) << (8 * (i - 31));
        }
        assertEq(fields[1], expectedSecond);
    }

    function test_allZeros() public view {
        bytes memory data = new bytes(31);
        uint256[] memory fields = _helper.callPackBytes2Fields(data, 31);
        assertEq(fields.length, 1);
        assertEq(fields[0], 0);
    }

    function test_maxByteValues() public view {
        bytes memory data = new bytes(31);
        for (uint256 i = 0; i < 31; i++) {
            data[i] = 0xFF;
        }
        uint256[] memory fields = _helper.callPackBytes2Fields(data, 31);
        assertEq(fields.length, 1);
        uint256 expected = 0;
        for (uint256 i = 0; i < 31; i++) {
            expected += 0xFF << (8 * i);
        }
        assertEq(fields[0], expected);
    }

    function test_realisticString() public view {
        bytes memory data = "gmail.com";
        uint256[] memory fields = _helper.callPackBytes2Fields(data, 255);
        assertEq(fields.length, 9);
        uint256 expected = 0;
        for (uint256 i = 0; i < data.length; i++) {
            expected += uint256(uint8(data[i])) << (8 * i);
        }
        assertEq(fields[0], expected);
        for (uint256 i = 1; i < 9; i++) {
            assertEq(fields[i], 0);
        }
    }

    function test_paddedSizeSmallerThanData() public view {
        bytes memory data = "This is a longer string that should be truncated";
        uint256[] memory fields = _helper.callPackBytes2Fields(data, 10);
        assertEq(fields.length, 1);
        uint256 expected = 0;
        for (uint256 i = 0; i < 10; i++) {
            expected += uint256(uint8(data[i])) << (8 * i);
        }
        assertEq(fields[0], expected);
    }
}
