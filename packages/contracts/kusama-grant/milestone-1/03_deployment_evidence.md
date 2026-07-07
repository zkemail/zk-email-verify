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

## Source-of-Truth Policy

- Canonical public proof: documented address table and this deployment evidence doc.
- Ignition deployment artifacts are local/generated outputs and are git-ignored by default.
