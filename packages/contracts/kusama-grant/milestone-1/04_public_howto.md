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

### Create and fund a wallet

The deployer/owner account needs testnet PAS to deploy and to populate the registry. Create a fresh keypair (Foundry's `cast` ships with this repo):

```bash
cast wallet new
# Successfully created new keypair.
# Address:     0xYourAddress...
# Private key: 0xYourPrivateKey...
```

Put both into `packages/contracts/.env`, where the deployer and the registry owner are the same account here:

```
RPC_URL=https://eth-rpc-testnet.polkadot.io
PRIVATE_KEY=<the private key from your cast wallet new output above>
OWNER=<the address from your cast wallet new output above>
```

Fund the address with testnet PAS, then confirm it arrived:

- Faucet: <https://faucet.polkadot.io/>, select the Polkadot Hub TestNet (Paseo Asset Hub) and paste your address.
- Explorer: `https://blockscout-testnet.polkadot.io/address/<your address>`

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
# ✔ Confirm deploy to network 420420417 (420420417)? … yes
# Hardhat Ignition 🚀

# Deploying [ DKIMRegistryModule ]

# Batch #1
#   Executed DKIMRegistryModule#DKIMRegistry

# [ DKIMRegistryModule ] successfully deployed 🚀

# Deployed Addresses

# DKIMRegistryModule#DKIMRegistry - 0x12dc89E4a0cBB2718092F2bf00763B047850ef32
```

Deployment module:

- `hh-ignition/modules/DKIMRegistry.ts`

## 5) Try It Out

The registry stores hashes of DKIM public keys per domain. You can populate it and then query it using the scripts in `scripts` (from repo root). These reuse the same Poseidon key-hashing as the ZK Email tooling, so a registered key matches what an email verifier would check.

Enter the `scripts` dir. From the repo root:

```bash
cd scripts
```

Configure `.env`:

```bash
cp .env.sample .env
```

Populate `.env` with the deployed registry address and your own funded testnet keypair (the same one from step 1):

```
RPC_URL=https://eth-rpc-testnet.polkadot.io
PRIVATE_KEY=<your private key from step 1>
DKIM_REGISTRY=0x12dc89E4a0cBB2718092F2bf00763B047850ef32
```

### Check whether a domain is registered (read-only, no key/funds)

Run the check script for a domain (e.g. `ethereum.org`):

```bash
yarn check-dkim-registry ethereum.org
# Registry: 0x12dc89E4a0cBB2718092F2bf00763B047850ef32
# Domain:   ethereum.org

#   ❌ not registered  0x0bd2801e3cbcf396…
#   ❌ not registered  0x0b5c3810709c5fcc…
#   ❌ not registered  0x2dbd1b65c3f4eb55…

# ❌ ethereum.org: its live DKIM key is not on this registry (populate it with yarn update-dkim-registry).
```

The script fetches the domain's live DKIM key from DNS, hashes it, and asks the on-chain registry `isKeyHashValid(...)`.

We did not yet register any DKIM keys, so the registry reports `not registered`.

### Populate the registry with DKIM keys

`update-dkim-registry` fetches DKIM keys for the domains in `dkim/domains.txt` and registers them (one owner transaction per domain). From the repo root:

```bash
yarn update-dkim-registry
```

The script goes through each domain in `dkim/domains.txt`, fetches its DKIM key from DNS, hashes it, and calls the registry's `setDKIMPublicKeyHashes(...)` function. You can add more domains to `domains.txt` to register their DKIM keys.

After populating, re-run the check script:

```bash
yarn check-dkim-registry ethereum.org
# Registry: 0x12dc89E4a0cBB2718092F2bf00763B047850ef32
# Domain:   ethereum.org

#   ✅ registered      0x0bd2801e3cbcf396…
#   ✅ registered      0x0b5c3810709c5fcc…
#   ✅ registered      0x2dbd1b65c3f4eb55…

# ✅ ethereum.org: a live DKIM key is registered, emails signed with it can be verified on-chain.
```

The registry now reports the live DKIM key for `ethereum.org` as registered.
