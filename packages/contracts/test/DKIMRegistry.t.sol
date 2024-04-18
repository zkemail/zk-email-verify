// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "forge-std/src/Test.sol";
import "forge-std/src/console.sol";
import "../interfaces/IDKIMRegistry.sol";
import "../DKIMRegistry.sol";

/// @title ECDSAOwnedDKIMRegistry
/// @notice A DKIM Registry that could be updated by predefined ECDSA signer
contract TestDKIMRegistry is Test {
  DKIMRegistry public dkimRegistry;
  address public signer;

  constructor() {
      dkimRegistry = new DKIMRegistry(msg.sender);
      signer = msg.sender;
  }

  function test_setDKIM() public {
    vm.prank(signer);
    dkimRegistry.setDKIMPublicKeyHash("test.com", "a81273981273bce922");
    vm.stopPrank();
  }
}

