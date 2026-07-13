# 03 - Deployment Evidence

Milestone 1 deployment evidence for DKIM Registry on Paseo Assethub.

## Target Network

- Network: Polkadot Hub Testnet (Paseo Assethub)
- Chain ID: `420420417`
- RPC (default): `https://eth-rpc-testnet.polkadot.io`

## Deployed Contract

- Contract: `DKIMRegistry`
- Address: `0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc`
- Explorer: [Blockscout](https://blockscout-testnet.polkadot.io/address/0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc)

## Deployment Artifacts

- Ignition module:
  - `packages/contracts/hh-ignition/modules/DKIMRegistry.ts`
- Deployment output:
  - `packages/contracts/hh-ignition/deployments/chain-420420417/deployed_addresses.json`

## Reproducible Command Flow

From `packages/contracts`:

```bash
yarn
yarn build
yarn deploy 420420417
```

## Verification

- Source-code verification is **not currently possible for PolkaVM deployments.** The contract is `resolc`-compiled to PolkaVM/RISC-V bytecode; the Blockscout explorer's verification API and `@nomicfoundation/hardhat-verify` both only support EVM `solc`/Vyper bytecode, and `@parity/hardhat-polkadot` does not yet provide a resolc-aware verify task. This is a PolkaVM tooling gap, not a deployment issue.
- The contract is still fully visible on [Blockscout](https://blockscout-testnet.polkadot.io) (address, PolkaVM bytecode, transactions) and is exercisable via its read/write methods.
- Background is documented in `packages/contracts/README.md`.

## Bytecode Provenance

Because automated source verification is not yet available for PolkaVM, provenance is
established by comparing the locally compiled runtime bytecode against the on-chain code.
Compilation is deterministic: a clean rebuild reproduces the blob byte-for-byte.

### Compiler

- `resolc`: `0.5.0+commit.046455.llvm-18.1.8` (pinned in `hardhat.config.ts` as `resolc.version = "0.5.0"`; plugin default `compilerSource: "binary"`)
- `solc`: `0.8.30+commit.73712a01`
- Optimizer: enabled, `runs = 10000`
- `evmVersion`: `prague`

### Runtime-bytecode hash (keccak256)

| Source | keccak256 |
| --- | --- |
| Locally compiled (`hh-artifacts/src/DKIMRegistry.sol/DKIMRegistry.json`) | `0x22f6687e73dc3ec47a28636b8ac3d17dd278ab25575bb30449a223c07008d974` |
| On-chain (`0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc`) | `0x22f6687e73dc3ec47a28636b8ac3d17dd278ab25575bb30449a223c07008d974` |

The two hashes are identical, proving the deployed contract is exactly this source compiled
with the compiler above. On PolkaVM the deploy and runtime code are the same PVM blob, so
`bytecode` and `deployedBytecode` in the artifact are identical.

### Reproduce

```bash
# on-chain runtime-bytecode hash
cast code 0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc \
  --rpc-url https://eth-rpc-testnet.polkadot.io | cast keccak

# locally compiled runtime-bytecode hash (from packages/contracts)
yarn build
jq -r '.bytecode' hh-artifacts/src/DKIMRegistry.sol/DKIMRegistry.json | cast keccak
```

## Source-of-Truth Policy

- Canonical public proof: documented address table and this deployment evidence doc.
- Ignition deployment artifacts are local/generated outputs and are git-ignored by default.
