# 05 - Cost Benchmarks

Gas and cost comparison for the Milestone 1 `DKIMRegistry`, measured by deploying
the **same contract** and running the **same operations** on two live testnets:

- **Ethereum Sepolia** (`11155111`): EVM, `solc`-compiled bytecode
- **Paseo Asset Hub** (`420420417`): PolkaVM, `resolc`-compiled bytecode (the
  Milestone 1 target)

The Paseo run provides the PolkaVM gas measurement. The **Kusama** cost is
projected from it by pricing the same PolkaVM fee in KSM (Kusama Asset Hub runs
the same PolkaVM metering; only the token differs). It is a projection, not a
direct Kusama measurement; see Caveats.

## TL;DR

- PolkaVM meters contract storage about **10x cheaper in gas** than the EVM
  (`setDKIMPublicKeyHash`: 4,267 vs 50,318 gas).
- At today's unusually low Ethereum gas (about 0.24 gwei) the two chains are in
  the same ballpark for a single call. The Kusama cost advantage becomes decisive
  once Ethereum gas rises to normal or congested levels (5 to 20 gwei), where a
  registration is roughly **30x to 125x more expensive on Ethereum**.
- Registering a DKIM key, the core recurring action, costs about
  **$0.014 on Kusama vs $0.02 to $1.79 on Ethereum** (Ethereum is gas-dependent).

## Methodology

- A throwaway burner wallet was funded from public faucets on both testnets; no
  project or owner key was used. The benchmark script asserts the signer equals
  the expected burner address before sending any transaction.
- Each operation's cost is captured two ways: `gasUsed x effectiveGasPrice`
  (the reported gas fee) and the wallet's native-balance delta before and after
  the transaction. On both chains the two matched exactly, which confirms there
  is **no separate PolkaVM storage deposit** hiding outside the reported gas fee
  on Paseo's Ethereum-RPC: the full native debit equals the gas fee.
- Domain and key arguments are arbitrary `bytes32` values; gas depends on the
  storage writes, not on the values, so they are representative of real
  registrations.

## Measured results (facts)

| Operation | Sepolia gas | Sepolia fee (ETH) | Paseo gas (PolkaVM) | Paseo fee (PAS) |
| --- | ---: | ---: | ---: | ---: |
| Deploy | 451,654 | 0.00045131 | 426,873 | 0.426873 |
| `setDKIMPublicKeyHash` | 50,318 | 0.00005653 | 4,267 | 0.004267 |
| `setDKIMPublicKeyHashes` (x3) | 104,624 | 0.00012167 | 11,010 | 0.011010 |
| `revokeDKIMPublicKeyHash` | 47,235 | 0.00005064 | 4,010 | 0.004010 |
| Read (`isKeyHashValid`) | 0 (view) | 0 | 0 (view) | 0 |

> Raw `gasUsed` is **not** directly comparable across EVM and PolkaVM (different
> metering units), and the two testnets run at different gas prices (Sepolia
> about 1 gwei, Paseo a fixed 1000-gwei-equivalent). Only the USD figures below
> are comparable across chains.

## Cost model

USD cost is derived from the measured on-chain figures:

- **Ethereum:** `gasUsed x gas_price x ETH_price`. `gasUsed` is deterministic, so
  the only variable is the mainnet gas price, shown at three levels.
- **Kusama (projected):** `measured_PolkaVM_fee x KSM_price`, assuming Kusama
  Asset Hub uses the same PolkaVM weight-to-fee as Paseo (see Caveats).

**Why three Ethereum columns but one Kusama column?** A gas price (gwei) exists on
both chains; the difference is volatility. Ethereum uses a fee-market auction, so
its gas price swings with congestion and the same operation costs very different
amounts, hence a range of scenarios. Kusama and Polkadot fees are weight-based and
effectively fixed by the runtime's weight-to-fee constant (they only drift under
sustained block fullness), so a single value captures the cost; the measured
PolkaVM fee already includes it.

Price inputs captured **2026-07-13**: ETH = $1,780.18, KSM = $3.32, Ethereum
mainnet gas about 0.238 gwei (live).

### USD per operation

| Operation | Ethereum @0.24 gwei | Ethereum @5 gwei | Ethereum @20 gwei | Kusama |
| --- | ---: | ---: | ---: | ---: |
| Deploy | $0.191 | $4.020 | $16.081 | $1.417 |
| `setDKIMPublicKeyHash` | $0.021 | $0.448 | $1.792 | $0.0142 |
| `setDKIMPublicKeyHashes` (x3) | $0.044 | $0.931 | $3.725 | $0.0366 |
| `revokeDKIMPublicKeyHash` | $0.020 | $0.420 | $1.682 | $0.0133 |

Both columns are projections from testnet gas, not mainnet measurements. Ethereum:
gas measured on Sepolia, costed at the stated mainnet gas price and live ETH price.
Kusama: gas measured on Paseo, costed at the measured Paseo gas price and live KSM price.

### Scenario: deploy + register 100 domains (1 deploy + 100 single sets)

| | Ethereum @0.24 gwei | Ethereum @5 gwei | Ethereum @20 gwei | Kusama |
| --- | ---: | ---: | ---: | ---: |
| Total | $2.32 | $48.81 | $195.23 | $2.83 |

## Caveats

- **Gas units are not comparable across VMs.** EVM gas and PolkaVM gas meter
  different things; compare USD, not gas.
- **Ethereum testnet gas price is not representative.** Sepolia ran at about
  1 gwei; mainnet varies. The USD table uses live mainnet gas (about 0.24 gwei)
  plus 5 and 20 gwei scenarios so the gas-dependence is explicit. At the current
  very low gas, Ethereum deploy is even slightly cheaper than the Kusama
  projection; the PolkaVM advantage is a function of Ethereum congestion.
- **Kusama is projected, not measured.** Milestone 1 deployed to Paseo, not
  Kusama. The projection assumes Kusama Asset Hub uses the same PolkaVM
  weight-to-fee as Paseo; only the token price is swapped. If Kusama's fee
  multiplier differs, its figures scale accordingly. A direct Kusama Asset Hub
  measurement would remove this assumption.
- **Prices are a snapshot.** Token prices and gas move; re-run to refresh.
- **Storage deposit:** empirically none appeared outside the gas fee on Paseo's
  Ethereum-RPC (balance delta equals gas fee). If a future runtime surfaces a
  separate refundable deposit, the balance-delta method in the script will catch
  it.

## Reproduce

The scripts live in [`packages/contracts/benchmarks/`](../../benchmarks)
(`bench.mjs`, `aggregate.mjs`). Prerequisites: a funded burner key on each
network, `out/` (Foundry/EVM build) and `hh-artifacts/` (resolc/PolkaVM build)
present. Run from `packages/contracts/benchmarks/`.

```bash
# from packages/contracts: EVM build (Sepolia) and PolkaVM build (Paseo)
forge build --contracts src/DKIMRegistry.sol
yarn build
cd benchmarks

# Paseo Asset Hub (PolkaVM)
PK=<burner> EXPECTED=<burner-addr> MODE=pvm \
RPC_URL=https://eth-rpc-testnet.polkadot.io \
LABEL="Paseo Asset Hub" OUT=paseo.json node bench.mjs

# Ethereum Sepolia (EVM)
PK=<burner> EXPECTED=<burner-addr> MODE=evm \
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com \
LABEL="Ethereum Sepolia" OUT=sepolia.json node bench.mjs

# Combine into the tables above
node aggregate.mjs
```

`aggregate.mjs` reads the price inputs from the env vars `ETH_USD`, `KSM_USD`,
and `ETH_GWEI`. To refresh the dollar figures with current prices, pass new
values, for example `ETH_USD=2000 KSM_USD=4 ETH_GWEI=5 node aggregate.mjs`.

## Appendix: transaction evidence

Both deployments landed at the same address (fresh burner, nonce 0 gives an
identical CREATE address on both chains): `0xcbb07554CaCBe62254923B1f09d63d449F9254b4`,
viewable on [Paseo](https://blockscout-testnet.polkadot.io/address/0xcbb07554CaCBe62254923B1f09d63d449F9254b4)
and [Sepolia](https://sepolia.etherscan.io/address/0xcbb07554CaCBe62254923B1f09d63d449F9254b4).

Paseo Asset Hub (`420420417`), on [Blockscout](https://blockscout-testnet.polkadot.io):

- deploy: [`0xedd145523cd794ede1ed4e31bc8ff701b9192972c2877ce2a4151b9b356916c8`](https://blockscout-testnet.polkadot.io/tx/0xedd145523cd794ede1ed4e31bc8ff701b9192972c2877ce2a4151b9b356916c8)
- `setDKIMPublicKeyHash`: [`0x95f709b80c867b0effede1594d96a28416f5de23ce977b4ec075e2cd69dd916d`](https://blockscout-testnet.polkadot.io/tx/0x95f709b80c867b0effede1594d96a28416f5de23ce977b4ec075e2cd69dd916d)
- `setDKIMPublicKeyHashes`: [`0x4206aa24cfb9a9280af7cbaee0d2992e54c93f4349b9897f3885a3381d8c875f`](https://blockscout-testnet.polkadot.io/tx/0x4206aa24cfb9a9280af7cbaee0d2992e54c93f4349b9897f3885a3381d8c875f)
- `revokeDKIMPublicKeyHash`: [`0x48d50ca85b92e97b65057d0de74c906777048dd20f64b7546fa129986363ec55`](https://blockscout-testnet.polkadot.io/tx/0x48d50ca85b92e97b65057d0de74c906777048dd20f64b7546fa129986363ec55)

Ethereum Sepolia (`11155111`), on [Etherscan](https://sepolia.etherscan.io):

- deploy: [`0xbf5510164e2739375db19f9b1a7756f657e43c024ed2417c1b35305b20507e3c`](https://sepolia.etherscan.io/tx/0xbf5510164e2739375db19f9b1a7756f657e43c024ed2417c1b35305b20507e3c)
- `setDKIMPublicKeyHash`: [`0x45d9181be0ab9a496134d69af8ebd41e84cf1e1008b46c7a9114bb05c4c979ac`](https://sepolia.etherscan.io/tx/0x45d9181be0ab9a496134d69af8ebd41e84cf1e1008b46c7a9114bb05c4c979ac)
- `setDKIMPublicKeyHashes`: [`0x1ff7cec62fca6234ac9b97fa6372b7165bf88787a346ddf8ac7a81f6696d51ec`](https://sepolia.etherscan.io/tx/0x1ff7cec62fca6234ac9b97fa6372b7165bf88787a346ddf8ac7a81f6696d51ec)
- `revokeDKIMPublicKeyHash`: [`0x2cc68975cebef52aaef63766ee283eef68826bcbfb5c81c247fc81a7cad713c3`](https://sepolia.etherscan.io/tx/0x2cc68975cebef52aaef63766ee283eef68826bcbfb5c81c247fc81a7cad713c3)
