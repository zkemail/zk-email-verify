# ZK Email Contracts

These contracts need to be modified for each usecase. This includes manually splitting the public key into bigints and passing them in as 17 signals, creating a form of DAO governance to upgrade said key if needed, and a form of DAO governance to upgrade `from emails` if needed. There are multiple contracts: `twitterEmailHandler.sol` does the body verification and from verification for the Twitter password reset email usecase. All code should be built by generalizing this file, then forking from it. We also have one file that verifies just the email to/from domains, `domainEmailHandler.sol`, that is now deprecated, and should be rewritten from the Twitter file if that is the intention.

## Testing

To setup,

```
curl -L https://foundry.paradigm.xyz | bash && source ~/.bashrc && foundryup
forge install foundry-rs/forge-std
cp node_modules/forge-std src/contracts/lib/forge-std
cd src/contracts
```

To test,

```
forge test
forge build --sizes # Make sure these are all below 24kB
```

## Deployment

Goerli Address of Deployment: 0xA555F9E05402F8240AC99A0d045081E19C0eB9B3

To deploy contract to local forked mainnet or prod, edit Deploy.s.sol to point to your contracts. You should also edit the `.env` file from cloning `   .env.example` to include your own private key.

```
# Set terminal to the folder with this README
cd src/contracts

# Run local chain in tmux window 1
export ALCHEMY_GOERLI_KEY=...
anvil --fork-url https://eth-goerli.g.alchemy.com/v2/$ALCHEMY_GOERLI_KEY --port 8548 # Run in tmux

# Export to abi for relayers
forge inspect src/TwitterEmailHandler.sol:$MAIN_CONTRACT_NAME abi --via-ir >> contract.abi
source .env

# First, test deploy without actually broadcasting it
forge script script/Deploy.s.sol:Deploy --via-ir -vvvv --rpc-url $RPC_URL

# Then, actually deploy
forge script script/Deploy.s.sol:Deploy --via-ir -vvvv --rpc-url $RPC_URL --broadcast

# Verify the contract with the raw one via Etherscan
forge verify-contract $EMAIL_ADDR $MAIN_CONTRACT_NAME --watch --etherscan-api-key $GOERLI_ETHERSCAN_API_KEY
```
