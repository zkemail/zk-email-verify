# DKIM Registry — Paseo testnet demo

A tiny web app for the Kusama grant Milestone 1 DKIM Registry. Enter a domain and it:

1. fetches the domain's live DKIM public key from DNS,
2. hashes it exactly the way ZK Email does (Poseidon over 9×242-bit chunks),
3. asks the on-chain `DKIMRegistry` on **Paseo Asset Hub** whether that key is trusted.

If the key isn't registered yet, one button registers it — paid for by a prefunded
testnet wallet behind the backend, so visitors never connect a wallet or spend anything.

All the DNS + hashing + contract logic is the shared [`scripts/dkim/core.ts`](../../scripts/dkim/core.ts),
the same module the `check-dkim-registry` / `update-dkim-registry` CLIs use — so the
website can never disagree with the CLI.

## Endpoints

| Route | Method | Notes |
| --- | --- | --- |
| `/api/check?domain=` | GET | Read-only registry lookup. No key. |
| `/api/update` | POST `{domain}` | Owner-only registration. Rate-limited per IP, serialized to avoid nonce races. |
| `/api/wallet` | GET | Prefunded wallet address + PAS balance. |

## One-time setup: a demo-owned registry

`setDKIMPublicKeyHashes` is `onlyOwner`, so the prefunded wallet must **own** the
registry it writes to. Create a throwaway wallet and deploy a fresh registry owned by it:

```bash
# 1. new throwaway wallet
cast wallet new     # note the Address and Private key

# 2. fund the Address with testnet PAS
#    https://faucet.polkadot.io/  (select Polkadot Hub TestNet / Paseo Asset Hub)

# 3. deploy a registry owned by that wallet (from packages/contracts)
cd ../../packages/contracts
#    set PRIVATE_KEY + OWNER to the new wallet in packages/contracts/.env
yarn deploy 420420417   # note the deployed DKIMRegistry address
```

## Local run

```bash
cp .env.example .env
# fill in DKIM_REGISTRY (from step 3) and PRIVATE_KEY (the throwaway wallet)
yarn                # from repo root, installs the workspace
yarn workspace @zk-email/dkim-registry-demo build   # bundle the browser client
yarn workspace @zk-email/dkim-registry-demo start   # serve on :3000
```

Open <http://localhost:3000>.

## Deploy on Render

A single **Web Service** serves both the API and the static page (a persistent
process is what lets the rate-limiter and update queue live in memory).

- **Root Directory:** _(leave blank — repo root, so the Yarn workspace installs normally)_
- **Build Command:** `yarn && yarn workspace @zk-email/dkim-registry-demo build`
- **Start Command:** `yarn workspace @zk-email/dkim-registry-demo start`
- **Environment variables:**
  - `RPC_URL=https://eth-rpc-testnet.polkadot.io`
  - `DKIM_REGISTRY=<your demo registry address>`
  - `PRIVATE_KEY=<throwaway owner wallet key>`
  - (`PORT` is set by Render automatically)

A [`render.yaml`](./render.yaml) blueprint is included as a template — move it to the
repo root to use Render's Blueprint deploy, or just enter the settings above by hand.

> This is a testnet demo. Paseo may be reset, and the wallet key is disposable — never
> reuse it on mainnet. Wind it down by deleting the Render service when the announcement
> has run its course.
