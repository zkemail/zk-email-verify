# Welcome to ZK-Email
![My Image](public/zkEmailLogo.jpg)

ZK Email is an application that allows for anonymous verification of email signatures while masking specific data. It enables verification of emails to/from specific domains or subsets of domains, as well as verification based on specific text in the email body. This technology can be used for web2 interoperability, decentralized anonymous KYC, or to create interesting on-chain anonymity sets.

**For ZK Email, the function we care about is**
```
DKIM = RSA_verify(sha_hash(header | sha_hash(body)), pk)
```

Visit our [docs](/docs/README.md) to learn more about the project and how to build on top of zkEmail.
## Installation
To get started with the ZK Email Verifier, follow these steps:
1. Install the `@zk-email/helpers` package:
```shell
npm install @zk-email/helpers
```
2. Install the `@zk-email/contracts` package:
```shell
npm install @zk-email/contracts
```

3. Install the `@zk-email/circuits` package:
```shell
npm install @zk-email/circuits
```
## Package Overviews

The ZK Email Verifier codebase consists of three main packages:

### `@zk-email/helpers`

The `@zk-email/helpers` package provides utility functions for email verification and cryptographic operations. It includes functions for handling RSA signatures, public keys, email bodies, and hashes. The `generateCircuitInputs` function in the `input.helpers.ts` file is particularly important, as it is central to the operation of the SDK.
### `@zk-email/circuits`

The `@zk-email/circuits` package offers pre-built circuits for generating proofs and verifying DKIM signatures. These circuits are designed to be used in conjunction with the `@zk-email/helpers` package to generate the necessary inputs. The `email-verifier.circom` file serves as a template for email verification and can be customized for specific applications. It reads DKIM headers using regular expressions.

### `@zk-email/contracts`

The `@zk-email/contracts` package contains Solidity contracts used for email verification. These contracts can be modified to suit different use cases, providing flexibility in their application. The `DKIMRegistry.sol` contract specifically contains the hash of DKIM keys for public domains. After compiling the circuit, `snarkjs` generates a Solidity file named `verifier.sol`, which allows for on-chain proof verification.

## Filetree Description
We follow a monorepo architecture where packages are located in the `packages` folder. There are core reusable packages which is for general ZK email verification


```bash
packages/
  circuits/ # groth16 zk circuits
    regexes/ # Generated regexes
    helpers/ # Common helper circom circuits imported in email circuits
    test/ # Circom tests for circuit
  
  contracts # Solidity contracts for Email verification

  helpers # Helper files for DKIM verification, input generation, etc.
  ```