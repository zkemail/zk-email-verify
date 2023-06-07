// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import "forge-std/console.sol";
import "./StringUtils.sol";
import "./AutoApproveWallet.sol";
import "./TestERC20.sol";
import "./NFTSVG.sol";
import {Verifier} from "./Groth16VerifierWalletAnon.sol";
import "./MailServer.sol";

// NOTE: is Ownable is only for emergency ejects in testing deployments
contract WalletEmailHandlerStorage {
    // mapping(string => uint256) public balance;
    mapping(uint256 => bool) public nullifier;
    mapping(bytes32 => address) public wallets;
}
