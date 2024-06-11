// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// https://eips.ethereum.org/EIPS/eip-1271
contract ExampleERC1271 is IERC1271, Ownable {
    using ECDSA for *;

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Verifies that the signer is the owner of the signing contract.
     */
    function isValidSignature(
        bytes32 _hash,
        bytes calldata _signature
    ) external view override returns (bytes4) {
        // Validate signatures
        if (_hash.recover(_signature) == owner()) {
            return 0x1626ba7e;
        } else {
            return 0xffffffff;
        }
    }
}
