# Package Overviews
This document provides an overview of the three main packages that make up ZK Email Verifier. The packages are zk-email/helpers, contracts and circuits. Each package serves a specific purpose in the process of verifying DKIM signatures in emails using zero-knowledge proofs.

## Recent updates: zk-email-verify audit fixes

We've recently completed an audit of our circom helper templates and addressed each issue raised. For a detailed PDF report of the findings and the fixes implemented, please refer to the [zk-email audit report](/docs/zkemail-audit-report.pdf). The corresponding PRs listed below provide an in-depth view of the changes made.

- Missing constraint for illegal characters: [PR#103](https://github.com/zkemail/zk-email-verify/pull/103)
- Incorrect use of division operation: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104/commits/531f9c2b811cc06a935cb80a17311d28e3662871)
- Missing range checks for output signals: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104/commits/9c14d51f130bb0cb0cf6eecb4945cbc5ff72f48a)
- Missing constraints for a signal input: [PR#104](https://github.com/zkemail/zk-email-verify/commit/4d4128c9980336d7f6dc0dcc7e1458203af15b4d)
- Missing constraints for output signals: [PR#104](https://github.com/zkemail/zk-email-verify/commit/4d4128c9980336d7f6dc0dcc7e1458203af15b4d)
- Issue with value retrieval in the LongToShortNoEndCarry:[PR#104](https://github.com/zkemail/zk-email-verify/pull/104)
## zk-email/helpers
The @zk-email/helpers package offers a set of utility functions designed to assist in the creation of inputs for zk circuits. 

Key considerations:
- This package is essential for generating the necessary inputs for the verification circuits.
- It includes functions for handling RSA signatures, public keys, email bodies, and hashes.
- Developers should familiarize themselves with the generateCircuitInputs function in the `input.helpers.ts` file, which is central to the operation of the SDK.

## zk-email/circuits
The zk-email/circuits package provides pre-built circuits for generating proofs and verifying DKIM signatures. These circuits are designed to be used with the zk-email/helpers package to generate the necessary inputs.

Key considerations:
- the `email-verifier.circom` file is a standard template that can be used for email verification and customized for specific applications
- It processes DKIM headers and employs Regex for pattern matching in emails.
- By default, inputs are kept private unless stated otherwise, while outputs are always made public.



## zk-email/contracts
The @zk-email/contracts package contains Solidity contracts that are used for email verification. These contracts are designed to be modified for each use case, allowing for flexibility in their application.

The `DKIMRegistry.sol` contract contains hash of the DKIM keys for public domains

Key considerations:
- After compiling your circuit, snarkjs will generate a Solidity file named `verifier.sol`. This file allows you to verify your proof on-chain.



[Usage Guide >](/docs/zkEmailDocs/UsageGuide/README.md)