// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Test } from "forge-std/Test.sol";
import { CircuitUtilsHelper } from "./_CircuitUtilsHelper.sol";

contract ExtractEmailPartsTest is Test {
    CircuitUtilsHelper private _helper;

    function setUp() public {
        _helper = new CircuitUtilsHelper();
    }

    function test_simpleEmail() public view {
        string memory email = "user@gmail.com";
        string[] memory parts = _helper.callExtractEmailParts(email);
        assertEq(parts.length, 2);
        assertEq(parts[0], "user$gmail");
        assertEq(parts[1], "com");
    }

    function test_emailWithSubdomain() public view {
        string memory email = "user@sub.domain.com";
        string[] memory parts = _helper.callExtractEmailParts(email);
        assertEq(parts.length, 3);
        assertEq(parts[0], "user$sub");
        assertEq(parts[1], "domain");
        assertEq(parts[2], "com");
    }

    function test_emailWithMultipleDots() public view {
        string memory email = "user@domain.co.uk";
        string[] memory parts = _helper.callExtractEmailParts(email);
        assertEq(parts.length, 3);
        assertEq(parts[0], "user$domain");
        assertEq(parts[1], "co");
        assertEq(parts[2], "uk");
    }

    function test_complexEmail() public view {
        string memory email = "user.name+tag@sub.domain.co.uk";
        string[] memory parts = _helper.callExtractEmailParts(email);
        assertEq(parts.length, 5);
        assertEq(parts[0], "user");
        assertEq(parts[1], "name+tag$sub");
        assertEq(parts[2], "domain");
        assertEq(parts[3], "co");
        assertEq(parts[4], "uk");
    }
}
