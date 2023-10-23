# Email Verifier Documentation

## Overview

Welcome to the documentation for Zk Email Verify, an application designed to enable secure email signature verification while safeguarding sensitive information. Utilize our SDKs to anonymously verify specific text within an email or authenticate emails sent to/from specific domains. This comprehensive guide equips you with the necessary tools to construct privacy-preserving email proofs.

## Components

### Email Verifier

The email verifier is the core component of the Zk Email Verify application. It verifies the authenticity of an email signature while preserving the privacy of the user. The email verifier is implemented in the `email-verifier.circom` file.

### Input Helpers

The input helpers are a set of functions that help generate inputs for the email verifier and DKIM verifier. These functions are implemented in the `input-helpers.ts` file.

### Contracts

The contracts directory contains the smart contracts for the Zk Email Verify application. These contracts are implemented in the `contracts` directory.



## Installation

To get started with the Zk Email Verify system, follow these steps to install the required packages:

1. Open your terminal or command prompt.

2. Run the following command to install the @zk-email/circuits package:
```
npm i @zk-email/circuits
```
3. Run the following command to install the @zk-email/contracts package:
```
npm i @zk-email/contracts
```

4. Run the following command to install the @zk-email/helpers package:

```
npm i @zk-email/helpers
```


## Understanding the Codebase

## Generating a Proof of Email

## Testing


## Contributin