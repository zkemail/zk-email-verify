// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenRegistry is Ownable {
    // Define a structure that represents a token
    struct Token {
        address optimism;
        address arbitrum;
        address xdai;
        address goerli;
        address mainnet;
    }

    // Define a mapping from token names to their addresses on each chain
    mapping(string => Token) private tokens;
    mapping(uint256 => string) private chainIdToName;

    // Define the owner of the contract
    // address private owner;

    // TODO: Replace with Ownable
    // Ensure that only the owner can call certain functions
    // modifier onlyOwner() {
    //     require(msg.sender == owner, "Only the owner or proxy can call this function.");
    //     _;
    // }

    // Set the owner of the contract
    constructor() {
        // Initialize the mapping with some hardcoded addresses
        // TODO: Add RAI, and some other tokens
        tokens["DAI"] = Token({
            optimism: 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1,
            arbitrum: 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1,
            xdai: 0x44fA8E6f47987339850636F88629646662444217,
            goerli: 0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844,
            mainnet: 0x6B175474E89094C44Da98b954EedeAC495271d0F
        });
        tokens["USDC"] = Token({
            optimism: 0x7F5c764cBc14f9669B88837ca1490cCa17c31607,
            arbitrum: 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8,
            xdai: 0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83,
            goerli: 0x07865c6E87B9F70255377e024ace6630C1Eaa37F,
            mainnet: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        });
        tokens["WETH"] = Token({
            optimism: 0x4200000000000000000000000000000000000006,
            arbitrum: 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1,
            xdai: 0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1,
            goerli: 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6,
            mainnet: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
        });

        chainIdToName[0] = "mainnet";
        chainIdToName[10] = "optimism";
        chainIdToName[100] = "xdai";
        chainIdToName[42161] = "arbitrum";
        chainIdToName[5] = "goerli";
        chainIdToName[31337] = "goerli"; // Local foundry test chain goerli fork
    }

    function setProxyOwner(address proxyAddress) public onlyOwner {
        transferOwnership(proxyAddress);
    }

    // Return the address of a token on this chain
    function getTokenAddress(string memory tokenName) public view returns (address) {
        return getTokenAddress(tokenName, chainIdToName[getChainID()]);
    }

    // Return the address of a token on a specific chain
    function getTokenAddress(string memory tokenName, uint256 chainId) public view returns (address) {
        return getTokenAddress(tokenName, chainIdToName[chainId]);
    }

    // Return the address of a token on a specific chain
    function getTokenAddress(string memory tokenName, string memory chainName) public view returns (address) {
        if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("optimism"))) {
            return tokens[tokenName].optimism;
        } else if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("arbitrum"))) {
            return tokens[tokenName].arbitrum;
        } else if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("xdai"))) {
            return tokens[tokenName].xdai;
        } else if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("goerli"))) {
            return tokens[tokenName].goerli;
        } else if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("mainnet"))) {
            return tokens[tokenName].mainnet;
        } else {
            revert("Invalid chain name.");
        }
    }

    // Update the address of a token on a specific chain
    function setTokenAddress(string memory tokenName, address newAddress) public onlyOwner {
        return setTokenAddress(tokenName, chainIdToName[getChainID()], newAddress);
    }

    // Update the address of a token on a specific chain
    function setTokenAddress(string memory tokenName, string memory chainName, address newAddress) public onlyOwner {
        if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("optimism"))) {
            tokens[tokenName].optimism = newAddress;
        } else if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("arbitrum"))) {
            tokens[tokenName].arbitrum = newAddress;
        } else if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("xdai"))) {
            tokens[tokenName].xdai = newAddress;
        } else if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("goerli"))) {
            tokens[tokenName].goerli = newAddress;
        } else if (keccak256(abi.encodePacked(chainName)) == keccak256(abi.encodePacked("mainnet"))) {
            tokens[tokenName].mainnet = newAddress;
        } else {
            revert("Invalid chain name.");
        }
    }

    function getChainID() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }
}
