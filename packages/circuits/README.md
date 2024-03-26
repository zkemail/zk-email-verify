## Overview
The `circuits` package is a collection of helper templates located in the `helpers` folder. These templates are essential for building your primary circuit file.

Additionally, the package includes an `email-verifier.circom` file. This file is a standard template designed for email verification, and it can be tailored to meet specific application requirements.

## Circuit Helpers Overview
The `circuits` package includes 10 helper templates that are instrumental in constructing the `email-verifier.circom` file. Here's a brief overview of each:

### base64.circom

This template decodes base64 encoded data within arithmetic circuits. It comprises two templates: `Base64Lookup` (converts a base64 character into its 6-bit binary representation) and `Base64Decode` (decodes a base64 encoded string into binary data).

### extract.circom

This file provides a set of utilities for manipulating signal arrays within arithmetic circuits.

 It includes several templates for packing and shifting signals, such as `PackBytes`, `VarShiftLeft`, `VarShiftMaskedStr`, `ClearSubarrayAfterEndIndex`, `ShiftAndPack`, and `ShiftAndPackMaskedStr`.

### rsa.circom

This template implements the RSA (Rivest–Shamir–Adleman) algorithm, a cornerstone of public key cryptography. It includes templates for key generation, encryption, and decryption.

### sha.circom
This template implements the SHA (Secure Hash Algorithm) family of cryptographic hash functions, which take an input and return a fixed-size string of bytes, typically a message digest.

### bigint.circom

This template provides functionality for performing arithmetic operations on big integers, such as addition and subtraction modulo 2^n.

### bigint_func.circom

This template offers utility functions for handling big integers within arithmetic circuits, performing various mathematical operations on large numbers represented across multiple registers.

### sha256general.circom

This template implements the SHA-256 cryptographic hash function, taking an input signal array representing the message to be hashed and producing an output signal array representing the message digest.

### sha256partial.circom

This template provides a partial implementation of the SHA-256 cryptographic hash function, useful when the initial part of the message to be hashed is known in advance.

### fp.circom

This template provides functionality for performing arithmetic operations in finite fields, fundamental for many cryptographic protocols.

### utils.circom

The `utils.circom` file includes a collection of utility templates and functions that are used across multiple circuits. These utilities cover a wide range of functionalities, including bit manipulation, comparison, conversion, and arithmetic operations in finite fields. It serves as a foundational component for building complex arithmetic circuits.

## Utility templates

### bytes2ints.circom

This template converts an array of bytes into an array of integers. It is designed to handle inputs of any byte size and outputs integers based on the number of bytes specified. This is particularly useful for processing large binary data within arithmetic circuits. Specifically, the template is configured to transform 31 bytes into one integer, aligning with circoms maximum field value which is a 31-byte number. It uses little endian order for representation. 
### constants.circom

This file defines a set of constants used across various templates within the `circuits` package. These constants include maximum sizes for emails, domains, and timestamps, as well as specifications for packing bytes into field elements.

### digit2int.circom

The `Digit2Int` template converts an array of digit characters (0-9) into their corresponding integer representation. This is useful for processing numeric data that is input as a sequence of characters.

### hex2int.circom

This template provides functionality for converting hexadecimal strings into their integer representation. It supports conversion of both lowercase (a-f) and uppercase (A-F) hexadecimal characters. This is essential for processing hexadecimal data within arithmetic circuits.



## Overview of email-verifier.circom

The `email-verifier.circom` file is a comprehensive template designed for email verification. It is engineered to process DKIM headers and utilizes Regex for pattern matching within emails.

It imports the `base64.circom`, `rsa.circom`, `sha.circom`, and `extract.circom` files.

### Parameters

The `EmailVerifier` template accepts several parameters:

- `max_header_bytes` and `max_body_bytes`: Define the maximum size of the email header and body, respectively. These values should be multiples of 64.
- `n` and `k`: Represent the big integer parameters for RSA. The number is divided into `k` chunks, each of size `n` bits.
- `ignore_body_hash_check`: A flag that, when set, allows the body hash check to be skipped. This is useful for projects that do not require verification of the body contents.

### Input Signals

The template also accepts several input signals:

- `in_padded`: Represents the prehashed email data, which includes up to 512 + 64 bytes of padding pre SHA256, and is padded with 0s at the end after the length.
- `pubkey`: The RSA public key, verified with a smart contract + DNSSEC proof. It's divided into `k` parts, each of `n` bits.
- `signature`: The RSA signature, divided into `k` parts, each of `n` bits.
- `in_len_padded_bytes`: The length of the input email data including the padding, which will inform the SHA256 block length.

### Operations

The template performs several operations:

- Calculates the SHA256 hash of the header, which is the "base message" that is RSA signed.
- Verifies the RSA signature.
- If `ignore_body_hash_check` is not set to 1, it extracts the body hash from the header and verifies that the hash of the body matches the hash in the header.
- Calculates the Poseidon hash of the DKIM public key and produces it as an output. This can be used to verify the public key is correct in a contract without requiring the actual key.



For a more in-depth understanding, please visit our zk Email Verify repository at https://github.com/zkemail/zk-email-verify.

