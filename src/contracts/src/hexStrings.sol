// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

// https://github.com/nalinbhardwaj/ethdosnumber/blob/main/ethdos-contracts/src/HexStrings.sol
library HexStrings {
  bytes16 internal constant ALPHABET = "0123456789abcdef";

  /// @notice Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
  /// @dev Credit to Open Zeppelin under MIT license https://github.com/OpenZeppelin/openzeppelin-contracts/blob/243adff49ce1700e0ecb99fe522fb16cff1d1ddc/contracts/utils/Strings.sol#L55
  function toHexString(uint256 value, uint256 length) public pure returns (string memory) {
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

  function toHexStringNoPrefix(uint256 value, uint256 length) public pure returns (string memory) {
    bytes memory buffer = new bytes(2 * length);
    for (uint256 i = buffer.length; i > 0; i--) {
      buffer[i - 1] = ALPHABET[value & 0xf];
      value >>= 4;
    }
    return string(buffer);
  }

  function toString(uint256 value) public pure returns (string memory) {
    return toString(abi.encodePacked(value));
  }

  function toString(bytes32 value) public pure returns (string memory) {
    return toString(abi.encodePacked(value));
  }

  function toString(address account) public pure returns (string memory) {
    return toString(abi.encodePacked(account));
  }

  function toString(bytes memory data) public pure returns (string memory) {
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
}
