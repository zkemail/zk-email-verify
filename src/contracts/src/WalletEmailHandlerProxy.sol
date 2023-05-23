// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract WalletEmailHandlerProxy is TransparentUpgradeableProxy {
    constructor(address logic, address admin, bytes memory data)
        TransparentUpgradeableProxy(logic, admin, data)
    {}
}
