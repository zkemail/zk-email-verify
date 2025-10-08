// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NoirUtils} from "../../../utils/NoirUtils.sol";

contract NoirUtilsHelper {
    // PACK FUNCTIONS

    function callPackBoundedVecU8(string memory input, uint256 numFields) external pure returns (bytes32[] memory) {
        return NoirUtils.packBoundedVecU8(input, numFields);
    }

    function callPackFieldsArray(string memory input, uint256 numFields) external pure returns (bytes32[] memory) {
        return NoirUtils.packFieldsArray(input, numFields);
    }

    // UNPACK FUNCTIONS

    function callUnpackBoundedVecU8(bytes32[] memory fields) external pure returns (string memory) {
        return NoirUtils.unpackBoundedVecU8(fields);
    }

    function callUnpackFieldsArray(bytes32[] memory fields) external pure returns (string memory) {
        return NoirUtils.unpackFieldsArray(fields);
    }
}
