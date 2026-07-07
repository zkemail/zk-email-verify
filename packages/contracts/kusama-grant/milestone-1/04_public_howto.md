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

## 5) Try It Out

The registry stores hashes of DKIM public keys per domain. You can populate it and then query it using the scripts in `scripts/dkim` (repo root). These reuse the same Poseidon key-hashing as the ZK Email tooling, so a registered key matches what an email verifier would check.

From the repo root, configure `scripts/.env` (see `scripts/.env.sample`):

```
RPC_URL=https://eth-rpc-testnet.polkadot.io
DKIM_REGISTRY=<your deployed registry address>   # from step 4
PRIVATE_KEY=<registry owner key>                  # only needed to populate
```

### Check whether a domain is registered (read-only, no key/funds)

From the repo root:

```bash
cd scripts
yarn check-dkim-registry ethereum.org       # a domain whose key is registered  -> ✅
yarn check-dkim-registry cloudflare.com     # a domain that is not registered    -> ❌
```

The script fetches the domain's live DKIM key from DNS, hashes it, and asks the on-chain registry `isKeyHashValid(...)`.

### Populate the registry with DKIM keys (owner only)

`update-dkim-registry` fetches DKIM keys for the domains in `scripts/dkim/domains.txt` and registers them (one owner transaction per domain). From the repo root:

```bash
cd scripts
yarn update-dkim-registry
```

After populating, re-run `check-dkim-registry <domain>` for a domain from the list and it will report `✅ registered`.
