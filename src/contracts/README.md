# ZK Email Contracts

These contracts need to be modified for each usecase. This includes manually splitting the public key into bigints and passing them in as 17 signals, creating a form of DAO governance to upgrade said key if needed, and a form of DAO governance to upgrade `from emails` if needed. There are multiple contracts: `twitterEmailHandler.sol` does the body verification and from verification for the Twitter password reset email usecase. All code should be built by generalizing this file, then forking from it. We also have one file that verifies just the email to/from domains, `domainEmailHandler.sol`, that is now deprecated, and should be rewritten from the Twitter file if that is the intention.

To get syntax highlighting in VSCode to work, you have to open this directory as the root directory for the Solidity extension to read the remappings properly.

## Testing

To test solidity,

```
forge install foundry-rs/forge-std
cp node_modules/forge-std src/contracts/lib/forge-std
cd src/contracts
forge test --via-ir
forge build --sizes --via-ir # Make sure these are all below 24kB
```

## Deployment

Goerli Address of Email Wallet: 0xA555F9E05402F8240AC99A0d045081E19C0eB9B3

To deploy contract to local forked mainnet or prod, do:

```
cd src/contracts # If you haven't already sourced to this folder
# anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/$ALCHEMY_KEY

# In tmux window 1
export ALCHEMY_GOERLI_KEY=...
anvil --fork-url https://eth-goerli.alchemyapi.io/v2/$ALCHEMY_GOERLI_KEY --port 8547 # Run in tmux

# In normal terminal
export ETH_RPC_URL=https://eth-goerli.g.alchemy.com/v2/$ALCHEMY_GOERLI_KEY # Prod
export ETH_RPC_URL=http://localhost:8548 # Dev
export SK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # Public anvil sk
export MAIN_CONTRACT_NAME=VerifiedTwitterEmail
export MAIN_CONTRACT_NAME=VerifiedWalletEmail

echo 'Note that this script modifies the foundry.toml in order to link libraries, so do not touch that file while this is running!'
forge inspect src/WalletEmailHandler.sol:$MAIN_CONTRACT_NAME abi --via-ir >> wallet.abi
source .env && forge script script/Deploy.s.sol:Deploy --via-ir -vvvv --rpc-url $RPC_URL --broadcas
forge verify-contract $EMAIL_ADDR $MAIN_CONTRACT_NAME --watch --etherscan-api-key $GOERLI_ETHERSCAN_API_KEY
```
