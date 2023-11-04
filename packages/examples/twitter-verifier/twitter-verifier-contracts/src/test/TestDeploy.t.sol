// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../script/DeployTwitter.s.sol";

contract TestDeploy is Test {
  Deploy deploy;

  function setUp() public {
    deploy = new Deploy();
  }

  function testRun() public {
    deploy.run();
  }
}
