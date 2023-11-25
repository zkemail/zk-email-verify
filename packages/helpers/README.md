## Overview
The `helpers` package is a comprehensive SDK, written in TypeScript, that provides utility functions to facilitate various tasks within the application. Here's a brief overview of each module:

**binaryFormat.ts**: This module offers utility functions for converting between different binary formats, including string-to-byte, byte-to-string conversions, and packing bytes into N bytes.

**constants.ts**: This module defines various constants used throughout the application, including the Circom field modulus, maximum header and body padded bytes, and constants for RSA group signature verification.

**fast-sha256.ts**: This module provides a high-performance implementation of the SHA-256 hash function, used for hashing data in performance-critical sections of the application.

**input-helpers.ts**: This module offers utility functions for handling user input, including inserting a character before a newline in a Uint8Array, converting a raw email to a buffer, and finding an index in a Uint8Array.

**merkle.ts**: This module provides utility functions for working with Merkle trees, including building a Merkle tree and getting a Merkle proof.

**poseidonHash.ts**: This module provides an implementation of the Poseidon hash function, used for hashing data in parts of the application that require a cryptographic hash function.

**rsa.ts**: This module offers utility functions for working with RSA encryption, including a function for verifying RSA signatures.

**shaHash.ts**: This module provides an implementation of the SHA hash function, including functions for hashing data, partially hashing data, and padding data for SHA-256.

**sshFormat.ts**: This module offers utility functions for working with SSH formatted data, including unpacking SSH bytes, getting a raw signature from an SSH signature, and converting an SSH signature to a public key.

**dkim/index.ts**: This module provides utility functions for working with DKIM signatures, including functions for verifying DKIM signatures, and types related to DKIM verification results and options.

For a more in-depth understanding, please visit our zk Email Verify repository at https://github.com/zkemail/zk-email-verify.
