// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {NoirUtilsHelper} from "./_NoirUtilsHelper.sol";

contract UnpackBoundedVecU8Test is Test {
    NoirUtilsHelper private _helper;

    function setUp() public {
        _helper = new NoirUtilsHelper();
    }

    function test_correctlyUnpacks() public view {
        // 8 slots: 5 data slots + 2 unused slots + 1 length slot
        bytes32[] memory input = new bytes32[](8);
        // 5 data slots
        input[0] = bytes32(uint256(uint8(bytes1("h"))));
        input[1] = bytes32(uint256(uint8(bytes1("e"))));
        input[2] = bytes32(uint256(uint8(bytes1("l"))));
        input[3] = bytes32(uint256(uint8(bytes1("l"))));
        input[4] = bytes32(uint256(uint8(bytes1("o"))));
        // 2 unused slots
        input[5] = bytes32(0);
        input[6] = bytes32(0);
        // 1 length slot
        input[7] = bytes32(uint256(5));

        bytes memory expected = bytes("hello");

        bytes memory result = _helper.callUnpackBoundedVecU8(input);
        assertEq(keccak256(result), keccak256(expected));
    }
}
