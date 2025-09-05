// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "forge-std/Test.sol";
import "../../ECDSAOwnedDKIMRegistry.sol";

contract ECDSAOwnedDKIMRegistryTest_computeSignedMsg is Test {
    using Strings for uint256;

    ECDSAOwnedDKIMRegistry dkim;

    function setUp() public {
        address signer = vm.addr(1);
        dkim = new ECDSAOwnedDKIMRegistry(signer);
    }

    function test_computeSignedMsg() public view {
        string memory prefix = "SET:";
        string memory domainName = "example.com";
        bytes32 publicKeyHash = bytes32(uint256(1));

        string memory expectedMsg =
            string.concat(prefix, "domain=", domainName, ";public_key_hash=", uint256(publicKeyHash).toHexString(), ";");

        string memory computedMsg = dkim.computeSignedMsg(prefix, domainName, publicKeyHash);

        assertEq(computedMsg, expectedMsg, "Computed message does not match expected message");
    }
}
