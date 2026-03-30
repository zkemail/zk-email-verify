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

> Note: Programmatic verification is currently not available for Polkadot Hub deployments because of Hardhat/Subscan integration limitations and Subscan API compatibility gaps. Base Sepolia verification is supported through Etherscan-compatible APIs.
>
> You can still verify Polkadot Hub deployments manually in Subscan:
>
> 1. Open `https://assethub-paseo.subscan.io/account/<deployed-address>?tab=contract`.
> 2. Choose verification mode: `Solidity (Single file)`.
> 3. Fill the form with:
>    - Contract Name: `DKIMRegistry`
>    - Compiler Version: `v0.8.30`
>    - Resolc Version: `v0.5.0`
>    - Optimization: `Yes`
>    - Optimization runs: `10000`
>    - Solidity Contract Code: flattened `DKIMRegistry` source (see command below)
> 4. Flatten the contract source:
>
> ```bash
> npx hardhat flatten src/DKIMRegistry.sol > FlattenedDKIMRegistry.sol
> ```
>
> 5. Paste the flattened code and click `Verify & Publish`.

### Current [`DKIMRegistry`](./src/DKIMRegistry.sol) deployments

Canonical deployed addresses are tracked here. Ignition deployment artifacts are generated outputs and are git-ignored by default; if deployment snapshots appear in the repository, treat the address table below as the canonical source of truth:

| Network              | Chain ID    | [`DKIMRegistry`](./src/DKIMRegistry.sol) address | Explorer                                                                                        |
| -------------------- | ----------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Ethereum Sepolia     | `11155111`  | `0x95806f01D497Bc6AE7b6F0D192D625b9442b1172`     | [Etherscan](https://sepolia.etherscan.io/address/0x95806f01D497Bc6AE7b6F0D192D625b9442b1172)    |
| Base Sepolia         | `84532`     | `0x969a461F6becC9c4344cd9925AA249585a8406a6`     | [BaseScan](https://sepolia.basescan.org/address/0x969a461F6becC9c4344cd9925AA249585a8406a6)     |
| Polkadot Hub Testnet | `420420417` | `0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc`     | [Subscan](https://assethub-paseo.subscan.io/account/0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc) |

### All available commands

| Command                 | Description                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `yarn build`            | Compile contracts with Hardhat (`hardhat compile`).                                           |
| `yarn deploy`           | Deploy with Hardhat Ignition (`hardhat ignition deploy ... --network <id>`).                  |
| `yarn verify`           | Verify Ignition deployments (`hardhat ignition verify ...`).                                  |
| `yarn test:unit`        | Run unit tests with Foundry (`forge test --match-path "test/unit/**/*.t.sol"`).               |
| `yarn test:integration` | Run integration tests with Foundry (`forge test --match-path "test/integration/**/*.t.sol"`). |
