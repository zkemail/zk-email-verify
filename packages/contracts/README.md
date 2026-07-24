# @zk-email/contracts

## DKIMRegistry.sol

`DKIMRegistry.sol` is a Solidity contract within the `@zk-email/contracts` package, functioning as a registry for storing hashes of DKIM public keys associated with particular domains.

<details>
<summary><b>Details</b></summary>

1. **Registering DKIM Public Key Hashes**: Developers can use the contract to register new hashes of DKIM public keys for a domain, so that any email sent from the domain can be verified against the blockchain-stored hash.

2. **Validating DKIM Public Key Hashes**: The contract allows for the validation of a registered DKIM public key hash. This helps verify if the public key in an email matches the one registered in the blockchain for the domain, confirming the email's authenticity.

3. **Revoking Compromised Keys**: In the event of a security breach or compromise of a private key, developers can revoke the associated DKIM public key hash to prevent misuse.

For a detailed overview of its functionalities, please refer to the source file: [DKIMRegistry.sol](./DKIMRegistry.sol)

</details>

## UserOverrideableDKIMRegistry.sol

`UserOverrideableDKIMRegistry.sol` is a Solidity contract within the `@zk-email/contracts` package.
This functions similarly to [DKIMRegistry](./DKIMRegistry.sol), but it allows users to set their own public keys. Even if the main authorizer, who is the contract owner, has already approved a public key, the user's signature is still required for setting it until the predetermined delay time has passed. Additionally, the public key can be revoked by the signature of either the user or the main authorizer alone.

[UserOverrideableDKIMRegistry.sol](./UserOverrideableDKIMRegistry.sol)

## StringUtils.sol

`StringUtils.sol` is a Solidity library that offers a range of string manipulation functions, including conversion between bytes and strings, and numerical string operations, for use across the `@zk-email/contracts` package.

<details>
<summary><b>Details</b></summary>

#### Converting Values to Strings

- **To Hex String**: Convert a `uint256` to its ASCII `string` hexadecimal representation.

```solidity
string memory hexString = StringUtils.toHexString(12345, 4);
// hexString will be "0x3039"
```

- **To Hex String Without Prefix**: Similar to `toHexString` but without the "0x" prefix.

```solidity
string memory hexStringNoPrefix = StringUtils.toHexStringNoPrefix(12345, 4);
// hexStringNoPrefix will be "3039"
```

- **To String from Various Types**: Convert `uint256`, `bytes32`, or `address` to a string.

```solidity
string memory uintToString = StringUtils.toString(uint256(12345));
string memory bytesToString = StringUtils.toString(bytes32("data"));
string memory addressToString = StringUtils.toString(address(0x123));
```

#### String Comparisons

- **String Equality**: Check if two strings are equal.

```solidity
bool isEqual = StringUtils.stringEq("hello", "hello");
// isEqual will be true
```

#### Advanced String Manipulations

- **Remove Trailing Zeros**: Trims trailing zeros from a string representation of bytes.

```solidity
string memory trimmedString = StringUtils.removeTrailingZeros("hello\x00\x00");
// trimmedString will be "hello"
```

- **Convert Packed Bytes to String**: Unpacks `uint256` values into a string, useful for handling compact data representations. 1 packed byte = 31 normal bytes.
- **Upper and Lower Case Conversion**: Convert a string to all uppercase or lowercase.

```solidity
string memory upperString = StringUtils.upper("hello"); // "HELLO"
string memory lowerString = StringUtils.lower("HELLO"); // "hello"
```

</details>

---

## Deployment migration notes (Hardhat Ignition)

The following deployment flow is now used for this package, aligned with the sdk-images contracts deployment approach.

### Environment variables

Copy `.env.example` to `.env` and fill in values:

| Variable            | Required              | Description                                                   |
| ------------------- | --------------------- | ------------------------------------------------------------- |
| `PRIVATE_KEY`       | Yes                   | EOA private key used for deployment transactions.             |
| `OWNER`             | Yes                   | Owner address passed to `DKIMRegistry` constructor.           |
| `RPC_URL`           | Optional              | Global RPC override for configured networks.                  |
| `ETHERSCAN_API_KEY` | For verification only | API key for explorer verification (for example Base Sepolia). |

### Deploying with Hardhat Ignition

Deployment is handled through `hh-ignition/modules/DKIMRegistry.ts`.

Install dependencies:

```bash
yarn
```

Build:

```bash
yarn build
```

Deploy (network values come from `hardhat.config.ts`, for example `84532` for Base Sepolia, `420420417` for Polkadot Hub Testnet, or `11155111` for Ethereum Sepolia):

```bash
yarn deploy 84532
```

RPC selection precedence is: `RPC_URL` (global override) -> default RPC URL in `hardhat.config.ts`.

Verify contracts for the same deployment:

```bash
yarn verify chain-84532
```

Hardhat Ignition stores deployment artifacts under `hh-ignition/deployments`, and verification uses those deployment IDs.

> Note: Source-code verification is **not currently possible for Polkadot Hub (PolkaVM) deployments.** The contract is compiled to PolkaVM/RISC-V bytecode by the `resolc` compiler, and neither the block explorer nor the Hardhat verify tooling supports resolc verification yet.
>
> This is a known gap in the PolkaVM tooling, not a problem with the deployment. A deployed contract is still fully visible on Blockscout (address, bytecode, transactions) and can be exercised through its read/write methods. Verification can be revisited once resolc support lands in the explorer and Hardhat plugin.
>
> EVM networks (Base Sepolia, Ethereum Sepolia) are verified normally through Etherscan-compatible APIs.

### Current [`DKIMRegistry`](./src/DKIMRegistry.sol) deployments

Canonical deployed addresses are tracked here. Ignition deployment artifacts are generated outputs and are git-ignored by default; if deployment snapshots appear in the repository, treat the address table below as the canonical source of truth:

| Network              | Chain ID    | [`DKIMRegistry`](./src/DKIMRegistry.sol) address | Explorer                                                                                                |
| -------------------- | ----------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Ethereum Sepolia     | `11155111`  | `0xf936d1b39c4cCEaFB5EeD27CC7890272Da6958B6`     | [Etherscan](https://sepolia.etherscan.io/address/0xf936d1b39c4cCEaFB5EeD27CC7890272Da6958B6)            |
| Base Sepolia         | `84532`     | `0x287C76fADc09863176229e00CC39E5c65d3c7C68`     | [BaseScan](https://sepolia.basescan.org/address/0x287C76fADc09863176229e00CC39E5c65d3c7C68)             |
| Polkadot Hub Testnet | `420420417` | `0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE`     | [Blockscout](https://blockscout-testnet.polkadot.io/address/0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE) |

> Redeployed after the ERC-7969 compliance fixes (domain-scoped/reversible
> revocation, zero-hash/empty-array guards). Addresses above reflect the
> current contract; see `kusama-grant/milestone-1/03_deployment_evidence.md`
> for the Paseo deployment's bytecode provenance.

### All available commands

| Command                 | Description                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `yarn build`            | Compile contracts with Hardhat (`hardhat compile`).                                           |
| `yarn deploy`           | Deploy with Hardhat Ignition (`hardhat ignition deploy ... --network <id>`).                  |
| `yarn verify`           | Verify Ignition deployments (`hardhat ignition verify ...`).                                  |
| `yarn test:unit`        | Run unit tests with Foundry (`forge test --match-path "test/unit/**/*.t.sol"`).               |
| `yarn test:integration` | Run integration tests with Foundry (`forge test --match-path "test/integration/**/*.t.sol"`). |
