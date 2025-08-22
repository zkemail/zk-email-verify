// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Test } from "forge-std/Test.sol";
import { CircuitUtils } from "../../CircuitUtils.sol";
import { CircuitUtilsHelper } from "./_CircuitUtilsHelper.sol";

contract FlattenFieldsTest is Test {
    CircuitUtilsHelper private _helper;

    function setUp() public {
        _helper = new CircuitUtilsHelper();
    }

    function test_expectRevert_tooManyElements() public {
        uint256[][] memory inputs = new uint256[][](2);
        inputs[0] = new uint256[](30);
        inputs[1] = new uint256[](31);
        for (uint256 i = 0; i < 30; i++) {
            inputs[0][i] = i + 1;
        }
        for (uint256 i = 0; i < 31; i++) {
            inputs[1][i] = i + 31;
        }
        vm.expectRevert(CircuitUtils.InvalidPubSignalsLength.selector);
        _helper.callFlattenFields(inputs, 60);
    }

    function test_expectRevert_tooFewElements() public {
        uint256[][] memory inputs = new uint256[][](2);
        inputs[0] = new uint256[](30);
        inputs[1] = new uint256[](29);
        for (uint256 i = 0; i < 30; i++) {
            inputs[0][i] = i + 1;
        }
        for (uint256 i = 0; i < 29; i++) {
            inputs[1][i] = i + 31;
        }
        vm.expectRevert(CircuitUtils.InvalidPubSignalsLength.selector);
        _helper.callFlattenFields(inputs, 60);
    }

    function test_zeroArrays() public {
        uint256[][] memory inputs = new uint256[][](0);
        vm.expectRevert(CircuitUtils.InvalidPubSignalsLength.selector);
        _helper.callFlattenFields(inputs, 60);
    }

    function test_singleArray() public view {
        uint256[][] memory inputs = new uint256[][](1);
        inputs[0] = new uint256[](60);
        for (uint256 i = 0; i < 60; i++) {
            inputs[0][i] = i + 1;
        }
        uint256[] memory result = _helper.callFlattenFields(inputs, 60);
        for (uint256 i = 0; i < 60; i++) {
            assertEq(result[i], i + 1);
        }
    }

    function test_multipleArrays() public view {
        uint256[][] memory inputs = new uint256[][](3);
        inputs[0] = new uint256[](20);
        inputs[1] = new uint256[](20);
        inputs[2] = new uint256[](20);
        for (uint256 i = 0; i < 20; i++) {
            inputs[0][i] = i + 1;
            inputs[1][i] = i + 21;
            inputs[2][i] = i + 41;
        }
        uint256[] memory result = _helper.callFlattenFields(inputs, 60);
        for (uint256 i = 0; i < 20; i++) {
            assertEq(result[i], i + 1);
            assertEq(result[i + 20], i + 21);
            assertEq(result[i + 40], i + 41);
        }
    }

    function test_manySmallArrays() public view {
        uint256[][] memory inputs = new uint256[][](60);
        for (uint256 i = 0; i < 60; i++) {
            inputs[i] = new uint256[](1);
            inputs[i][0] = i + 1;
        }
        uint256[] memory result = _helper.callFlattenFields(inputs, 60);
        for (uint256 i = 0; i < 60; i++) {
            assertEq(result[i], i + 1);
        }
    }
}
