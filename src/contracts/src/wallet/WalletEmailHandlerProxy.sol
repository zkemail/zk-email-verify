// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "forge-std/console.sol";

interface InitializableInterface {
    function initialize() external;
}

contract WalletEmailHandlerUUPSProxy is ERC1967Proxy, UUPSUpgradeable, Initializable, Ownable {
    constructor(address logic, address admin, bytes memory data) ERC1967Proxy(logic, data) {
        _authorizeUpgrade(admin);
    }

    function initialize(address logic, address admin, bytes memory data) public initializer {
        InitializableInterface(logic).initialize(); // Initialize logic to avoid KeeperDAO hack
        _transferOwnership(admin);
    }

    function getImplementation() public view returns (address) {
        return _getImplementation();
    }

    function upgradeTo(address newImplementation) public override {
        require(msg.sender == _getAdmin() || tx.origin == _getAdmin(), "Unauthorized");
        _upgradeToAndCall(newImplementation, bytes(""), false);
    }

    function _authorizeUpgrade(address) internal override {
        require(msg.sender == _getAdmin() || tx.origin == _getAdmin(), "Unauthorized");
    }
}

contract WalletEmailHandlerProxy is TransparentUpgradeableProxy {
    constructor(address logic, address admin, bytes memory data) TransparentUpgradeableProxy(logic, admin, data) {}

    /**
     * @dev If caller is the admin process the call internally, otherwise transparently fallback to the proxy behavior
     */
    function _fallback() internal virtual override {
        if (msg.sender == _getAdmin()) {
            bytes memory ret;
            bytes4 selector = msg.sig;
            if (selector == ITransparentUpgradeableProxy.upgradeTo.selector) {
                super._fallback();
            } else if (selector == ITransparentUpgradeableProxy.upgradeToAndCall.selector) {
                super._fallback();
            } else if (selector == ITransparentUpgradeableProxy.changeAdmin.selector) {
                super._fallback();
            } else {
                (bool success, bytes memory result) = _implementation().delegatecall(msg.data);
                if (!success) {
                    assembly {
                        returndatacopy(0, 0, returndatasize())
                        revert(0, returndatasize())
                    }
                }
                assembly {
                    return(add(result, 0x20), mload(result))
                }
            }
        } else {
            super._fallback();
        }
    }

    function getImplementation() public view returns (address) {
        return _getImplementation();
    }

    function getAdmin() public view returns (address) {
        return _getAdmin();
    }

    function upgradeTo(address newImplementation) public {
        console.log("Admin");
        console.log(_admin());
        if (msg.sender == _admin() || tx.origin == _admin()) {
            _upgradeTo(newImplementation);
        }
    }
}
