# 04 - Public How-To

Public usage guide for Milestone 1 DKIM Registry on Paseo Assethub.

## 1) Prerequisites

- Node/Yarn installed.
- Foundry installed for running Solidity tests.
- `packages/contracts/.env` configured from `.env.example`.

Required env values:

- `PRIVATE_KEY`
- `OWNER`
- optional: `RPC_URL`
- optional: `ETHERSCAN_API_KEY` (for EVM explorers where supported)

## 2) Install and Build

From `packages/contracts`:

```bash
yarn
yarn build
```

## 3) Run Tests

Unit tests:

```bash
yarn test:unit
```

Integration tests:

```bash
yarn test:integration
```

## 4) Deploy to Paseo Assethub

```bash
yarn deploy 420420417
```

Deployment module:

- `hh-ignition/modules/DKIMRegistry.ts`

## 5) Verify on Explorer

- For Polkadot Hub environments, use manual Subscan verification.
- Detailed step-by-step verification instructions are in:
  - `packages/contracts/README.md`

## 6) Smoke-check Example

After deployment, verify behavior by calling contract methods:

- set a DKIM key hash for a domain (owner account)
- call `isKeyHashValid(domainHash, keyHash)` and check it is `true`
- revoke that key hash
- call `isKeyHashValid(domainHash, keyHash)` and check it is `false`
