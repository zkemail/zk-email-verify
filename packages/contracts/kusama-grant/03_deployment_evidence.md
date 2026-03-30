# 03 - Deployment Evidence

Milestone 1 deployment evidence for DKIM Registry on Paseo Assethub.

## Target Network

- Network: Polkadot Hub Testnet (Paseo Assethub)
- Chain ID: `420420417`
- RPC (default): `https://services.polkadothub-rpc.com/testnet`

## Deployed Contract

- Contract: `DKIMRegistry`
- Address: `0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc`
- Explorer: [Subscan](https://assethub-paseo.subscan.io/account/0x83A1b3958D49195D3F62C44B42e7a41336Bc3ffc)

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

- Programmatic verification is limited on Polkadot Hub environments.
- Manual Subscan verification flow is documented in:
  - `packages/contracts/README.md`

## Source-of-Truth Policy

- Canonical public proof: documented address table and this deployment evidence doc.
- Ignition deployment artifacts are local/generated outputs and are git-ignored by default.
