// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "forge-std/console.sol";
import {Groth16Verifier} from "./Groth16VerifierWalletAnon.sol";
import "../utils/StringUtils.sol";
import "./AutoApproveWallet.sol";
import "./EmailWalletStorage.sol";
import "./TestERC20.sol";
import "../utils/NFTSVG.sol";
import "../utils/MailServer.sol";
import "./TokenRegistry.sol";

// Defines upgradable logic
// TODO: Change console.logs to emits
contract EmailWallet is
    EmailWalletStorage,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using StringUtils for *;

    uint16 public constant packSize = 30; // Bytes in a packed item returned from circom

    uint16 public constant body_len = 4 + 4;
    uint16 public constant rsa_modulus_chunks_len = 17;
    uint16 public constant commitment_len = 2;
    uint16 public constant msg_len =
        body_len + rsa_modulus_chunks_len + commitment_len; // 27

    uint16 public constant header_len = msg_len - body_len;
    uint16 public constant addressIndexInSignals = msg_len - 1; // The last index is the commitment
    uint16 public constant version = 1;
    Groth16Verifier public verifier;
    TestEmailToken public testToken;
    TokenRegistry public tokenRegistry;
    MailServer public mailServer;
    mapping(string => address) public defaultVerifiers;

    event TransferInfo(
        uint256 indexed fromSalt,
        uint256 indexed toSalt,
        uint256 amount,
        string currency
    );

    // Note that the data lives in the EmailWalletStorage contract
    // Arguments are deployed contracts/addresses

    function initialize(
        Groth16Verifier v,
        MailServer m,
        TestEmailToken t,
        TokenRegistry r
    ) public initializer {
        // Do dig TXT outgoing._domainkey.twitter.com to verify these.
        // This is the base 2^121 representation of that key.
        // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
        require(
            rsa_modulus_chunks_len + body_len + commitment_len == msg_len,
            "Variable counts are wrong!"
        );

        verifier = v;
        mailServer = m;
        testToken = t;
        tokenRegistry = r;

        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getTokenRegistry() public view returns (address) {
        return address(tokenRegistry);
    }

    // Wrapper function for TokenRegistry.getTokenAddress()
    function getTokenAddress(
        string memory tokenName
    ) public view returns (address) {
        return tokenRegistry.getTokenAddress(tokenName);
    }

    // Wrapper function for TokenRegistry.updateTokenAddress()
    function setTokenAddress(
        string memory tokenName,
        address tokenAddress
    ) public onlyOwner {
        tokenRegistry.setTokenAddress(tokenName, tokenAddress);
    }

    // Function to get individual mailserver keys
    function getMailserverKey(
        string memory domain,
        uint256 index
    ) public returns (uint256) {
        return mailServer.getMailserverKey(domain, index);
    }

    // Function to set individual mailserver keys
    function setMailServerKey(
        string memory domain,
        uint256 index,
        uint256 val
    ) public onlyOwner {
        return mailServer.editMailserverKey(domain, index, val);
    }

    function commandStrings() public pure returns (string[] memory) {
        string[] memory commands = new string[](2);
        commands[0] = "send";
        commands[1] = "transfer";
        return commands;
    }

    // NOTE: This is only for emergency ejects in testing deployments
    function upgradeVerifier(Groth16Verifier v) public onlyOwner {
        verifier = v;
    }

    // NOTE: This is only for emergency ejects in testing deployments
    function migrateAllToken(
        uint256 fromSalt,
        uint256 toSalt,
        address token
    ) public onlyOwner virtual {
        address fromWallet = getOrCreateWallet(fromSalt);
        uint256 balance = IERC20(token).balanceOf(fromWallet);
        moveTokens(fromSalt, toSalt, balance, token);
    }

    // NOTE: This is only for emergency ejects in testing deployments
    function migrateAllToken(
        uint256 fromSalt,
        uint256 toSalt,
        string memory tokenName
    ) public onlyOwner {
        address tokenAddress = tokenRegistry.getTokenAddress(
            tokenName,
            getChainID()
        );
        migrateAllToken(fromSalt, toSalt, tokenAddress);
    }

    // NOTE: This is only for emergency ejects in testing deployments
    function migrateAllToken(
        bytes32 fromSalt,
        address toWallet,
        string memory tokenName
    ) public onlyOwner {
        address tokenAddress = tokenRegistry.getTokenAddress(
            tokenName,
            getChainID()
        );
        migrateAllToken(fromSalt, toWallet, tokenAddress);
    }

    // NOTE: This is only for emergency ejects in testing deployments
    function migrateAllToken(
        bytes32 fromSalt,
        address toWallet,
        address token
    ) public onlyOwner virtual {
        address fromWallet = getOrCreateWallet(fromSalt);
        uint256 amount = IERC20(token).balanceOf(fromWallet);
        IERC20 tokenToUse = token == address(0) ? testToken : IERC20(token);
        require(
            tokenToUse.allowance(fromWallet, address(this)) >= amount,
            "Allowance too low"
        );
        require(
            tokenToUse.balanceOf(fromWallet) >= amount,
            "Insufficient balance to perform the transfer"
        );
        tokenToUse.transferFrom(fromWallet, toWallet, amount);
    }

    /**
     * @dev Moves tokens from one wallet to another using the provided salts.
     * @param fromSalt The salt used to derive the sender's wallet address.
     * @param toSalt The salt used to derive the recipient's wallet address.
     * @param amount The amount of tokens to transfer.
     * @param token The address of the token to transfer. 0 if should use test token.
     */
    function moveTokens(
        uint256 fromSalt,
        uint256 toSalt,
        uint256 amount,
        address token
    ) internal {
        address toWallet = getOrCreateWallet(bytes32(toSalt));
        address fromWallet = getOrCreateWallet(bytes32(fromSalt));
        moveTokens(fromWallet, toWallet, amount, token);
    }

    /**
     * @dev Moves tokens from one wallet to another using the provided wallet addresses.
     * @param fromWallet The wallet address of the sender.
     * @param toWallet The wallet address of the recipient.
     * @param amount The amount of tokens to transfer.
     * @param token The address of the token to transfer. 0 if should use test token.
     */
    function moveTokens(
        address fromWallet,
        address toWallet,
        uint256 amount,
        address token
    ) internal {
        IERC20 tokenToUse = token == address(0) ? testToken : IERC20(token);

        if (!isContractDeployed(fromWallet)) {
            revert("From wallet is not deployed");
        }
        // Enable the handler to move your tokens
        AutoApproveWallet(fromWallet).approveToken(token, amount);

        // Check for allowance and balance
        require(
            tokenToUse.allowance(fromWallet, address(this)) >= amount,
            "Allowance too low"
        );
        require(
            tokenToUse.balanceOf(fromWallet) >= amount,
            "Insufficient balance to perform the transfer"
        );

        console.log("Transferring tokens");
        tokenToUse.transferFrom(fromWallet, toWallet, amount);
    }

    /**
     * @dev Returns the wallet address associated with the given salt. If the wallet does not exist, it creates a new one and gives it 10 TestTokens.
     * @param salt The salt used to derive the wallet address.
     * @return wallet The wallet address associated with the given salt.
     */
    function getOrCreateWallet(uint256 salt) public returns (address) {
        return getOrCreateWallet(bytes32(salt));
    }

    /**
     * @dev Returns the wallet address associated with the given salt. If the wallet does not exist, it creates a new one and gives it 10 TestTokens.
     * @param salt The salt used to derive the wallet address.
     * @return wallet The wallet address associated with the given salt.
     */
    function getOrCreateWallet(bytes32 salt) public returns (address) {
        return getOrCreateWallet(salt, false);
    }

    /**
     * @dev Returns the wallet address associated with the given salt. If the wallet does not exist, it creates a new one and gives it 10 TestTokens.
     * @param salt The salt used to derive the wallet address.
     * @param allowedToCreateWallet A boolean flag indicating if a new wallet is authorized to be created if it does not exist. True if the message id matches an email.
     * @return wallet The wallet address associated with the given salt.
     */
    function getOrCreateWallet(
        uint256 salt,
        bool allowedToCreateWallet
    ) internal returns (address) {
        return getOrCreateWallet(bytes32(salt), allowedToCreateWallet);
    }

    /**
     * @dev Returns the wallet address associated with the given salt. If the wallet does not exist and allowedToCreateWallet is true, it creates a new one and gives it 10 TestTokens.
     * @param salt The salt used to derive the wallet address.
     * @param allowedToCreateWallet A boolean flag indicating if a new wallet is authorized to be created if it does not exist.
     * @return wallet The wallet address associated with the given salt.
     */
    function getOrCreateWallet(
        bytes32 salt,
        bool allowedToCreateWallet
    ) internal returns (address) {
        // Calculate the address
        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(type(AutoApproveWallet).creationCode)
        );
        address predictedAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            (bytes1(0xff)),
                            address(this),
                            salt,
                            bytecodeHash
                        )
                    )
                )
            )
        );

        if (isContractDeployed(predictedAddress)) {
            console.log("Wallet already exists!");
            return predictedAddress;
        } else {
            // Initially, only a message ID authorized by an email is allowed to create a wallet
            // Now that we ignore it, anyone can make a wallet with any message-id
            console.log("Is this email the source of the message id?");
            console.log(allowedToCreateWallet);
            // Create wallet
            bytes memory bytecode = type(AutoApproveWallet).creationCode;
            address wallet;
            assembly {
                wallet := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            }
            require(wallet != address(0), "Wallet creation failed");
            wallets[salt] = wallet;

            console.log("Wallet index at:");
            console.logBytes32(salt);

            // Initialize the wallet with some test token and this as the approver
            console.log("Wallet address created:", wallet);
            testToken.mint(wallet, 100 * 10 ** testToken.decimals()); // 10 tokens with 18 decimals
            AutoApproveWallet(wallet).initialize();
            AutoApproveWallet(wallet).approveAllToken(address(testToken));
            console.log("Wallet initialized with 100 test tokens");
            return wallet;
        }
        // console.log("Warning: Returning uninitialized wallet. Money can only be recovered by submitting an email authorizing this address with this salt.");
        return predictedAddress;
    }

    function isContractDeployed(address _address) public view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_address)
        }
        console.log("Size:");
        console.log(size);
        return (size > 0);
    }

    // EMAIL MAPPING HELPER FUNCTIONS: Calling this functions will break your anonymity to the responding light/full node.
    // function convertEmailToIndex(string memory email) public pure returns (bytes32) {
    //     // EDIT: Take MIMC here.
    //     return keccak256(abi.encodePacked(convertEmailToBytes(email)));
    // }

    // function convertEmailToBytes(string memory email) public pure returns (bytes32) {
    //     return bytes32(bytes(StringUtils.removeTrailingZeros(email)));
    // }

    // function getBalance(string memory email, string memory messageIDSalt) public view returns (uint256) {
    //     return testToken.balanceOf(wallets[convertEmailToIndex(email)]);
    // }

    function getBalance(
        uint256 salt,
        string memory tokenName
    ) public view returns (uint256) {
        address tokenAddress = tokenRegistry.getTokenAddress(
            tokenName,
            getChainID()
        );
        return IERC20(tokenAddress).balanceOf(wallets[bytes32(salt)]);
    }

    function isStringInArray(
        string memory value,
        string[] memory array
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < array.length; i++) {
            if (StringUtils.stringEq(value, array[i])) {
                return true;
            }
        }
        return false;
    }

    // MAIN TRANSFER FUNCTION
    /**
     * @dev Transfers tokens from one email wallet to another using zk-SNARKs to maintain privacy.
     * @param a The first element of the zk-SNARK proof.
     * @param b The second element of the zk-SNARK proof.
     * @param c The third element of the zk-SNARK proof.
     * @param signals The public signals used in the zk-SNARK proof.
     */

    function transfer(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[msg_len] memory signals
    ) public {
        // Checks: Verify proof and check signals
        // require(signals[0] == 1337, "invalid signals");

        // 3 public signals are the masked packed message bytes, 17 are the modulus.
        uint256[] memory bodySignals = new uint256[](body_len);
        uint256[] memory rsaModulusSignals = new uint256[](header_len);
        for (uint256 i = 0; i < body_len; i++) {
            bodySignals[i] = signals[i];
        }
        for (uint256 i = body_len; i < msg_len - commitment_len; i++) {
            rsaModulusSignals[i - body_len] = signals[i];
        }

        // TODO: Check eth address committed to in proof matches msg.sender, to avoid doublespend and relayer-frontrunning-relayer-for-profit
        // require(address(uint160(signals[addressIndexInSignals])) == msg.sender, "Invalid address");

        // TODO: Must edit generate_input to have a unique value for "address" for this nullifier to pass
        require(
            !nullifier[signals[msg_len - commitment_len]],
            "Value is already true"
        );
        nullifier[signals[msg_len - 1]] = true;

        // Check from/to email domains are correct [in this case, only from domain is checked]
        // We will upload the version with these domain checks soon!
        // require(_domainCheck(headerSignals), "Invalid domain");
        string memory command = StringUtils.convertPackedByteToString(bodySignals[0], packSize);
        string memory amount = StringUtils.convertPackedByteToString(bodySignals[1], packSize);
        string memory currency = StringUtils.convertPackedByteToString(bodySignals[3], packSize);
        bool canCreateFromWallet = bodySignals[4] == 1;
        uint256 fromSalt = bodySignals[5];
        bool canCreateToWallet = bodySignals[6] == 1;
        uint256 toSalt = bodySignals[7];

        // Require that the user is calling with the correct command
        require(
            isStringInArray(StringUtils.lower(command), commandStrings()),
            "Invalid command"
        );

        uint256 additionalCommittedInfo = signals[msg_len - commitment_len];
        string memory domain = "gmail.com"; // Change this later to actually parse the domain as the first half

        // Verify that the public key for RSA matches the hardcoded one
        require(verifier.verifyProof(a, b, c, signals), "Invalid Proof"); // checks effects iteractions, this should come first
        for (uint256 i = body_len; i < msg_len - commitment_len; i++) {
            require(
                mailServer.isVerified(domain, i - body_len, signals[i]),
                "Invalid: RSA modulus not matched"
            );
        }

        // Calculate and emit transfer data
        address tokenAddress = tokenRegistry.getTokenAddress(
            StringUtils.upper(currency),
            getChainID()
        );
        uint256 amountToTransfer = StringUtils.stringToUint(amount) *
            10 ** ERC20(tokenAddress).decimals();
        emit TransferInfo(fromSalt, toSalt, amountToTransfer, currency);

        // Effects: Send money
        // Generate wallets and transfer the tokens
        address fromWallet = getOrCreateWallet(
            bytes32(fromSalt),
            canCreateFromWallet
        );
        address toWallet = getOrCreateWallet(
            bytes32(toSalt),
            canCreateToWallet
        );
        moveTokens(
            fromWallet,
            toWallet,
            amountToTransfer,
            address(tokenAddress)
        );
    }

    function getChainID() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        assert(chainId == block.chainid);
        return chainId;
    }
}
