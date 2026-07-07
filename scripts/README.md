## ZK Email Script

### 1. update-dkim-registry

This will fetch DKIM keys for popular domains, save the result to json files, and update contracts.

ENVS:

```
RPC_URL=        # rpc url of the chain
DKIM_REGISTRY=  # address of the token registry
PRIVATE_KEY=    # private key of the wallet
```

Run

```bash
yarn update-dkim-registry
```

### 2. check-dkim-registry

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
