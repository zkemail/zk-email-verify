// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ExampleOwnable is Ownable {
    constructor(address _owner) Ownable(_owner) { }
}
