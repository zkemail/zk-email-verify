# ZK Email Contracts

These contracts need to be modified for each usecase. This includes manually splitting the public key into bigints and passing them in as 17 signals, creating a form of DAO governance to upgrade said key if needed, and a form of DAO governance to upgrade `from emails` if needed. There are multiple contracts: `twitterEmailHandler.sol` does the body verification and from verification for the Twitter password reset email usecase. All code should be built by generalizing this file, then forking from it. We also have one file that verifies just the email to/from domains, `domainEmailHandler.sol`, that is now deprecated, and should be rewritten from the Twitter file if that is the intention.

## Testing

To test solidity,

```
forge install foundry-rs/forge-std
cp node_modules/forge-std src/contracts/lib/forge-std
cd src/contracts
forge test
```

## Deployment

To deploy contract to forked mainnet, do:

```
anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/***REMOVED*** --port 8547 # Run in tmux
export ETH_RPC_URL=http://localhost:8547
forge create --rpc-url $ETH_RPC_URL src/contracts/src/emailVerifier.sol:Verifier --private-key  0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # Public anvil sk
```
