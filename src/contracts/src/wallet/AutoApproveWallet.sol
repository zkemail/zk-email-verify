// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "forge-std/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AutoApproveWallet is Ownable, Initializable {
    uint256 constant MAX_UINT256 = type(uint256).max;
    uint256 public constant version = 1;
    mapping(string => address) public customVerifiers;
    
    function initialize() public onlyOwner initializer {}

    function approveAllToken(address tokenAddress) public onlyOwner {
        approveTokenFor(tokenAddress, msg.sender, MAX_UINT256);
    }

    function approveToken(address tokenAddress, uint256 amount) public onlyOwner {
        approveTokenFor(tokenAddress, msg.sender, amount);
    }

    function approveTokenFor(address tokenAddress, address approver, uint256 amount) public onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.approve(approver, amount);
    }

    // These are here as placeholders, but eventually can gate withdraws from the account
    function setVerifier(string memory command, address verifier) public onlyOwner {
        customVerifiers[command] = verifier;
    }

    // These are here as placeholders, but eventually can gate withdraws from the account
    function getVerifier(string memory command) public view returns (address) {
        return customVerifiers[command];
    }
}
