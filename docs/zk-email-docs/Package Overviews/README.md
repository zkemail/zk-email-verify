# Packages
This document provides an overview of the three main packages that make up ZK Email Verifier. Each package serves a specific purpose in the process of verifying DKIM signatures in emails using zero-knowledge proofs.

## zk-email/circuits
The zk-email/circuits package provides pre-built circuits for generating proofs and verifying DKIM signatures. These circuits are designed to be used with the zk-email/helpers package to generate the necessary inputs.

Key considerations:
- the `email-verifier.circom` file is a standard template that can be used for email verification and customized for specific applications
- It processes DKIM headers and employs Regex for pattern matching in emails.
- By default, inputs are kept private unless stated otherwise, while outputs are always made public.
- Upon obtaining the vkey and zkey, you can establish a `verifier.sol `contract, enabling on-chain proof verification!

For further information, refer to the [circuits README](/packages/circuits/README.md).


## zk-email/helpers
The `@zk-email/helpers` package provides a comprehensive suite of utility functions aimed at facilitating the creation of inputs for zk circuits. The main file is `input-generators.ts` which helps you generate the inputs to your circuit.

For further information, refer to the [helpers README](/packages/helpers/README.md).

## zk-email/contracts
The `@zk-email/contracts` package offers Solidity contracts and libraries for managing DKIM public key hashes and providing string manipulation utilities. Key files include:

- **DKIMRegistry.sol**: A contract for registering, validating, and revoking DKIM public key hashes to ensure email authenticity.
- **StringUtils.sol**: A library offering functions for string conversion, comparison, and manipulation, aiding in data handling across contracts.

For further information, refer to the [contracts README](/packages/contracts/README.md).


### Recent updates: zk-email-verify audit fixes

We've recently completed an audit of our circom helper templates. We've addressed each issue raised in the audit and have listed the corresponding PRs below for you to see the fixes in detail.

- Missing constraint for illegal characters: [PR#103](https://github.com/zkemail/zk-email-verify/pull/103)
- Incorrect use of division operation: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104/commits/531f9c2b811cc06a935cb80a17311d28e3662871)
- Missing range checks for output signals: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104/commits/9c14d51f130bb0cb0cf6eecb4945cbc5ff72f48a)
- Missing constraints for a signal input: [PR#104](https://github.com/zkemail/zk-email-verify/commit/4d4128c9980336d7f6dc0dcc7e1458203af15b4d)
- Missing constraints for output signals: [PR#104](https://github.com/zkemail/zk-email-verify/commit/4d4128c9980336d7f6dc0dcc7e1458203af15b4d)
- Issue with value retrieval in the LongToShortNoEndCarry: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104)


[Usage Guide >](/docs/zkEmailDocs/UsageGuide/README.md)