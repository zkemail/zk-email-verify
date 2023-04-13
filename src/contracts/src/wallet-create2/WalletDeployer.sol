pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Wallet.sol";

contract WalletDeployer {
    using Counters for Counters.Counter;

    Counters.Counter private _walletIndex;

    address private immutable _owner;
    bytes32 private constant _saltPrefix = "WalletDeployer";
    bytes32 private _bytecodeHash;

    mapping(uint256 => address) public wallets;

    constructor() {
        _owner = msg.sender;
        _bytecodeHash = keccak256(type(Wallet).creationCode);
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Caller is not the owner");
        _;
    }

    function deployWallet() public onlyOwner returns (address wallet) {
        bytes32 salt = keccak256(abi.encodePacked(_saltPrefix, _walletIndex.current()));
        wallet = Create2.deploy(0, salt, type(Wallet).creationCode);
        wallets[_walletIndex.current()] = wallet;
        _walletIndex.increment();
    }

    function getWalletAddress(uint256 index) public view returns (address wallet) {
        bytes32 salt = keccak256(abi.encodePacked(_saltPrefix, index));
        wallet = Create2.computeAddress(salt, _bytecodeHash);
    }

    function moveERC20(uint256 sourceIndex, uint256 destinationIndex, address tokenAddress, uint256 amount)
        public
        onlyOwner
    {
        require(wallets[sourceIndex] != address(0), "Source wallet not deployed");
        require(wallets[destinationIndex] != address(0), "Destination wallet not deployed");

        Wallet sourceWallet = Wallet(wallets[sourceIndex]);
        Wallet destinationWallet = Wallet(wallets[destinationIndex]);

        sourceWallet.transferERC20(tokenAddress, address(destinationWallet), amount);
    }
}
