// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

/**
 * @title CircomUtils
 * @notice Library for ZK circuit-related utilities including field element packing and proof processing
 * @dev This library provides functions for converting between byte arrays and field elements
 *      and other utilities needed for zero-knowledge proof circuit compatibility.
 */
library CircomUtils {
    using Bytes for bytes;

    /**
     * @notice Error thrown when the public inputs array length is not exactly 60
     * @dev The ZK circuit expects exactly 60 public inputs for verification
     */
    error InvalidPublicInputsLength();

    /**
     * @notice Error thrown when the data length is greater than the padded size
     * @dev The data should have the expected format and length
     */
    error InvalidDataLength();

    /**
     * @notice Packs byte arrays into field elements for ZK circuit compatibility
     * @param input The byte array to pack into field elements
     * @param paddedSize The target size after padding (must be larger than or equal to _bytes.length)
     * @return fields An array of field elements containing the packed byte data
     * @dev This function packs bytes into field elements by:
     *      1. Determining how many field elements are needed (31 bytes per field element)
     *      2. Packing bytes in little-endian order within each field element
     *      3. Padding with zeros if the input is shorter than paddedSize
     *      4. Ensuring the resulting field elements are compatible with ZK circuits
     *
     *      Each field element can contain up to 31 bytes to ensure the result stays below
     *      the BN128 curve order. Bytes are packed as: byte0 + (byte1 << 8) + (byte2 << 16) + ...
     */
    function packFieldsArray(bytes memory input, uint256 paddedSize) internal pure returns (bytes32[] memory fields) {
        if (input.length > paddedSize) revert InvalidDataLength();

        uint256 remain = paddedSize % 31;
        uint256 numFields = (paddedSize - remain) / 31;
        if (remain > 0) {
            numFields += 1;
        }
        fields = new bytes32[](numFields);
        uint256 idx = 0;
        uint256 byteVal = 0;
        for (uint256 i = 0; i < numFields; i++) {
            for (uint256 j = 0; j < 31; j++) {
                idx = i * 31 + j;
                if (idx >= paddedSize) {
                    break;
                }
                if (idx >= input.length) {
                    byteVal = 0;
                } else {
                    byteVal = uint256(uint8(input[idx]));
                }
                if (j == 0) {
                    fields[i] = bytes32(byteVal);
                } else {
                    fields[i] = bytes32(uint256(fields[i]) + (byteVal << (8 * j)));
                }
            }
        }
        return fields;
    }

    /**
     * @notice Packs a boolean value into a single field element
     * @param input The boolean value to pack
     * @return fields The packed field element
     */
    function packBool(bool input) internal pure returns (bytes32[] memory fields) {
        fields = new bytes32[](1);
        fields[0] = input ? bytes32(uint256(1)) : bytes32(uint256(0));
        return fields;
    }

    /**
     * @notice Unpacks field elements back to bytes
     * @param fields Array of field elements
     * @param paddedSize Original padded size of the bytes
     * @return result The unpacked bytes
     */
    function unpackFieldsArray(bytes32[] memory fields, uint256 paddedSize)
        internal
        pure
        returns (bytes memory result)
    {
        uint256 remain = paddedSize % 31;
        uint256 numFields = (paddedSize - remain) / 31;
        if (remain > 0) {
            numFields += 1;
        }

        result = new bytes(paddedSize);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < numFields; i++) {
            uint256 field = uint256(fields[i]);
            for (uint256 j = 0; j < 31 && resultIndex < paddedSize; j++) {
                result[resultIndex] = bytes1(uint8(field & 0xFF));
                field = field >> 8;
                resultIndex++;
            }
        }

        // Trim trailing zeros
        uint256 actualLength = 0;
        for (uint256 i = 0; i < result.length; i++) {
            if (result[i] != 0) {
                actualLength = i + 1;
            }
        }

        return result.slice(0, actualLength);
    }

    /**
     * @notice Unpacks a boolean value from public inputs
     * @param fields Array of field elements
     * @return result The unpacked boolean value
     */
    function unpackBool(bytes32[] calldata fields) internal pure returns (bool result) {
        return uint256(fields[0]) == 1;
    }
}
