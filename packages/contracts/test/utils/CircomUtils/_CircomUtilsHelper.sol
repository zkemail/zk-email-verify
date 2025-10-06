// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CircomUtils} from "../../../utils/CircomUtils.sol";

contract CircomUtilsHelper {
    function callFlattenFields(uint256[][] memory inputs, uint256 outLength) external pure returns (uint256[] memory) {
        return CircomUtils.flattenFields(inputs, outLength);
    }

    function callPackBytes2Fields(bytes memory data, uint256 paddedSize) external pure returns (uint256[] memory) {
        return CircomUtils.packBytes2Fields(data, paddedSize);
    }

    function callUnpackFields2Bytes(bytes32[] calldata fields, uint256 startIndex, uint256 paddedSize)
        external
        pure
        returns (bytes memory)
    {
        return CircomUtils.unpackFields2Bytes(fields, startIndex, paddedSize);
    }
}
