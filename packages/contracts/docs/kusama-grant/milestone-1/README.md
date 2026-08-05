# Kusama Grant - Milestone 1

Milestone 1 scope for `packages/contracts`.

## Milestone 1 - DKIM Registry on Testnet

- Primary goal: recompile DKIM Registry to PolkaVM bytecode and deploy a functional registry on Paseo testnet (Paseo Assethub).

## Deliverables

| #   | Name                   | Description                                                                                                                           | Deliverable                                                                                                         | What was done / Proof                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Planning & Review      | Review existing DKIM registry contracts, determine PolkaVM compilation requirements, and have an implementation plan                  | A reviewed DKIM Registry implementation plan, including contract adjustments, deployment steps, and key risks.      | Reviewed the DKIM Registry, scoped the PolkaVM/`resolc` build, and wrote an implementation plan covering contract adjustments, deployment steps, risks, and a sign-off checklist. **Proof:** [`01_planning_review.md`](./01_planning_review.md).                                                                                                                                                     |
| 2   | DKIM Registry Contract | Recompile the DKIM Registry Solidity contracts using the resolc compiler and prepare deployment tooling compatible with Paseo testnet | Prepared smart contracts and tooling to compile and deploy the DKIM Registry to PolkaVM                             | Recompiled [`DKIMRegistry.sol`](../../src/DKIMRegistry.sol) to PolkaVM bytecode via `resolc` (`@parity/hardhat-polkadot`) using [`hardhat.config.ts`](../../hardhat.config.ts), with a Hardhat Ignition deployment module ([`hh-ignition/modules/DKIMRegistry.ts`](../../hh-ignition/modules/DKIMRegistry.ts)). **Proof:** [`01_planning_review.md`](./01_planning_review.md) (Tooling Adjustments). |
| 3   | Tests                  | Automated tests validating DKIM key registration, rotation, revocation, and correct registry behavior                                 | Automated tests validating DKIM key registration, rotation, revocation, and correct registry behavior using Foundry | Foundry [unit](../../test/unit/DKIMRegistry) and [integration](../../test/integration/DKIMRegistry) suites covering registration, rotation, revocation, batch registration, access control, and cross-domain behavior (`yarn test:unit` / `yarn test:integration`). **Proof:** [`02_tests_and_results.md`](./02_tests_and_results.md).                                                               |
| 4   | Deployment             | DKIM Registry deployment to Paseo testnet                                                                                             | A functioning DKIM Registry deployed to Paseo testnet                                                               | `DKIMRegistry` deployed and live on Paseo Assethub (chain `420420417`) at `0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE`, viewable on [Blockscout](https://blockscout-testnet.polkadot.io/address/0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE). **Proof:** [`03_deployment_evidence.md`](./03_deployment_evidence.md).                                                                                 |
| 5   | Documentation          | Include documentation with public how-tos                                                                                             | Docs with usage instructions                                                                                        | Public how-to covering prerequisites, wallet funding, build, test, deploy, and a read-only registry smoke-check example. **Proof:** [`04_public_howto.md`](./04_public_howto.md).                                                                                                                                                                                                                    |

## Evidence Index

- [`01_planning_review.md`](./01_planning_review.md) - reviewed implementation plan, contract adjustments, risks, and checklist.
- [`02_tests_and_results.md`](./02_tests_and_results.md) - unit/integration Foundry test commands and result evidence.
- [`03_deployment_evidence.md`](./03_deployment_evidence.md) - deployed contract evidence for Paseo Assethub.
- [`04_public_howto.md`](./04_public_howto.md) - public usage instructions for setup, build, test, deploy, and a smoke-check example.
- [`05_cost_benchmarks.md`](./05_cost_benchmarks.md) - gas and USD cost comparison of the registry operations on Ethereum vs Kusama.

## Current Milestone 1 Status

- Planning & Review: `Delivered`
- DKIM Registry Contract: `Delivered`
- Tests: `Delivered`
- Deployment: `Delivered`
- Documentation: `Delivered`
