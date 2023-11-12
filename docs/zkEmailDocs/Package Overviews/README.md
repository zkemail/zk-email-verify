# Package Overviews
This document provides an overview of the three main packages that make up ZK Email Verifier. Each package serves a specific purpose in the process of verifying DKIM signatures in emails using zero-knowledge proofs.

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