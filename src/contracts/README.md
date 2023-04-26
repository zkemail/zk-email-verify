# ZK Email Contracts

These contracts need to be modified for each usecase. This includes manually splitting the public key into bigints and passing them in as 17 signals, creating a form of DAO governance to upgrade said key if needed, and a form of DAO governance to upgrade `from emails` if needed. There are multiple contracts: `twitterEmailHandler.sol` does the body verification and from verification for the Twitter password reset email usecase. All code should be built by generalizing this file, then forking from it. We also have one file that verifies just the email to/from domains, `domainEmailHandler.sol`, that is now deprecated, and should be rewritten from the Twitter file if that is the intention.

To get syntax highlighting in VSCode to work, you have to open this directory as the root directory for the Solidity extension to read the remappings properly.

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

Goerli Address of Deployment: 0x026343f978d9f5600bf2e05992eb3fff06e4ea80

To deploy contract to local forked mainnet or prod, edit Deploy.s.sol to point to your contracts. You should also edit the `.env` file from cloning `.env.example` to include your own private key.

```
# Set terminal to the folder with this README
cd src/contracts
source .env
export MAIN_CONTRACT_NAME=VerifiedTwitterEmail

# Run local chain in tmux window 1
anvil --fork-url https://eth-goerli.g.alchemy.com/v2/$ALCHEMY_GOERLI_KEY --port 8548

# Export to abi for relayers
forge inspect src/TwitterEmailHandler.sol:$MAIN_CONTRACT_NAME abi >> contract.abi

# First, test deploy without actually broadcasting it
forge script script/Deploy.s.sol:Deploy -vvvv --rpc-url $RPC_URL

# Then, actually deploy
forge script script/Deploy.s.sol:Deploy -vvvv --rpc-url $RPC_URL --broadcast --slow

# Verify the contract with the raw one via Etherscan
forge verify-contract $EMAIL_ADDR $MAIN_CONTRACT_NAME --watch --etherscan-api-key $GOERLI_ETHERSCAN_API_KEY
```

### What if I get an error about request failed and not all the contracts deploy?

Maybe fullnode is on [old geth](https://github.com/ethereum/go-ethereum/issues/26890) endpoint, like Alchemy is. Switch to infura or add `--slow` to deploy script:

```
forge script script/Deploy.s.sol:Deploy -vvvv --rpc-url $RPC_URL --broadcast --slow
```
