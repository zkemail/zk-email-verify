# Packages

This document provides an overview of the three main packages that make up ZK Email Verifier. The packages are `zk-email/circuits`, `zk-email/helpers`, and `zk-email/contracts`. Each package serves a specific purpose in the process of verifying DKIM signatures in emails using zero-knowledge proofs.

Check out the documentation for each package to learn more:

- For circom circuit templates and proof generation: [@zk-email/circuits](/packages/circuits/README.md)
- To access helper functions for generating inputs: [@zk-email/helpers](/packages/helpers/README.md)
- Solidity contracts for blockchain interactions: [@zk-email/contracts](/packages/contracts/README.md)

### Recent updates: zk-email-verify audit fixes

We've recently completed an audit of our circom helper templates. We've addressed each issue raised in the audit and have listed the corresponding PRs below for you to see the fixes in detail.

- Missing constraint for illegal characters: [PR#103](https://github.com/zkemail/zk-email-verify/pull/103)
- Incorrect use of division operation: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104/commits/531f9c2b811cc06a935cb80a17311d28e3662871)
- Missing range checks for output signals: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104/commits/9c14d51f130bb0cb0cf6eecb4945cbc5ff72f48a)
- Missing constraints for a signal input: [PR#104](https://github.com/zkemail/zk-email-verify/commit/4d4128c9980336d7f6dc0dcc7e1458203af15b4d)
- Missing constraints for output signals: [PR#104](https://github.com/zkemail/zk-email-verify/commit/4d4128c9980336d7f6dc0dcc7e1458203af15b4d)
- Issue with value retrieval in the LongToShortNoEndCarry: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104)


[Usage Guide >](/docs/zkEmailDocs/UsageGuide/README.md)