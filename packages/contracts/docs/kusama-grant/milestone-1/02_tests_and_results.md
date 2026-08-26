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

- Unit suite: passes (129 tests, 0 failed).
- Integration suite: passes (4 tests, 0 failed).
- Both suites now run in CI on every push via the `run_contracts_tests` job in `.github/workflows/action.yml`.
- Integration files:
  - `test/integration/DKIMRegistry/lifecycle.integration.t.sol`
  - `test/integration/DKIMRegistry/batch_and_behavior.integration.t.sol`

### CI run

Example passing `run_contracts_tests` job (2026-08-25): https://github.com/zkemail/zk-email-verify/actions/runs/32847587963/job/97800794835. For the current state of the branch, see the [Actions tab](https://github.com/zkemail/zk-email-verify/actions/workflows/action.yml?query=branch%3Akusama-grant).

## Key Assertions Proven

- Owner can register key hashes and set them valid for a domain.
- Rotation flow works: old key revoked, new key remains valid.
- Revocation invalidates key validity checks and is scoped to the domain it was revoked for (a key revoked on one domain remains valid on others).
- A revoked key hash can be re-registered afterward, including through the batch path.
- Batch registration sets multiple keys, rejects an empty array, and rejects a zero key hash (atomically, per transaction).
- Access control prevents non-owner mutation calls, asserted against the specific `OwnableUnauthorizedAccount` error.
