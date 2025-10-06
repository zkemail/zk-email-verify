// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Test } from "forge-std/Test.sol";
import { NoirUtilsHelper } from "./_NoirUtilsHelper.sol";

contract PackHeaderHashTest is Test {
    NoirUtilsHelper private _helper;

    function setUp() public {
        _helper = new NoirUtilsHelper();
    }

    function test_correctlyPacks() public view {
        bytes32 headerHash = 0xDEADBEEFDEADBEEFDEADBEEFDEADBEEF000102030405060708090A0B0C0D0E0F;

        bytes32[] memory result = _helper.callPackHeaderHash(headerHash);
        assertEq(result[0], 0x00000000000000000000000000000000DEADBEEFDEADBEEFDEADBEEFDEADBEEF);
        assertEq(result[1], 0x00000000000000000000000000000000000102030405060708090A0B0C0D0E0F);
    }

    function test_correctlyPacks_zero() public view {
        bytes32 headerHash = 0x0000000000000000000000000000000000000000000000000000000000000000;

        bytes32[] memory result = _helper.callPackHeaderHash(headerHash);
        assertEq(result[0], 0x0000000000000000000000000000000000000000000000000000000000000000);
        assertEq(result[1], 0x0000000000000000000000000000000000000000000000000000000000000000);
    }

    function test_correctlyPacks_max() public view {
        bytes32 headerHash = bytes32(type(uint256).max);

        bytes32[] memory result = _helper.callPackHeaderHash(headerHash);
        assertEq(result[0], 0x00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
        assertEq(result[1], 0x00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
    }
}
