# Package Overviews
This document provides an overview of the three main packages that make up ZK Email Verifier. Each package serves a specific purpose in the process of verifying DKIM signatures in emails using zero-knowledge proofs.


## zk-email/helpers
The `@zk-email/helpers` package provides a comprehensive suite of utility functions aimed at facilitating the creation of inputs for zk circuits.

**Key Considerations:**
- **Essential for Verification Circuits:** Vital in generating the inputs required for the verification circuits.
- **Functionality:** Includes functions for handling RSA signatures, public keys, email bodies, and hashes.
- **Core Function:** Developers are encouraged to become acquainted with the `generateCircuitInputs` function located in the `input.helpers.ts` file, a cornerstone of the SDK's operation.

#### Helper Files Overview

**binaryFormat.ts**
- **Purpose:** Contains utility functions for binary data manipulation, facilitating conversions between various data types and formats such as Uint8Array, BigInt, and character arrays.
- **Key Functions:**
  - `bigIntToBin`: Converts a BigInt to a binary string.
  - `binToBigInt`: Converts a binary string to a BigInt.
  - `bigIntToUint8Array`: Converts a BigInt to a Uint8Array.
  - `uint8ArrayToBigInt`: Converts a Uint8Array to a BigInt.

**constants.ts**
- **Purpose:** Defines constants utilized across the helper functions, specifying the maximum allowed lengths for the email header and body when padded.
- **Constants:**
  - `MAX_HEADER_LENGTH`: Maximum length for the email header when padded.
  - `MAX_BODY_LENGTH`: Maximum length for the email body when padded.

**dkim.ts**
- **Purpose:** Offers functions for parsing and verifying DKIM signatures within emails.
- **Key Functions:**
  - `parseDKIMSignature`: Parses a DKIM signature from an email header.
  - `verifyDKIMSignature`: Verifies a DKIM signature, extracting necessary information for the verification process.

**input-helpers.ts**
- **Purpose:** Houses the `generateCircuitInputs` function, pivotal to the SDK's functionality. This function is responsible for generating the necessary inputs for the zk circuits, including the RSA signature, public key, email body, and body hash.

**shaHash.ts**
- **Purpose:** Provides functions for SHA-256 hash management.
- **Key Functions:**
  - `padSHA256Data`: Pads data to align with SHA-256 block requirements.
  - `computePartialSHA256Hash`: Computes a partial SHA-256 hash for a specified input and initial hash value.
  - `computeFullSHA256Hash`: Computes a full SHA-256 hash for a specified input.

**dkim/index.ts**

- **Purpose:** Provides functionality for verifying DKIM signatures within emails, crucial for authenticating the sender's domain and ensuring the email content's integrity.
- **Key Functions:**

 **`verifyDKIMSignature`:** Attempts to verify the DKIM signature of an email to authenticate its sender and content. It can optionally revert common changes made by email forwarders that might cause the original DKIM signature to fail.
  - **Parameters:**
    - `email`: The email content to be verified, provided as a `Buffer` or a `string`
    - `domain`: An optional domain name for verification, useful if the DKIM signature is signed by a different domain than the one in the email's From address.
    - `tryRevertARCChanges`: A flag indicating whether to attempt reverting changes made by email forwarders, defaulting to true.
  - **Returns:** A `Promise` resolving to a `DKIMVerificationResult` object, which includes details such as the public key, signature, message, body, and other relevant verification outcomes.

## zk-email/contracts

The @zk-email/contracts package contains the main contract of the SDK, `DKIMRegistry.sol`. This Solidity contract serves as a registry for storing the hash of the DomainKeys Identified Mail (DKIM) public key for each domain.

Key considerations:
- The `DKIMRegistry.sol` contract maintains a record of the DKIM key hashes for public domains. The hash is calculated by taking the Poseidon hash of the DKIM key split into 9 chunks of 242 bits each.

- The contract provides functions for registering, revoking, and validating DKIM public key hashes.

- It emits events upon successful registration (`DKIMPublicKeyHashRegistered`) and revocation (`DKIMPublicKeyHashRevoked`) of DKIM public key hashes.


- The `DKIMRegistry` contract is used in conjunction with the `EmailVerifier` circuit to verify emails. The `EmailVerifier` circuit checks the DKIM signature of an email against the DKIM public key hash stored in the `DKIMRegistry` contract for the email's domain.

## zk-email/circuits
The zk-email/circuits package provides pre-built circuits for generating proofs and verifying DKIM signatures. These circuits are designed to be used with the zk-email/helpers package to generate the necessary inputs.

Key considerations:
- the `email-verifier.circom` file is a standard template that can be used for email verification and customized for specific applications
- It processes DKIM headers and employs Regex for pattern matching in emails.
- By default, inputs are kept private unless stated otherwise, while outputs are always made public.
- Upon obtaining the vkey and zkey, you can establish a `verifier.sol `contract, enabling on-chain proof verification!

## **Circuit Helpers**
The `circuits` directory includes a `helpers` folder, which houses a variety of Circom helper templates. These templates are instrumental in constructing your primary circuit file.

### **base64.circom**: 
The base64.circom file is a part of the zk-email/circuits package and provides functionality for decoding base64 encoded data within arithimetic circuits. 

**Overview**

It includes two templates:
- Base64Lookup: Converts a base64 character into its 6-bit binary representation.

- Base64Decode: Decodes a base64 encoded string into binary data.

**Importing**

To use these templates in your Circom program, you need to import the base64.circom file. Here's how you can do it:

```bash
include "path/to/base64.circom"
```

Replace "path/to/base64.circom" with the actual path to the base64.circom file.

### **extract.circom**: 

The extract.circom file is part of the zk-email/circuits package. It provides a set of utilities for manipulating signal arrays within arithmetic circuits.

**Overview**

The file includes several templates:

`PackBytes(max_in_signals, max_out_signals, pack_size)`

A template that packs a number of chunks (i.e., number of char signals that fit into a signal) from the input signals into the output signals.

Inputs:

- in: An array of signals to be packed.
- max_in_signals: The maximum number of input signals.
- max_out_signals: The maximum number of output signals.
- pack_size: The number of chunks to be packed into a signal.

Outputs:

- out: An array of packed signals.

`VarShiftLeft(in_array_len, out_array_len)`

A template that shifts the input signals left by a variable size of bytes.

Inputs:

- in: An array of signals to be shifted.
- shift: The number of bytes to shift.
- in_array_len: The length of the input array.
- out_array_len: The length of the output array.

Outputs:

- out: An array of shifted signals.

`VarShiftMaskedStr(in_array_len, out_array_len)`

Similar to VarShiftLeft, but it assumes the input is the masked bytes and checks that shift is the first index of the non-masked bytes.

Inputs:

- in: An array of masked signals to be shifted.
- shift: The number of bytes to shift.
- in_array_len: The length of the input array.
- out_array_len: The length of the output array.

Outputs:

- out: An array of shifted signals.

`ClearSubarrayAfterEndIndex(n, nBits)`

A template that clears a subarray after a specified end index.

Inputs:

- in: An array of signals.
- end: The end index.

Outputs:

- out: An array of signals with the subarray after the end index cleared.

`ShiftAndPack(in_array_len, max_substr_len, pack_size)`

A template that shifts the input signals left by a variable size of bytes and packs the shifted bytes into fields under a specified pack size.

Inputs:

- in: An array of signals to be shifted and packed.
- shift: The number of bytes to shift.
- in_array_len: The length of the input array.
- max_substr_len: The maximum length of the substring.
- pack_size: The number of chunks to be packed into a signal.

Outputs:

- out: An array of shifted and packed signals.

`ShiftAndPackMaskedStr(in_array_len, max_substr_len, pack_size)`

Similar to ShiftAndPack, but it assumes the input is the masked bytes and checks that shift is the first index of the non-masked bytes.

Inputs:

- in: An array of masked signals to be shifted and packed.
- shift: The number of bytes to shift.
- in_array_len: The length of the input array.
- max_substr_len: The maximum length of the substring.
- pack_size: The number of chunks to be packed into a signal.

Outputs:

- out: An array of shifted and packed signals.

**Importing**

To use these templates in your Circom program, you need to import the extract.circom file. Here's how you can do it:

```bash
include "path/to/extract.circom"
```

Replace "path/to/extract.circom" with the actual path to the extract.circom file.

### Recent updates: zk-email-verify audit fixes

We've recently completed an audit of our circom helper templates. We've addressed each issue raised in the audit and have listed the corresponding PRs below for you to see the fixes in detail.

- Missing constraint for illegal characters: [PR#103](https://github.com/zkemail/zk-email-verify/pull/103)
- Incorrect use of division operation: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104/commits/531f9c2b811cc06a935cb80a17311d28e3662871)
- Missing range checks for output signals: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104/commits/9c14d51f130bb0cb0cf6eecb4945cbc5ff72f48a)
- Missing constraints for a signal input: [PR#104](https://github.com/zkemail/zk-email-verify/commit/4d4128c9980336d7f6dc0dcc7e1458203af15b4d)
- Missing constraints for output signals: [PR#104](https://github.com/zkemail/zk-email-verify/commit/4d4128c9980336d7f6dc0dcc7e1458203af15b4d)
- Issue with value retrieval in the LongToShortNoEndCarry: [PR#104](https://github.com/zkemail/zk-email-verify/pull/104)


[Usage Guide >](/docs/zkEmailDocs/UsageGuide/README.md)