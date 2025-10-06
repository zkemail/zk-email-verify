// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Test } from "forge-std/Test.sol";
import { NoirUtilsHelper } from "./_NoirUtilsHelper.sol";

contract PackBoundedVecU8Test is Test {
    NoirUtilsHelper private _helper;

    function setUp() public {
        _helper = new NoirUtilsHelper();
    }

    function test_revertsWhen_InputLengthEqualsNumFields() public {
        // 6 length data
        string memory input = "abcdef";
        // data needs 6 slots + 1 length slot, so this should revert
        uint256 numFields = 6;

        vm.expectRevert();
        _helper.callPackBoundedVecU8(input, numFields);
    }

    function test_revertsWhen_InputTooLong() public {
        // 7 length data
        string memory input = "toolong";
        // data needs 7 slots + 1 length slot, so this should revert
        uint256 numFields = 6;

        vm.expectRevert();
        _helper.callPackBoundedVecU8(input, numFields);
    }

    function test_correctlyPacks() public view {
        string memory input = "hello";
        uint256 numFields = 8;

        // 8 slots: 5 data slots + 2 unused slots + 1 length slot
        bytes32[] memory expected = new bytes32[](8);
        // 5 data slots
        expected[0] = bytes32(uint256(uint8(bytes1("h"))));
        expected[1] = bytes32(uint256(uint8(bytes1("e"))));
        expected[2] = bytes32(uint256(uint8(bytes1("l"))));
        expected[3] = bytes32(uint256(uint8(bytes1("l"))));
        expected[4] = bytes32(uint256(uint8(bytes1("o"))));
        // 2 unused slots
        expected[5] = bytes32(0);
        expected[6] = bytes32(0);
        // 1 length slot
        expected[7] = bytes32(uint256(5));

        bytes32[] memory packed = _helper.callPackBoundedVecU8(input, numFields);
        _assertEq(packed, expected);
    }

    function _assertEq(bytes32[] memory packed, bytes32[] memory expected) internal pure {
        assertEq(keccak256(abi.encode(packed)), keccak256(abi.encode(expected)));
    }
}
