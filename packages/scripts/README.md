## ZK Email Script

### 1. update-dkim-registry

This will fetch DKIM keys for popular domains, save the result to json files, and update contracts.

ENVS:
```
RPC_URL= #rpc url of the chain
DKIM_REGISTRY=  #address of the token registry
PRIVATE_KEY=  #private key of the wallet
```

Run

```bash
yarn update-dkim-registry
```