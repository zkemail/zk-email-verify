// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {NoirUtilsHelper} from "./_NoirUtilsHelper.sol";

contract PackFieldsArrayTest is Test {
    NoirUtilsHelper private _helper;

    function setUp() public {
        _helper = new NoirUtilsHelper();
    }

    function test_revertsWhen_inputTooLong() public {
        // 32 bytes of data
        bytes memory input = new bytes(32);
        // 1 field can fit only 31 bytes, so this should revert
        uint256 numFields = 1;

        vm.expectRevert();
        _helper.callPackFieldsArray(input, numFields);
    }

    function test_emptyBytes() public view {
        bytes memory input = "";
        uint256 numFields = 1;

        bytes32[] memory expected = new bytes32[](1);
        expected[0] = bytes32(0);

        bytes32[] memory fields = _helper.callPackFieldsArray(input, numFields);
        _assertEq(fields, expected);
    }

    function test_singleChar() public view {
        bytes memory input = bytes("A");
        uint256 numFields = 1;

        bytes32[] memory expected = new bytes32[](1);
        expected[0] = bytes32(uint256(0x41));

        bytes32[] memory fields = _helper.callPackFieldsArray(input, numFields);
        _assertEq(fields, expected);
    }

    function test_31Bytes() public view {
        bytes memory input = new bytes(31);
        // 1 field can fit exactly 31 bytes
        uint256 numFields = 1;

        bytes32[] memory expected = new bytes32[](1);
        expected[0] = bytes32(uint256(0));

        bytes32[] memory fields = _helper.callPackFieldsArray(input, numFields);
        _assertEq(fields, expected);
    }

    function test_bytesWithUnusedSlots() public view {
        bytes memory input = bytes("ABC");
        uint256 numFields = 3;

        // 3 slots: 1 data slot + 2 unused slots
        bytes32[] memory expected = new bytes32[](3);
        // 1 data slot
        expected[0] = bytes32(
            uint256(
                0x41 // A
                    + (0x42 << 8) // B
                    + (0x43 << 16) // C
            )
        );
        // 2 unused slots
        expected[1] = bytes32(0);
        expected[2] = bytes32(0);

        bytes32[] memory fields = _helper.callPackFieldsArray(input, numFields);
        _assertEq(fields, expected);
    }

    function test_realisticString() public view {
        bytes memory input = bytes("gmail.com");
        uint256 numFields = 1;

        bytes32[] memory expected = new bytes32[](1);
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

        bytes32[] memory fields = _helper.callPackFieldsArray(input, numFields);
        _assertEq(fields, expected);
    }

    function _assertEq(bytes32[] memory fields, bytes32[] memory expected) internal pure {
        assertEq(keccak256(abi.encode(fields)), keccak256(abi.encode(expected)));
    }
}
