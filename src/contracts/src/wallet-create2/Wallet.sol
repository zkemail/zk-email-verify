pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Wallet {
    function transferERC20(address tokenAddress, address to, uint256 amount) public {
        require(msg.sender == address(this), "Caller is not the wallet");
        IERC20(tokenAddress).transfer(to, amount);
    }
}
