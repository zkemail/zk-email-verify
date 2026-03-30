# Kusama Grant - Milestone 1

Milestone 1 scope for `packages/contracts`.

## Milestone 1 - DKIM Registry on Testnet

- Primary goal: recompile DKIM Registry to PolkaVM bytecode and deploy a functional registry on Paseo testnet (Paseo Assethub).

## Deliverables

| #   | Name                   | Description                                                                                                                           | Deliverable                                                                                                         |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Planning & Review      | Review existing DKIM registry contracts, determine PolkaVM compilation requirements, and have an implementation plan                  | A reviewed DKIM Registry implementation plan, including contract adjustments, deployment steps, and key risks.      |
| 2   | DKIM Registry Contract | Recompile the DKIM Registry Solidity contracts using the resolc compiler and prepare deployment tooling compatible with Paseo testnet | Prepared smart contracts and tooling to compile and deploy the DKIM Registry to PolkaVM                             |
| 3   | Tests                  | Automated tests validating DKIM key registration, rotation, revocation, and correct registry behavior                                 | Automated tests validating DKIM key registration, rotation, revocation, and correct registry behavior using Foundry |
| 4   | Deployment             | DKIM Registry deployment to Paseo testnet                                                                                             | A functioning DKIM Registry deployed to Paseo testnet                                                               |
| 5   | Documentation          | Include documentation with public how-tos                                                                                             | Docs with usage instructions                                                                                        |

## Evidence Index

- `01_planning_review.md` - reviewed implementation plan, contract adjustments, risks, and sign-off checklist.
- `02_tests_and_results.md` - unit/integration Foundry test commands and result evidence.
- `03_deployment_evidence.md` - deployed contract evidence for Paseo Assethub.
- `04_public_howto.md` - public usage instructions for setup, build, test, deploy, and verification.

## Current Milestone 1 Status

- Planning & Review: `Delivered`
- DKIM Registry Contract: `Delivered`
- Tests: `Delivered`
- Deployment: `Delivered`
- Documentation: `Delivered`
