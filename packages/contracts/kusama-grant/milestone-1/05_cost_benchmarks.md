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

- PolkaVM meters contract storage about **11x cheaper in gas** than the EVM
  (`setDKIMPublicKeyHash`: 4,196 vs 48,111 gas).
- At today's unusually low Ethereum gas (about 0.16 gwei) the two chains are in
  the same ballpark for a single call. The Kusama cost advantage becomes decisive
  once Ethereum gas rises to normal or congested levels (5 to 20 gwei), where a
  registration is roughly **30x to 125x more expensive on Ethereum**.
- Registering a DKIM key, the core recurring action, costs about
  **$0.013 on Kusama vs $0.01 to $1.79 on Ethereum** (Ethereum is gas-dependent).
- Revoking a key, now domain-scoped and reversible (see the ERC-7969 compliance
  fix), is a storage-*clearing* write rather than a fresh one. On Paseo this
  triggers a full storage-deposit refund that **more than covers the execution
  cost** - the burner wallet's balance went *up* after calling revoke. See
  "Revoke refund" below.

## Methodology

- A throwaway burner wallet was funded from public faucets on both testnets; no
  project or owner key was used. The benchmark script asserts the signer equals
  the expected burner address before sending any transaction.
- Each operation's cost is captured two ways: `gasUsed x effectiveGasPrice`
  (the reported gas fee) and the wallet's native-balance delta before and after
  the transaction. For every operation except `revokeDKIMPublicKeyHash` on
  Paseo, the two matched exactly, confirming no separate PolkaVM storage
  deposit hides outside the reported gas fee. `revokeDKIMPublicKeyHash` is the
  exception - see "Revoke refund" below.
- Domain and key arguments are arbitrary `bytes32` values; gas depends on the
  storage writes, not on the values, so they are representative of real
  registrations.

## Measured results (facts)

| Operation | Sepolia gas | Sepolia fee (ETH) | Paseo gas (PolkaVM) | Paseo fee (PAS) |
| --- | ---: | ---: | ---: | ---: |
| Deploy | 432,844 | 0.00048070 | 416,197 | 0.416197 |
| `setDKIMPublicKeyHash` | 48,111 | 0.00004908 | 4,196 | 0.004196 |
| `setDKIMPublicKeyHashes` (x3) | 98,119 | 0.00010675 | 10,758 | 0.010758 |
| `revokeDKIMPublicKeyHash` | 25,895 | 0.00002772 | 0 (see below) | 0.000000 |
| Read (`isKeyHashValid`) | 0 (view) | 0 | 0 (view) | 0 |

> Raw `gasUsed` is **not** directly comparable across EVM and PolkaVM (different
> metering units), and the two testnets run at different gas prices (Sepolia
> about 1 gwei, Paseo a fixed 1000-gwei-equivalent). Only the USD figures below
> are comparable across chains.

### Revoke refund on Paseo

The previous (pre-review) contract's revocation was a global, permanent
blacklist: `revokeDKIMPublicKeyHash` wrote a *new* non-zero storage slot
(`revokedDKIMPublicKeyHashes[key] = true`), a plain SSTORE with a real,
un-refunded cost (measured at 4,010 PolkaVM gas in the original benchmark).

The current, ERC-7969-compliant contract instead does
`delete _keyHashes[domainHash][keyHash]` - clearing a slot that was
previously `true` back to its zero value. That's a storage-*clearing*
operation, and on Paseo it triggers a refund that more than covers the
execution cost: the raw RPC receipt reports `gasUsed: 0`, and the burner
wallet's real balance **increased** by `0.0011147249 PAS` over the call
(verified directly against the transaction receipt, not just the script's
output). At the KSM price used below, that's roughly **+$0.0034** net to the
caller, not a cost.

This means the "Kusama" column below shows `$0.0000` for revoke - which
understates it. The true cost is negative (a net refund), but the fee-based
projection this table uses can't represent that, since it derives everything
from `gasUsed x price`. Read the revoke row as "free or better," not "exactly
free."

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

Price inputs captured **2026-07-24**: ETH = $1,860, KSM = $3.09, Ethereum
mainnet gas about 0.162 gwei (live, Etherscan).

### USD per operation

| Operation | Ethereum @0.16 gwei | Ethereum @5 gwei | Ethereum @20 gwei | Kusama |
| --- | ---: | ---: | ---: | ---: |
| Deploy | $0.130 | $4.025 | $16.102 | $1.286 |
| `setDKIMPublicKeyHash` | $0.015 | $0.447 | $1.790 | $0.0130 |
| `setDKIMPublicKeyHashes` (x3) | $0.030 | $0.913 | $3.650 | $0.0332 |
| `revokeDKIMPublicKeyHash` | $0.008 | $0.241 | $0.963 | $0.0000 (see "Revoke refund" above; true cost is negative) |

Both columns are projections from testnet gas, not mainnet measurements. Ethereum:
gas measured on Sepolia, costed at the stated mainnet gas price and live ETH price.
Kusama: gas measured on Paseo, costed at the measured Paseo gas price and live KSM price.

### Scenario: deploy + register 100 domains (1 deploy + 100 single sets)

| | Ethereum @0.16 gwei | Ethereum @5 gwei | Ethereum @20 gwei | Kusama |
| --- | ---: | ---: | ---: | ---: |
| Total | $1.58 | $48.77 | $195.07 | $2.58 |

## Caveats

- **Gas units are not comparable across VMs.** EVM gas and PolkaVM gas meter
  different things; compare USD, not gas.
- **Ethereum testnet gas price is not representative.** Sepolia ran at about
  1 gwei; mainnet varies. The USD table uses live mainnet gas (about 0.16 gwei)
  plus 5 and 20 gwei scenarios so the gas-dependence is explicit. At the current
  very low gas, Ethereum deploy is even slightly cheaper than the Kusama
  projection; the PolkaVM advantage is a function of Ethereum congestion.
- **Kusama is projected, not measured.** Milestone 1 deployed to Paseo, not
  Kusama. The projection assumes Kusama Asset Hub uses the same PolkaVM
  weight-to-fee as Paseo; only the token price is swapped. If Kusama's fee
  multiplier differs, its figures scale accordingly. A direct Kusama Asset Hub
  measurement would remove this assumption.
- **Prices are a snapshot.** Token prices and gas move; re-run to refresh.
- **Storage deposit:** for every operation except `revokeDKIMPublicKeyHash`,
  balance delta equals the reported gas fee - no hidden deposit. Revoke is the
  exception: it clears a storage slot rather than writing one, and the
  resulting refund shows up in the balance delta but not in `gasUsed` (see
  "Revoke refund" above). The balance-delta method is exactly what caught this;
  a `gasUsed`-only measurement would have silently mis-reported it as $0.00.

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

Re-run after the ERC-7969 compliance fixes, with a fresh burner
(`0xFd096EC4FC759D4075fBb4F3e4D9203E12765742`). The two chains track nonces
independently and this burner's Paseo nonce wasn't at 0 by the time of this
run, so the two deployments landed at different addresses this time (unlike
the original run, where a coincidental nonce-0-on-both-chains produced a
shared address):

- Paseo: `0xc5A33346bA4C418BFe686498b1B986FE66BD51e4`, viewable on
  [Blockscout](https://blockscout-testnet.polkadot.io/address/0xc5A33346bA4C418BFe686498b1B986FE66BD51e4)
- Sepolia: `0xD35c9bd494d825Fa707a21e5d50B9813db41E280`, viewable on
  [Etherscan](https://sepolia.etherscan.io/address/0xD35c9bd494d825Fa707a21e5d50B9813db41E280)

Paseo Asset Hub (`420420417`), on [Blockscout](https://blockscout-testnet.polkadot.io):

- deploy: [`0xc8a687f0a17748c6a55f96f9a0ef755654eff107d0c124dd18c5a6f557af0ec8`](https://blockscout-testnet.polkadot.io/tx/0xc8a687f0a17748c6a55f96f9a0ef755654eff107d0c124dd18c5a6f557af0ec8)
- `setDKIMPublicKeyHash`: [`0x726d80429ac4dcc91dbe71447db3409829a817a8dec78abc376ff0f02b9b6adf`](https://blockscout-testnet.polkadot.io/tx/0x726d80429ac4dcc91dbe71447db3409829a817a8dec78abc376ff0f02b9b6adf)
- `setDKIMPublicKeyHashes`: [`0x563e8ce8b279cd249cbfb4bddfe0936112f961232828e71b911183d2d33b77ff`](https://blockscout-testnet.polkadot.io/tx/0x563e8ce8b279cd249cbfb4bddfe0936112f961232828e71b911183d2d33b77ff)
- `revokeDKIMPublicKeyHash`: [`0x8469b271911c34f3f1a76b17e571f379f84a514e3d862d85da7fffea81a5dace`](https://blockscout-testnet.polkadot.io/tx/0x8469b271911c34f3f1a76b17e571f379f84a514e3d862d85da7fffea81a5dace) - the refund transaction, see "Revoke refund" above

Ethereum Sepolia (`11155111`), on [Etherscan](https://sepolia.etherscan.io):

- deploy: [`0x3d5780a62c1de5f1b3808d9f32ab69fb081fe77c18fc769dc15ec34145b34f93`](https://sepolia.etherscan.io/tx/0x3d5780a62c1de5f1b3808d9f32ab69fb081fe77c18fc769dc15ec34145b34f93)
- `setDKIMPublicKeyHash`: [`0x75dac8d9b00262b22ddf99722eb21104ae913cab08605fa503ed2524b1e25fa1`](https://sepolia.etherscan.io/tx/0x75dac8d9b00262b22ddf99722eb21104ae913cab08605fa503ed2524b1e25fa1)
- `setDKIMPublicKeyHashes`: [`0xbc8ac42c20f4f924dc45a537ed95a061b080bdd720dcedca48868ef5787f5689`](https://sepolia.etherscan.io/tx/0xbc8ac42c20f4f924dc45a537ed95a061b080bdd720dcedca48868ef5787f5689)
- `revokeDKIMPublicKeyHash`: [`0x5513422eeaba83f97d07c50579293ae4a0306884368efe1a7f4f6cfef207e8d3`](https://sepolia.etherscan.io/tx/0x5513422eeaba83f97d07c50579293ae4a0306884368efe1a7f4f6cfef207e8d3)
