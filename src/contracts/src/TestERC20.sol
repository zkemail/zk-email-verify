pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestEmailToken is ERC20 {
  constructor(uint256 initialSupply) ERC20("TestEmailToken", "TET") {
    _mint(msg.sender, initialSupply);
  }

  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }
}
