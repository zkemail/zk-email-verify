// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EmailWalletStorage {
    mapping(uint256 => bool) public nullifier;
    mapping(bytes32 => address) public wallets;
}
