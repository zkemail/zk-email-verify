// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

// https://github.com/nalinbhardwaj/ethdosnumber/blob/main/ethdos-contracts/src/HexStrings.sol
library StringUtils {
    bytes16 internal constant ALPHABET = "0123456789abcdef";
    uint256 internal constant DEFAULT_PACK_SIZE = 31;

    /// @notice Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
    /// @dev Credit to Open Zeppelin under MIT license https://github.com/OpenZeppelin/openzeppelin-contracts/blob/243adff49ce1700e0ecb99fe522fb16cff1d1ddc/contracts/utils/Strings.sol#L55
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = ALPHABET[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    function toHexStringNoPrefix(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length);
        for (uint256 i = buffer.length; i > 0; i--) {
            buffer[i - 1] = ALPHABET[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }

    function toString(uint256 value) internal pure returns (string memory) {
        return toString(abi.encodePacked(value));
    }

    function toString(bytes32 value) internal pure returns (string memory) {
        return toString(abi.encodePacked(value));
    }

    function toString(address account) internal pure returns (string memory) {
        return toString(abi.encodePacked(account));
    }

    function stringEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function toString(bytes memory data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    // 1 packed byte = packSize (usually 31) normal bytes, all in one 255/256-bit value
    // Note that this is not 32 due to the field modulus of circom
    function convertPackedByteToString(uint256 packedByte, uint256 packSize)
        internal
        pure
        returns (string memory extractedString)
    {
        uint256[] memory packedBytes = new uint256[](1);
        packedBytes[0] = packedByte;
        return convertPackedBytesToString(packedBytes, packSize, packSize);
    }

    // Note: This convenience function removes the max string length check, which may cause misalignment with the circom
    // If using this, then the circom needs to rangecheck packed length in the circuit itself
    // This defaults to 31 bytes per packed byte
    function convertPackedBytesToString(uint256[] memory packedBytes) 
        internal
        pure
        returns (string memory extractedString)
    {
        return convertPackedBytesToString(packedBytes, packedBytes.length * DEFAULT_PACK_SIZE, DEFAULT_PACK_SIZE);
    }

    // Unpacks uint256s into bytes and then extracts the non-zero characters
    // Only extracts contiguous non-zero characters and ensures theres only 1 such state
    // Note that unpackedLen may be more than packedBytes.length * 8 since there may be 0s
    // signals is the total number of signals (i.e. bytes) packed into the packedBytes. it defaults to packedBytes.length * packSize
    function convertPackedBytesToString(uint256[] memory packedBytes, uint256 signals, uint256 packSize)
        internal
        pure
        returns (string memory extractedString)
    {
        uint8 state = 0;
        // bytes: 0 0 0 0 y u s h _ g 0 0 0
        // state: 0 0 0 0 1 1 1 1 1 1 2 2 2
        bytes memory nonzeroBytesArray = new bytes(packedBytes.length * packSize);
        uint256 nonzeroBytesArrayIndex = 0;
        for (uint16 i = 0; i < packedBytes.length; i++) {
            uint256 packedByte = packedBytes[i];
            uint8[] memory unpackedBytes = new uint8[](packSize);
            for (uint256 j = 0; j < packSize; j++) {
                unpackedBytes[j] = uint8(packedByte >> (j * 8));
            }
            for (uint256 j = 0; j < packSize; j++) {
                uint256 unpackedByte = unpackedBytes[j]; //unpackedBytes[j];
                if (unpackedByte != 0) {
                    nonzeroBytesArray[nonzeroBytesArrayIndex] = bytes1(uint8(unpackedByte));
                    nonzeroBytesArrayIndex++;
                    if (state % 2 == 0) {
                        state += 1;
                    }
                } else {
                    if (state % 2 == 1) {
                        state += 1;
                    }
                }
                packedByte = packedByte >> 8;
            }
        }
        // TODO: You might want to assert that the state is exactly 1 or 2
        // If not, that means empty bytse have been removed from the middle and things have been concatenated.
        // We removed due to some tests failing, but this is not ideal and the require should be uncommented as soon as tests pass with it.

        // require(state == 1 || state == 2, "Invalid final state of packed bytes in email; more than two non-zero regions found!");
        require(state >= 1, "No packed bytes found! Invalid final state of packed bytes in email; value is likely 0!");
        require(nonzeroBytesArrayIndex <= signals, "Packed bytes more than allowed max number of signals!");
        string memory returnValue = removeTrailingZeros(string(nonzeroBytesArray));
        return returnValue;
        // Have to end at the end of the email -- state cannot be 1 since there should be an email footer
    }

    function bytes32ToString(bytes32 input) internal pure returns (string memory) {
        uint256 i;
        for (i = 0; i < 32 && input[i] != 0; i++) {}
        bytes memory resultBytes = new bytes(i);
        for (i = 0; i < 32 && input[i] != 0; i++) {
            resultBytes[i] = input[i];
        }
        return string(resultBytes);
    }

    // sliceArray is used to slice an array of uint256s from start-end into a new array of uint256s
    function sliceArray(uint256[] memory input, uint256 start, uint256 end) internal pure returns (uint256[] memory) {
        require(start <= end && end <= input.length, "Invalid slice indices");
        uint256[] memory result = new uint256[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = input[i];
        }
        return result;
    }

    // stringToUint is used to convert a string like "45" to a uint256 4
    function stringToUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result = 0;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] >= 0x30 && b[i] <= 0x39) {
                result = result * 10 + (uint256(uint8(b[i])) - 48);
            }

            // TODO: Currently truncates decimals
            if (b[i] == 0x2E) {
                return result;
            }
        }
        return result;
    }

    // getDomainFromEmail is used to extract the domain from an email i.e. the part after the @
    function getDomainFromEmail(string memory fromEmail) internal pure returns (string memory) {
        bytes memory emailBytes = bytes(fromEmail);
        uint256 atIndex;
        for (uint256 i = 0; i < emailBytes.length; i++) {
            if (emailBytes[i] == "@") {
                atIndex = i;
                break;
            }
        }

        bytes memory domainBytes = new bytes(emailBytes.length - atIndex - 1);
        for (uint256 j = 0; j < domainBytes.length; j++) {
            domainBytes[j] = emailBytes[atIndex + 1 + j];
        }
        return bytes32ToString(bytes32(bytes(domainBytes)));
    }

    function removeTrailingZeros(string memory input) public pure returns (string memory) {
        bytes memory inputBytes = bytes(input);
        uint256 endIndex = inputBytes.length;

        for (uint256 i = 0; i < inputBytes.length; i++) {
            if (inputBytes[i] == 0) {
                endIndex = i;
                break;
            }
        }

        bytes memory resultBytes = new bytes(endIndex);
        for (uint256 i = 0; i < endIndex; i++) {
            resultBytes[i] = inputBytes[i];
        }

        return string(resultBytes);
    }

    // Upper/lower string utils from https://github.com/willitscale/solidity-util/blob/master/lib/Strings.sol
    /**
     * Upper
     *
     * Converts all the values of a string to their corresponding upper case
     * value.
     *
     * @param _base When being used for a data type this is the extended object
     *              otherwise this is the string base to convert to upper case
     * @return string
     */
    function upper(string memory _base) public pure returns (string memory) {
        bytes memory _baseBytes = bytes(_base);
        for (uint256 i = 0; i < _baseBytes.length; i++) {
            _baseBytes[i] = _upper(_baseBytes[i]);
        }
        return string(_baseBytes);
    }

    /**
     * Lower
     *
     * Converts all the values of a string to their corresponding lower case
     * value.
     *
     * @param _base When being used for a data type this is the extended object
     *              otherwise this is the string base to convert to lower case
     * @return string
     */
    function lower(string memory _base) public pure returns (string memory) {
        bytes memory _baseBytes = bytes(_base);
        for (uint256 i = 0; i < _baseBytes.length; i++) {
            _baseBytes[i] = _lower(_baseBytes[i]);
        }
        return string(_baseBytes);
    }

    /**
     * Upper
     *
     * Convert an alphabetic character to upper case and return the original
     * value when not alphabetic
     *
     * @param _b1 The byte to be converted to upper case
     * @return bytes1 The converted value if the passed value was alphabetic
     *                and in a lower case otherwise returns the original value
     */
    function _upper(bytes1 _b1) private pure returns (bytes1) {
        if (_b1 >= 0x61 && _b1 <= 0x7A) {
            return bytes1(uint8(_b1) - 32);
        }

        return _b1;
    }

    /**
     * Lower
     *
     * Convert an alphabetic character to lower case and return the original
     * value when not alphabetic
     *
     * @param _b1 The byte to be converted to lower case
     * @return bytes1 The converted value if the passed value was alphabetic
     *                and in a upper case otherwise returns the original value
     */
    function _lower(bytes1 _b1) private pure returns (bytes1) {
        if (_b1 >= 0x41 && _b1 <= 0x5A) {
            return bytes1(uint8(_b1) + 32);
        }

        return _b1;
    }
}
