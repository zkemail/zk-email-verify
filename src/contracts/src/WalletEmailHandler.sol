// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
// import "./base64.sol";
import "./StringUtils.sol";
import "./AutoApproveWallet.sol";
import "./TestERC20.sol";
import "./NFTSVG.sol";
import {Verifier} from "./Groth16VerifierWallet.sol";
import "./MailServer.sol";

contract VerifiedWalletEmail {
    using StringUtils for *;

    uint16 public constant packSize = 7; // 7 bytes in a packed item returned from circom

    uint16 public constant body_len = 4 * 4;
    uint16 public constant rsa_modulus_chunks_len = 17;
    uint16 public constant commitment_len = 1;
    uint16 public constant msg_len = body_len + rsa_modulus_chunks_len + commitment_len; // 34

    uint16 public constant header_len = msg_len - body_len;
    uint16 public constant addressIndexInSignals = msg_len - 1; // The last index is the commitment

    mapping(string => uint256[rsa_modulus_chunks_len]) public verifiedMailserverKeys;
    mapping(string => uint256) public balance;
    mapping(uint256 => bool) public nullifier;
    MailServer mailServer;
    Verifier public immutable verifier;
    TestEmailToken public testToken;

    mapping(bytes32 => address) public wallets;

    // Arguments are deployed contracts/addresses
    constructor(Verifier v, MailServer m, TestEmailToken t) {
        // Do dig TXT outgoing._domainkey.twitter.com to verify these.
        // This is the base 2^121 representation of that key.
        // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
        require(rsa_modulus_chunks_len + body_len + 1 == msg_len, "Variable counts are wrong!");
        verifier = v;
        mailServer = m;
        testToken = t;
    }

    // TODO: Make internal
    function moveTokens(bytes32 salt1, bytes32 salt2, uint256 amount) public {
        address wallet1 = getOrCreateWallet(salt1);
        address wallet2 = getOrCreateWallet(salt2);

        // Check for allowance and balance
        require(testToken.allowance(wallet1, address(this)) >= amount, "Allowance too low");
        require(testToken.balanceOf(wallet1) >= amount, "Insufficient balance to perform the transfer");
        testToken.transferFrom(wallet1, wallet2, amount);
    }

    function getOrCreateWallet(bytes32 salt) internal returns (address) {
        bytes32 hashedSalt = keccak256(abi.encodePacked(salt));
        address wallet = wallets[hashedSalt];
        if (wallet == address(0)) {
            // Create wallet
            bytes memory bytecode = type(AutoApproveWallet).creationCode;
            assembly {
                wallet := create2(0, add(bytecode, 0x20), mload(bytecode), hashedSalt)
            }
            console.log("Wallet index at:");
            console.logBytes32(hashedSalt);
            console.log("Wallet address created:", wallet);
            require(wallet != address(0), "Wallet creation failed");
            wallets[hashedSalt] = wallet;

            // TODO: Remove this mint, it's only for test token
            testToken.mint(wallet, 10 * 10 ** testToken.decimals()); // 10 tokens with 18 decimals

            // Initialize the wallet with the token address and approver
            AutoApproveWallet(wallet).initialize(address(testToken), address(this));
        }
        return wallet;
    }

    function convertEmailToIndex(string memory email) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(convertEmailToBytes(email)));
    }

    function convertEmailToBytes(string memory email) public pure returns (bytes32) {
        return bytes32(bytes(StringUtils.removeTrailingZeros(email)));
    }

    // TODO: When anon, it shouldn't be possible to get this via email, you have to pass in the salt
    function getBalance(string memory email) public view returns (uint256) {
        return testToken.balanceOf(wallets[convertEmailToIndex(email)]);
    }

    function transfer(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[msg_len] memory signals)
        public
    {
        // TODO no invalid signal check yet, which is fine since the zk proof does it
        // Checks: Verify proof and check signals
        // require(signals[0] == 1337, "invalid signals");

        // 3 public signals are the masked packed message bytes, 17 are the modulus.
        uint256[] memory bodySignals = new uint256[](body_len);
        uint256[] memory rsaModulusSignals = new uint256[](header_len);
        for (uint256 i = 0; i < body_len; i++) {
            bodySignals[i] = signals[i];
        }
        for (uint256 i = body_len; i < msg_len - 1; i++) {
            rsaModulusSignals[i - body_len] = signals[i];
        }

        // Check eth address committed to in proof matches msg.sender, to avoid doublespend and relayer-frontrunning-relayer-for-profit
        // require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

        // TODO: Note that this is buggy since it is malleable
        require(!nullifier[a[0]], "Value is already true");
        nullifier[a[0]] = true;

        // Check from/to email domains are correct [in this case, only from domain is checked]
        // Right now, we just check that any email was received from anyone at Twitter, which is good enough for now
        // We will upload the version with these domain checks soon!
        // require(_domainCheck(headerSignals), "Invalid domain");
        string memory fromEmail =
            StringUtils.convertPackedBytesToString(StringUtils.sliceArray(bodySignals, 0, 5), packSize * 4, packSize);
        string memory amount =
            StringUtils.convertPackedBytesToString(StringUtils.sliceArray(bodySignals, 5, 10), packSize * 4, packSize);
        string memory currency =
            StringUtils.convertPackedBytesToString(StringUtils.sliceArray(bodySignals, 10, 11), packSize * 4, packSize);
        string memory recipientEmail =
            StringUtils.convertPackedBytesToString(StringUtils.sliceArray(bodySignals, 11, 16), packSize * 4, packSize);

        string memory domain = StringUtils.getDomainFromEmail(fromEmail);
        console.log(domain);
        // Verify that the public key for RSA matches the hardcoded one
        for (uint256 i = body_len; i < msg_len - 1; i++) {
            require(mailServer.isVerified(domain, i - body_len, signals[i]), "Invalid: RSA modulus not matched");
        }
        require(verifier.verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first
        console.log("Proof passed!");

        // Print transfer data
        uint256 amountToTransfer = StringUtils.stringToUint(amount) * 10 ** testToken.decimals();
        console.log("Original from email", fromEmail);
        console.log("Original recipient email", recipientEmail);
        console.log("Original amount", amount);
        console.log("Original currency", currency);
        console.log("Transferring", amountToTransfer);
        console.log("From", fromEmail, "to", recipientEmail);

        // Effects: Send money
        // Transfer the tokens
        moveTokens(convertEmailToBytes(fromEmail), convertEmailToBytes(recipientEmail), amountToTransfer);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
        require(from == address(0), "Cannot transfer - VerifiedEmail is soulbound");
    }
}
