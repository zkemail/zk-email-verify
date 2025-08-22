// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { CircuitUtils } from "../../CircuitUtils.sol";

contract CircuitUtilsHelper {
    function callExtractCommandParamByIndex(
        string[] memory template,
        string memory command,
        uint256 index
    )
        external
        pure
        returns (string memory)
    {
        return CircuitUtils.extractCommandParamByIndex(template, command, index);
    }

    function callFlattenFields(uint256[][] memory inputs, uint256 outLength) external pure returns (uint256[] memory) {
        return CircuitUtils.flattenFields(inputs, outLength);
    }

    function callPackBytes2Fields(bytes memory data, uint256 paddedSize) external pure returns (uint256[] memory) {
        return CircuitUtils.packBytes2Fields(data, paddedSize);
    }

    function callUnpackFields2Bytes(
        uint256[] calldata fields,
        uint256 startIndex,
        uint256 paddedSize
    )
        external
        pure
        returns (bytes memory)
    {
        return CircuitUtils.unpackFields2Bytes(fields, startIndex, paddedSize);
    }
}
