// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Test } from "forge-std/Test.sol";
import { NoirUtilsHelper } from "./_NoirUtilsHelper.sol";

contract UnpackFieldsArrayTest is Test {
    NoirUtilsHelper private _helper;

    function setUp() public {
        _helper = new NoirUtilsHelper();
    }

    function test_emptyString() public view {
        bytes32[] memory inputFields = new bytes32[](1);
        inputFields[0] = bytes32(0);

        string memory expected = "";

        string memory result = _helper.callUnpackFieldsArray(inputFields);
        assertEq(result, expected);
    }

    function test_singleChar() public view {
        bytes32[] memory inputFields = new bytes32[](1);
        inputFields[0] = bytes32(uint256(0x41));

        string memory expected = "A";

        string memory result = _helper.callUnpackFieldsArray(inputFields);
        assertEq(result, expected);
    }

    function test_31Bytes() public view {
        // we want a 31 bytes length string that fits in 1 field
        bytes32[] memory inputFields = new bytes32[](1);
        // the field will hold an empty byte and 31 "A" bytes
        bytes memory data = new bytes(32);
        // 31 "A" bytes starting from the second byte
        for (uint256 i = 1; i < 32; i++) {
            data[i] = bytes1("A");
        }
        inputFields[0] = bytes32(data);

        // expected string is 31 "A" bytes
        string memory expected = "";
        for (uint256 i = 0; i < 31; i++) {
            expected = string.concat(expected, "A");
        }

        string memory result = _helper.callUnpackFieldsArray(inputFields);
        assertEq(result, expected);
    }

    function test_32Bytes() public view {
        // we want a 32 bytes length string with "A" in each byte that only fits in 2 fields
        bytes32[] memory inputFields = new bytes32[](2);

        // first field will hold an empty byte and 31 "A" bytes
        bytes memory data = new bytes(32);
        // 31 "A" bytes starting from the second byte
        for (uint256 i = 1; i < 32; i++) {
            data[i] = bytes1("A");
        }
        inputFields[0] = bytes32(data);

        // second field will hold the last "A" byte
        inputFields[1] = bytes32(uint256(uint8(bytes1("A"))));

        // expected string is 32 "A" bytes
        string memory expected = "";
        for (uint256 i = 0; i < 32; i++) {
            expected = string.concat(expected, "A");
        }

        string memory result = _helper.callUnpackFieldsArray(inputFields);
        assertEq(result, expected);
    }

    function test_stringWithUnusedSlots() public view {
        bytes32[] memory inputFields = new bytes32[](3);
        // 1 data slot
        inputFields[0] = bytes32(
            uint256(
                0x41 // A
                    + (0x42 << 8) // B
                    + (0x43 << 16) // C
            )
        );
        // 2 unused slots
        inputFields[1] = bytes32(0);
        inputFields[2] = bytes32(0);

        string memory expected = "ABC";

        string memory result = _helper.callUnpackFieldsArray(inputFields);
        assertEq(result, expected);
    }

    function test_realisticString() public view {
        bytes32[] memory inputFields = new bytes32[](1);
        inputFields[0] = bytes32(
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

        string memory expected = "gmail.com";

        string memory result = _helper.callUnpackFieldsArray(inputFields);
        assertEq(result, expected);
    }
}
