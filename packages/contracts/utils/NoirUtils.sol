// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

uint256 constant FIELD_BYTES = 31;

library NoirUtils {
    error InvalidLength();

    function packBoundedVecU8(string memory input, uint256 numFields) internal pure returns (bytes32[] memory) {
        bytes memory strBytes = bytes(input);

        // numFields includes the length field, therefore length should be less than numFields
        if (strBytes.length >= numFields) revert InvalidLength();

        bytes32[] memory result = new bytes32[](numFields);

        // First fields are the data
        for (uint256 i = 0; i < strBytes.length; i++) {
            result[i] = bytes32(uint256(uint8(strBytes[i])));
        }
        // Other fields are empty

        // Last element is the length
        result[numFields - 1] = bytes32(strBytes.length);
        return result;
    }

    function packFieldsArray(string memory input, uint256 numFields) internal pure returns (bytes32[] memory) {
        bytes memory strBytes = bytes(input);

        if (strBytes.length > numFields * FIELD_BYTES) revert InvalidLength();

        bytes32[] memory fieldElements = new bytes32[](numFields);

        for (uint256 i = 0; i < numFields; i++) {
            uint256 start = i * FIELD_BYTES;
            uint256 field = 0;

            for (uint256 j = 0; j < FIELD_BYTES; j++) {
                if (start + j < strBytes.length) {
                    // LSB first
                    field |= uint256(uint8(strBytes[start + j])) << (8 * j);
                } else {
                    // Padding with 0x00 (already zeroed by default)
                    break;
                }
            }

            fieldElements[i] = bytes32(field);
        }

        return fieldElements;
    }

    function unpackBoundedVecU8(bytes32[] memory fields) internal pure returns (string memory) {
        // BoundedVec stores the length of the array in the last element
        uint256 length = uint256(fields[fields.length - 1]);
        // Create a new bytes array of the correct length
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            // u8 is 8 bits, so we need to take the least-significant byte of each bytes32
            result[i] = bytes1(uint8(uint256(fields[i])));
        }
        return string(result);
    }

    function unpackFieldsArray(bytes32[] memory fields) internal pure returns (string memory) {
        uint256 totalBytes = fields.length * FIELD_BYTES;
        bytes memory result = new bytes(totalBytes);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < fields.length; i++) {
            uint256 field = uint256(fields[i]); // Convert bytes32 to uint256

            // Extract FIELD_BYTES bytes in little-endian order (LSB first)
            for (uint256 j = 0; j < FIELD_BYTES && resultIndex < totalBytes; j++) {
                result[resultIndex++] = bytes1(uint8(field));
                field >>= 8;
            }
        }

        // Trim trailing 0x00 bytes (preserve internal 0x00s)
        uint256 actualLength = 0;
        for (uint256 i = 0; i < result.length; i++) {
            if (result[i] != 0) {
                actualLength = i + 1;
            }
        }

        // Create trimmed byte array
        bytes memory trimmed = new bytes(actualLength);
        for (uint256 i = 0; i < actualLength; i++) {
            trimmed[i] = result[i];
        }

        return string(trimmed);
    }
}
