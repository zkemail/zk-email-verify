# 03 - Deployment Evidence

Milestone 1 deployment evidence for DKIM Registry on Paseo Assethub.

## Target Network

- Network: Polkadot Hub Testnet (Paseo Assethub)
- Chain ID: `420420417`
- RPC (default): `https://eth-rpc-testnet.polkadot.io`

## Deployed Contract

- Contract: `DKIMRegistry`
- Address: `0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE`
- Deploy tx: [`0xf21ed2468853f2c61ed0053b76b81c7ee38b5944ed1c56697edf7c42f968cccd`](https://blockscout-testnet.polkadot.io/tx/0xf21ed2468853f2c61ed0053b76b81c7ee38b5944ed1c56697edf7c42f968cccd)
- Block: `11368796`
- Explorer: [Blockscout](https://blockscout-testnet.polkadot.io/address/0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE)

> Redeployed after the review's requested fixes (domain-scoped/reversible revocation,
> zero-hash/empty-array guards, ERC-165 note, NatSpec accuracy). The previous address
> (`0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc`) reflected the pre-review contract and is
> superseded by this deployment.

## Real Registration Activity

Populated via `yarn update-dkim-registry` (the same flow documented in `04_public_howto.md`),
registering `ethereum.org`'s live DKIM keys:

- Tx: [`0xb578136d5274446242b4cf01a19700adfc525d48cb6a36e7562038b8aeba8485`](https://blockscout-testnet.polkadot.io/tx/0xb578136d5274446242b4cf01a19700adfc525d48cb6a36e7562038b8aeba8485)
- Verified with `yarn check-dkim-registry ethereum.org`: 4 key hashes registered and valid.

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
| Locally compiled (`hh-artifacts/src/DKIMRegistry.sol/DKIMRegistry.json`) | `0xc285163ebf486f3d0fc847bfc5e3d32dacad87483737a70ef54debfea2af4a81` |
| On-chain (`0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE`) | `0xc285163ebf486f3d0fc847bfc5e3d32dacad87483737a70ef54debfea2af4a81` |

The two hashes are identical, proving the deployed contract is exactly this source compiled
with the compiler above. On PolkaVM the deploy and runtime code are the same PVM blob, so
`bytecode` and `deployedBytecode` in the artifact are identical.

### Reproduce

```bash
# on-chain runtime-bytecode hash
cast code 0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE \
  --rpc-url https://eth-rpc-testnet.polkadot.io | cast keccak

# locally compiled runtime-bytecode hash (from packages/contracts)
yarn build
jq -r '.bytecode' hh-artifacts/src/DKIMRegistry.sol/DKIMRegistry.json | cast keccak
```

## Source-of-Truth Policy

- Canonical public proof: documented address table and this deployment evidence doc.
- Ignition deployment artifacts are local/generated outputs and are git-ignored by default.
