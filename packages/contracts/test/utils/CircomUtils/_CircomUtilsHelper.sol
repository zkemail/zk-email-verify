// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CircomUtils} from "../../../utils/CircomUtils.sol";

contract CircomUtilsHelper {
    function callPackFieldsArray(bytes memory input, uint256 paddedSize) external pure returns (bytes32[] memory) {
        return CircomUtils.packFieldsArray(input, paddedSize);
    }

    function callUnpackFieldsArray(bytes32[] calldata fields, uint256 paddedSize)
        external
        pure
        returns (bytes memory)
    {
        return CircomUtils.unpackFieldsArray(fields, paddedSize);
    }
}
