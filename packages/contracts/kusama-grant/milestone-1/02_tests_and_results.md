# 02 - Tests and Results

Milestone 1 test evidence for DKIM key registration, rotation, revocation, and registry behavior using Foundry.

## Test Layout

- Unit tests:
  - `packages/contracts/test/unit/DKIMRegistry`
- Integration tests:
  - `packages/contracts/test/integration/DKIMRegistry`

## Deliverable Mapping

- Registration: covered by DKIMRegistry unit + integration tests.
- Rotation: covered by DKIMRegistry unit revoke/rotation scenario + integration lifecycle scenario.
- Revocation: covered by DKIMRegistry unit + integration tests.
- Correct registry behavior: covered by batch and cross-domain behavior integration tests.

## Commands

From `packages/contracts`:

```bash
forge test --match-path "test/unit/**/*.t.sol"
forge test --match-path "test/integration/**/*.t.sol"
```

Or via package scripts:

```bash
yarn test:unit
yarn test:integration
```

## Results Snapshot

- Unit suite: passes (123 tests, 0 failed).
- Integration suite: passes (4 tests, 0 failed).
- Both suites now run in CI on every push via the `run_contracts_tests` job in `.github/workflows/action.yml`.
- Integration files:
  - `test/integration/DKIMRegistry/lifecycle.integration.t.sol`
  - `test/integration/DKIMRegistry/batch_and_behavior.integration.t.sol`

### Latest local run

```
Ran 15 test suites in 1.24s (204.54ms CPU time): 123 tests passed, 0 failed, 0 skipped (123 total tests)
```

```
Ran 2 test suites in 1.13s (19.14ms CPU time): 4 tests passed, 0 failed, 0 skipped (4 total tests)
```

## Key Assertions Proven

- Owner can register key hashes and set them valid for a domain.
- Rotation flow works: old key revoked, new key remains valid.
- Revocation invalidates key validity checks.
- Batch registration sets multiple keys.
- Access control prevents non-owner mutation calls.
- Global key revocation behavior across domains is consistent with contract logic.
