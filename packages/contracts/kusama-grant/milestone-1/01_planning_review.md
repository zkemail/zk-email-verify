# 01 - Planning and Review

This document is the Milestone 1 planning and review artifact for the DKIM Registry delivery.

## Scope

- Deliver a working `DKIMRegistry` on Paseo Assethub (`420420417`).
- Use PolkaVM-compatible Hardhat setup and `resolc`.
- Provide Foundry automated tests for DKIM lifecycle behavior.
- Provide reproducible deployment and verification instructions.

## Contract and Tooling Adjustments

- Core contract used for milestone scope:
  - `packages/contracts/src/DKIMRegistry.sol`
- PolkaVM and resolc configuration:
  - `packages/contracts/hardhat.config.ts`
  - `@parity/hardhat-polkadot` plugin enabled
  - `resolc.version = 0.5.0`
  - optimizer enabled with `runs = 10000`
- Deployment module:
  - `packages/contracts/hh-ignition/modules/DKIMRegistry.ts`
- Test execution scripts:
  - `packages/contracts/package.json` -> `test:unit`, `test:integration`

## Delivery Plan Executed

1. Validate DKIMRegistry contract behavior and access control.
2. Implement and restructure Foundry tests into `test/unit` and `test/integration`.
3. Add integration tests for registration, rotation, revocation, and behavior.
4. Confirm deployment evidence for Paseo Assethub contract address.
5. Publish grant-focused documentation bundle.

## Risks and Mitigations

- Risk: source-code verification is not yet supported for PolkaVM (`resolc`) deployments by the explorer or Hardhat verify tooling.
  - Mitigation: documented the limitation; the contract remains fully visible and exercisable on Blockscout, and verification can be revisited once resolc support lands.
- Risk: ambiguity about deployment artifacts in git.
  - Mitigation: define canonical source of truth as documented address table and deployment evidence doc; artifacts remain locally generated and git-ignored by default.
- Risk: lifecycle test interpretation gaps.
  - Mitigation: explicit unit and integration test coverage for registration, rotation, revocation, and access control.

## Review Checklist

- [x] DKIM Registry contract exists and is scoped for milestone.
- [x] PolkaVM/resolc build configuration exists.
- [x] Foundry unit tests exist under `test/unit`.
- [x] Foundry integration tests exist under `test/integration`.
- [x] Paseo deployment address evidence is captured.
- [x] Public how-to documentation is present.

## Sign-off

- Technical scope validated against Milestone 1 deliverables.
- Evidence docs assembled under `packages/contracts/kusama-grant`.
