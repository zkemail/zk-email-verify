## ZK Email Script

### 1. fetch-dkim-keys

Fetches DKIM keys for the domains in `dkim/domains.txt` from DNS and saves the result to json files under `dkim/out`. Read-only, no chain interaction, no private key required. Logs a line per domain as it's fetched; pass `--quiet` (or `-q`) to suppress that and only print the final summary. Pass `--concurrency=<n>` to change how many domains are fetched in parallel (default 15).

Run

```bash
yarn fetch-dkim-keys
# or: yarn fetch-dkim-keys --quiet --concurrency=30
```

### 2. update-dkim-registry

Reads the keys `fetch-dkim-keys` wrote and registers them on the on-chain registry. Prints a line per domain as its transaction confirms; pass `--quiet` (or `-q`) to suppress the per-domain lines (failures and the final `N/M domains updated successfully.` tally always print, so a real on-chain failure is never hidden).

ENVS:

```
RPC_URL=        # rpc url of the chain
DKIM_REGISTRY=  # address of the token registry
PRIVATE_KEY=    # private key of the wallet
```

Run

```bash
yarn update-dkim-registry evm
# or: yarn update-dkim-registry evm --quiet
```

### 3. check-dkim-registry

Read-only. Fetches a domain's live DKIM public key from DNS, hashes it the same way the registry stores keys, and checks whether that key is registered on-chain. No private key or funds required.

ENVS:

```
RPC_URL=        # rpc url of the chain
DKIM_REGISTRY=  # address of the deployed registry
```

Run (pass a domain):

```bash
yarn check-dkim-registry ethereum.org
```

Prints `✅ registered` if the domain's DKIM key is trusted by the registry, or
`❌ not registered` otherwise.
