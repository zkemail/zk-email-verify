// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Test } from "forge-std/Test.sol";
import { NoirUtilsHelper } from "./_NoirUtilsHelper.sol";

contract UnpackHeaderHashTest is Test {
    NoirUtilsHelper private _helper;

    function setUp() public {
        _helper = new NoirUtilsHelper();
    }

    function test_revertsWhenInvalidLength() public {
        bytes32[] memory fields = new bytes32[](1);
        vm.expectRevert();
        _helper.callUnpackHeaderHash(fields);
    }

    function test_correctlyUnpacks() public view {
        bytes32[] memory fields = new bytes32[](2);
        fields[0] = bytes32(0x00000000000000000000000000000000DEADBEEFDEADBEEFDEADBEEFDEADBEEF);
        fields[1] = bytes32(0x00000000000000000000000000000000000102030405060708090A0B0C0D0E0F);
        bytes32 result = _helper.callUnpackHeaderHash(fields);
        assertEq(result, 0xDEADBEEFDEADBEEFDEADBEEFDEADBEEF000102030405060708090A0B0C0D0E0F);
    }

    function test_correctlyUnpacks_zero() public view {
        bytes32[] memory fields = new bytes32[](2);
        fields[0] = bytes32(0x0000000000000000000000000000000000000000000000000000000000000000);
        fields[1] = bytes32(0x0000000000000000000000000000000000000000000000000000000000000000);
        bytes32 result = _helper.callUnpackHeaderHash(fields);
        assertEq(result, 0x0000000000000000000000000000000000000000000000000000000000000000);
    }

    function test_correctlyUnpacks_max() public view {
        bytes32[] memory fields = new bytes32[](2);
        fields[0] = bytes32(0x00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
        fields[1] = bytes32(0x00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
        bytes32 result = _helper.callUnpackHeaderHash(fields);
        assertEq(result, bytes32(type(uint256).max));
    }
}
