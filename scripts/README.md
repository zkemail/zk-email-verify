## ZK Email Script

### 1. update-dkim-registry

This will fetch DKIM keys for popular domains, save the result to json files, and update contracts by default.

ENVS:
```
RPC_URL= #rpc url of the chain
DKIM_REGISTRY=  #address of the token registry
PRIVATE_KEY=  #private key of the wallet
UPDATE_DKIM_REGISTRY_ONCHAIN=false #optional: fetch, split, and hash keys without sending registry transactions
```

Run

```bash
yarn update-dkim-registry
```

To generate only the local key artifacts, run with `UPDATE_DKIM_REGISTRY_ONCHAIN=false`.
This writes:

- `dkim-keys.json`
- `dkim-keys-chunked.json`
- `dkim-keys-hashed.json`
