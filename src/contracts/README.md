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
```

## Deployment

To deploy contract to forked mainnet, do:

```
# anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/$ALCHEMY_KEY

# In tmux window 1
export ALCHEMY_GOERLI_KEY=...
anvil --fork-url https://eth-goerli.alchemyapi.io/v2/$ALCHEMY_GOERLI_KEY --port 8547 # Run in tmux

# In normal terminal
export ETH_RPC_URL=http://localhost:8547
export SK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # Public anvil sk

forge create --rpc-url $ETH_RPC_URL NFTSVG --private-key $SK --via-ir --force | tee /dev/tty | export NFTSVG_ADDR=$(sed -n 's/.*Deployed to: //p')
forge create --rpc-url $ETH_RPC_URL HexStrings --private-key $SK --via-ir --force | tee /dev/tty | export HEXSTRINGS_ADDR=$(sed -n 's/.*Deployed to: //p')
# forge bind --libraries src/hexStrings.sol:hexStrings:$HEXSTRINGS_ADDR --libraries src/NFTSVG.sol:NFTSVG:$NFTSVG_ADDR --via-ir
echo "libraries = [\"src/NFTSVG.sol:NFTSVG:${NFTSVG_ADDR}\", \"src/hexStrings.sol:HexStrings:${HEXSTRINGS_ADDR}\"]" >> foundry.toml
forge create --rpc-url $ETH_RPC_URL VerifiedTwitterEmail --private-key $SK --via-ir --force | tee /dev/tty | export EMAIL_ADDR=$(sed -n 's/.*Deployed to: //p')
sed -i '' -e '$ d' foundry.toml
forge create --rpc-url $ETH_RPC_URL VerifiedTwitterEmail --private-key $SK --via-ir --force --libraries "HexStrings:${HEXSTRINGS_ADDR}","NFTSVG:${NFTSVG_ADDR}" | tee /dev/tty | export EMAIL_ADDR=$(sed -n 's/.*Deployed to: //p')

forge verify-contract $EMAIL_ADDR VerifiedTwitterEmail --watch --etherscan-api-key $GORLII_ETHERSCAN_API_KEY
```
