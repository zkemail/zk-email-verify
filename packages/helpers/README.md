# @zk-email/helpers

The `@zk-email/helpers` package provides utility functions for email verification and cryptographic operations. It includes functions for handling RSA signatures, public keys, email bodies, and hashes.

## Installation

```
yarn add @zk-email/helpers
```

### input-generators.ts

The `input-generators.ts` file provides functions for generating inputs to the EmailVerifier circuit from raw email content or DKIM verification results. It includes utilities for padding, hashing, and preparing data.

**How to Import**:

```typescript
import { generateEmailVerifierInputs } from "@zk-email/helpers"
```

**Inputs**:

For every email, the following inputs are mandatory for the EmailVerifier circuit:
- `emailHeader`: An array of strings representing the email header.
- `emailHeaderLength`: A string representing the length of the email header.
- `pubkey`: An array of strings representing the public key used for verification in an email.
- `signature`: An array of strings representing the RSA-signature of an email.

Additionally, the `InputGenerationArgs` include optional parameters that can be adjusted based on the verification requirements:
- `ignoreBodyHashCheck`: A boolean indicating whether to skip the email body contents.
- `shaPrecomputeSelector`: A string used to select parts of the email body for SHA precomputation.
- `maxHeadersLength`: The maximum length of the email header, including padding.
- `maxBodyLength`: The maximum length of the email body after SHA precomputation, including padding.

If the `ignoreBodyHashCheck` parameter is set to `false`, additional inputs related to the email body are required for a more thorough verification process. These include:
- `bodyHashIndex`: a string representing the index of the bodyHash.
- `emailBody`: An array of strings representing the email body.
- `emailBodyLength`: A string representing the length of the email body.
- `precomputedSHA`: An array of strings representing the precomputed SHA values.

**Functions**:
- [**generateEmailVerifierInputs**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/input-generators.ts#32-L42): Asynchronously generates circuit inputs for the EmailVerifier circuit from raw email content. It takes the full email content as a buffer or string and optional arguments to control the input generation, including `InputGenerationArgs`.

- [**generateEmailVerifierInputsFromDKIMResult**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/input-generators.ts#L52-L104): Generates circuit inputs for the EmailVerifier circuit from a DKIMVerification result. It processes the DKIM verification result and optional arguments, including `InputGenerationArgs`, to produce the necessary inputs for the EmailVerifier circuit.

The `input-generators.ts` file imports other helper functions from our helpers package. It imports from `binary-format.ts`, `constants.ts`, `dkim/index.ts`, and `sha-utils`.


### dkim/index.ts

The `dkim/index.ts` file contains utilities for verifying DKIM signatures of emails. It uses the `node-forge` library and includes custom sanitization logic `dkim/sanitizers.ts` to improve the chances of successful DKIM verification.

**Key Components**:

- **DKIMVerificationResult**: An interface that outlines the structure of the DKIM verification result, including the public key, signature, email headers, body, and other relevant information.

- **[verifyDKIMSignature](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/dkim/index.ts#L31-L102 "verifyDKIMSignature")**: A function that takes an email (as a string or buffer), an optional domain, and a flag to enable sanitization. It attempts to verify the DKIM signature of the email, applying sanitization if necessary and enabled. The function returns a promise that resolves to a `DKIMVerificationResult`.

- **[tryVerifyDKIM](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/dkim/index.ts#L104-L132 "tryVerifyDKIM")**: An internal function used by `verifyDKIMSignature` to perform the actual DKIM verification. It utilizes the `DkimVerifier` class from the modified `./mailauth` folder to process the email and extract DKIM verification results.

**Usage**:

To verify the DKIM signature of an email, import and call the `verifyDKIMSignature` function with the email content. Optionally, specify the domain to verify against and whether to enable sanitization. The function returns a promise with the verification result.


### binary-format.ts

The `binary-format.ts` file provides functions for converting between strings, byte arrays, and other binary formats. This is particularly useful for handling data encoding and decoding within an application.
- [**stringToBytes**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L8-L12): Converts a string into its byte representation.
- [**bytesToString**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L3-L5): Converts a byte array back into a string. Useful for decoding data received in binary format.

- [**bufferToUint8Array**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L31-L38): Converts a Node.js Buffer into a Uint8Array.

- [**bufferToHex**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L40-L42): Converts a Buffer to a hexadecimal string. This function is often used for displaying binary data in a readable format.

- [**Uint8ArrayToCharArray**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L44-L46): Converts a Uint8Array to an array of character strings. This is used in the `input-generators.ts` file.

- [**Uint8ArrayToString**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L48-L52): Asynchronously converts a Uint8Array to a string, with each byte represented as a separate character in the string.

- [**Uint8ArrayToHex**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L54-L56): Asynchronously converts a Uint8Array to a hexadecimal string. This is useful for encoding binary data as hex, a common format for displaying and transmitting binary data.

- [**bufferToString**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L58-L61): Converts a Buffer directly to a string using UTF-8 encoding. This function simplifies the process of converting buffer data to a readable format.

- [**bytesToBigInt**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L63-L69): Converts a byte array to a BigInt. This is helpful for cryptographic calculations that operate on large numbers.

- [**bigIntToChunkedBytes**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L71-L79): Converts a BigInt to an array of byte strings, chunked according to specified sizes. This function is useful for preparing BigInt values for operations that require fixed-size byte arrays.

- [**toCircomBigIntBytes**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L81-L83): Converts a BigInt to an array of bytes formatted for use with Circom. This is particularly useful when preparing data for zero-knowledge proofs in Circom and is used in the `input-generators.ts` file.

- [**toHex**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L113-L117): Converts a Uint8Array to a hexadecimal string efficiently. Useful to encode binary data as hex.

- [**fromHex**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L122-L138): Converts a hexadecimal string to a Uint8Array. This function is the inverse of `toHex` and is used for decoding hex-encoded data back into binary format.

- [**int64toBytes**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L141-L146): Converts a 64-bit number to a Uint8Array. Note: Effectively handles 32-bit integers, placing them in the lower 4 bytes of the 8-byte array due to JavaScript's limitations.

- [**int8toBytes**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L149-L154): Converts an 8-bit number (or a number that can fit within 8 bits) into a Uint8Array containing a single byte.

- [**bitsToUint8**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L156-L162): Converts an array of bit strings (e.g., ["1", "0", "1"]) into a Uint8Array where each bit string is parsed into its corresponding byte value.

- [**uint8ToBits**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L164-L166): Converts a Uint8Array into a string representation of its binary form. Each byte is represented as 8 bits in the resulting string.

- [**mergeUInt8Arrays**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L168-L174): Merges two Uint8Array instances into a single Uint8Array.

- [**assert**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L176-L180): Throws an error if the provided condition is false. This utility function is used to enforce certain conditions or invariants within the application.

- [**packedNBytesToString**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L182-L190): Converts an array of bigint values, each representing `n` bytes, back into a string.

- [**packBytesIntoNBytes**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/binary-format.ts#L192-L204): Packs a Uint8Array or string into an array of bigint values, with each bigint representing `n` bytes of the input.

### chunked-zkey.ts

The `chunked-zkey.ts` file provides functions for handling `.zkey` files, which are crucial for working with zk-SNARKs. These functions include downloading, storing, and uncompressing .zkey files, as well as generating and verifying proofs.

- [**uncompressGz**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/chunked-zkey.ts#L15-L21): Uncompresses a single `.gz` file and returns the contents as an `ArrayBuffer`.

- [**downloadFromFilename**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/chunked-zkey.ts#L44-L67): Downloads a compressed file from a remote server, stores it with `localforage` either as compressed or uncompressed, based on the specified parameter.

- [**downloadProofFiles**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/chunked-zkey.ts#L69-L96): Downloads all necessary proof files for a given circuit name from a base URL, handling both compressed and uncompressed formats.

- [**generateProof**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/chunked-zkey.ts#L98-L113): Generates a cryptographic proof for a given input using the `snarkjs` library.

- [**verifyProof**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/chunked-zkey.ts#L115-L131): Verifies a cryptographic proof against a set of public signals and a verification key.


- [**buildInput**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/chunked-zkey.ts#L172-L181): Builds the input for a cryptographic proof from a public key, message hash, and signature, converting each component into the required format.

### constants.ts

This file defines several constants, including `MAX_HEADER_PADDED_BYTES` and `MAX_BODY_PADDED_BYTES`, which are important for generating circuit inputs within `input-generators.ts`. The maximum header size remains relatively constant, whereas the body size can vary significantly.

For a list of all constants, visit: [constants.ts](./src/constants.ts)

### sha-utils.ts

This file contains utility functions for SHA hash operations and manipulation of Uint8Array instances.

- [**findIndexInUint8Array**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/sha-utils.ts#L5-L23): Searches for a Uint8Array within another Uint8Array and returns the index of the first occurrence.

- [**padUint8ArrayWithZeros**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/sha-utils.ts#L25-L30): Pads a Uint8Array with zeros until it reaches a specified length.

- [**generatePartialSHA**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/sha-utils.ts#L32-L79): Generates a partial SHA hash of a Uint8Array up to a specified index, optionally splitting the array based on a selector string and ensuring the remaining array does not exceed a maximum length.

- [**shaHash**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/sha-utils.ts#L81-L83): Computes the SHA-256 hash of a Uint8Array.

- [**partialSha**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/sha-utils.ts#L85-L88): Computes a partial SHA-256 hash of a Uint8Array, allowing for the hash state to be cached and reused.

- [**sha256Pad**](https://github.com/zkemail/zk-email-verify/blob/main/packages/helpers/src/sha-utils.ts#L91-L110): Pads a Uint8Array according to SHA-256 padding rules, appending a bit length and ensuring the total length is a multiple of 512 bits, suitable for SHA-256 processing.