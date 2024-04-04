# @zk-email/circuits Package Overview
The `circuits` package provides circom helper templates, featuring `email-verifier.circom` for primary circuit construction, alongside a range of helper circuits within `@zk-email/circuits/helpers` for circuit creation.

## Installation 
```
yarn add @zk-email/circuits
```
## Core Email Verifier

#### How to Import:
To use the Core Email Verifier in your project, include it with the following line in your circom file:
```
include "@zk-email/circuits/email-verifier.circom";
```

### EmailVerifier
The `EmailVerifier` is the primary circuit template in the `@zk-email/circuits` package designed for generating zero-knowledge proofs of email data. It leverages helper templates from the same package and external libraries to facilitate the verification process.

#### How to use:
The `email-verifier.circom` template accepts several parameters and input signals for its operation:

- **Parameters**:
  - `max_header_bytes`: Maximum size of the email header. Should be a multiple of 64. The size of does not change much.
  - `max_body_bytes`: Maximum size of the email body. Adjust as needed for emails with extensive content.
  - `n` and `k`: Big integer parameters for RSA, where the number is divided into `k` chunks, each of size `n` bits.
  - `ignore_body_hash_check`: A flag to skip the body hash check if `true`, useful for projects not requiring verification of the body contents.

- **Input Signals**:
  - `in_padded`: Prehashed email data, including padding.
  - `pubkey`: The RSA public key, split into `k` parts of `n` bits each.
  - `signature`: The RSA signature, also divided into `k` parts.
  - `in_len_padded_bytes`: Length of the input email data including padding.


### Libraries
The Core Email Verifier incorporates a variety of helper circom templates from the zk-email circuits package, including:

#### `rsa.circom`
This component is responsible for verifying RSA signatures as part of the email verification process.

- **Inputs**:
  - `base_message`: The message (usually the hash of the email header) to verify the signature against.
  - `modulus`: The RSA modulus, part of the public key.
  - `signature`: The RSA signature to verify.

- **Outputs**:
  - Verification result: Indicates whether the signature is valid for the given message and public key.

- **How to Use**:
  To use the RSAVerifier, include it in your circuit and provide the necessary inputs as described. The verifier will output whether the signature is valid.

#### `sha.circom`

The `sha.circom` template enables SHA-256 hashing in arithmetic circuits. It comprises `Sha256Bytes` for hashing byte arrays and `Sha256BytesPartial` for hashing with a known partial pre-hash state, converting byte arrays to bit arrays, executing SHA-256 hashing, and producing a 256-bit hash array.

- **Templates**:
    - ` Sha256Bytes`: This template performs SHA-256 hashing on byte arrays, ideal for email headers, bodies, or any data within circuit limits.
        - **Inputs**:
            - `in_padded`: Byte array for hashing, padded per SHA-256 standards.
            - `in_len_padded_bytes`: Length of the padded input in bytes.
        - **Output**:
            - SHA-256 hash of the input as a 256-bit array.
        - **How to use**:
            - Include `Sha256Bytes` in your circuit with the required inputs to obtain the SHA-256 hash.

    - `Sha256BytesPartial`:Enables hashing with a known partial pre-hash state for optimization.
        - **Inputs**:
            - `in_padded`: Byte array for hashing, appropriately padded.
            - `in_len_padded_bytes`: Length of the padded input in bytes.
            - `pre_hash`: 32-byte array of the partial pre-hash state.
        - **Output**:
            - SHA-256 hash of the input, considering the pre-hash state, as a 256-bit array.

        - **How to use**:
            - Use `Sha256BytesPartial` with the specified inputs, including the pre-hash state, for the optimized SHA-256 hash.

#### `base64.circom`

This component decodes base64 encoded data within arithmetic circuits. It provides two main templates: `Base64Lookup` for converting a base64 character into its 6-bit binary representation, and `Base64Decode` for decoding a base64 encoded string into binary data.

- **Templates**:
  - `Base64Lookup`: Converts a single base64 character into its corresponding 6-bit binary representation.
    - **Inputs**:
      - `in`: The base64 character to convert.
    - **Outputs**:
      - `out`: The 6-bit binary representation of the input character.
  - `Base64Decode`: Decodes a base64 encoded string into binary data.
    - **Inputs**:
      - `in`: The base64 encoded string to decode.
      - `N`: The expected length of the output binary data.
    - **Outputs**:
      - `out`: The decoded binary data.

- **How to Use**:
  - To decode base64 encoded data, include the `Base64Decode` template in your circuit and provide the encoded string as input. The template will output the decoded binary data.
  - For converting individual base64 characters to their binary representation, use the `Base64Lookup` template with the character as input.

#### `extract.circom`

This file provides a set of utilities for manipulating signal arrays within arithmetic circuits. It includes several templates for packing and shifting signals, such as `PackBytes`, `VarShiftLeft`, `VarShiftMaskedStr`, `ClearSubarrayAfterEndIndex`, `ShiftAndPack`, and `ShiftAndPackMaskedStr`.

- **Templates**:
    - `PackBytes`: Packs an array of signals into a smaller array based on a specified pack size.
        - **Inputs**:
            - `max_in_signals`: The maximum number of input signals.
            - `max_out_signals`: The maximum number of output signals.
            - `pack_size`: The number of signals to pack into one output signal.
        - **Output**:
            - Packed array of signals.

    - `VarShiftLeft`: Shifts an array of signals to the left by a variable number of positions.
        - **Inputs**:
            - `in_array_len`: Length of the input array.
            - `out_array_len`: Length of the output array.
            - `shift`: Number of positions to shift.
        - **Output**:
            - Shifted array of signals.

    - `VarShiftMaskedStr`: Similar to `VarShiftLeft`, but designed for shifting masked strings.
        - **Inputs**:
            - Same as `VarShiftLeft`.
        - **Output**:
            - Shifted array of signals, considering masked positions.

    - `ClearSubarrayAfterEndIndex`: Clears a subarray of signals after a specified end index.
        - **Inputs**:
            - `n`: Length of the input array.
            - `nBits`: Bit length of the index.
            - `end`: The end index after which signals will be cleared.
        - **Output**:
            - Array of signals with the subarray cleared.

    - `ShiftAndPack`: Combines shifting and packing operations.
        - **Inputs**:
            - `in_array_len`: Length of the input array.
            - `max_substr_len`: Maximum length of the substring to be shifted and packed.
            - `pack_size`: The number of signals to pack into one output signal.
        - **Output**:
            - Shifted and packed array of signals.

    - `ShiftAndPackMaskedStr`: Similar to `ShiftAndPack`, but designed for masked strings.
        - **Inputs**:
            - Same as `ShiftAndPack`.
        - **Output**:
            - Shifted and packed array of signals, considering masked positions.

- **How to Use**:
    - To manipulate signal arrays within your circuits, include the desired template from `extract.circom` with the necessary inputs. Each template serves a specific manipulation purpose, such as shifting or packing signals, which can be utilized according to your circuit's requirements.

#### `utils.circom`

The `utils.circom` file encompasses a variety of utility templates and functions crucial for arithmetic and logical operations within circom circuits. These utilities support operations ranging from basic arithmetic to complex signal manipulations.

- **Templates and Functions**:
    - **`log2(a)` and `log2_ceil(a)`**: Compute the base-2 logarithm and its ceiling of a given number `a`, facilitating operations that require power-of-two calculations.
        - **Usage**: Determine the size of arrays or circuits dynamically based on input sizes.
    - **`count_packed(n, chunks)`**: Calculates the minimum number of chunks needed to pack `n` items, given a chunk size, optimizing data storage and manipulation.
        - **Usage**: Useful in packing and unpacking operations where efficiency in signal representation is crucial.
    - **`Packed2Bytes(n)` and `Bytes2Packed(n)`**: Facilitate the packing and unpacking of signals into bytes, with `n` specifying the number of bytes per signal.
        - **Usage**: Critical for bit-level data manipulation and optimizing signal storage within circuits.
    - **`QuinSelector(choices, bits)`**: Selects one out of several choices based on an input index, using a specified number of bits for the selection process.
        - **Usage**: Enhances decision-making capabilities within circuits by enabling dynamic selection based on circuit inputs.
    - **`AssertZeroes(in_array_len)`**: Asserts that all elements in an array are zeroes from a specified start index onwards, ensuring data integrity and correctness.
        - **Usage**: Important for validating the correctness of circuit operations and ensuring that padding or unused signals do not affect circuit outcomes.
    - **`MakeAnonEmailSalt(email_len, blinder_len)`**: Generates an anonymous salt for email addresses using a blinder, providing privacy and security.
        - **Usage**: Utilized in circuits requiring anonymization of sensitive data, such as email addresses, to protect user privacy.

### Utilities
These utility templates in circom are used to support the creation of zk proofs, extending beyond the confines of our predefined code.

#### `bytes2ints.circom`

This component converts an array of bytes into an array of integers, considering a specified packing size.
- **Template**:
  - `Bytes2Ints`: Converts an array of bytes into an array of integers.
    - **Inputs**:
      - `bytes_size`: The size of the input byte array.
    - **Outputs**:
      - `ints`: The resulting array of integers after conversion.

- **How to Use**:
  - To convert byte data to integer format, include the `Bytes2Ints` template in your circuit and provide the byte array as input. The template will output the corresponding array of integers, packed according to the specified packing size.

#### `constants.circom`

This file defines a set of constants used across various circom circuits for standardizing sizes and lengths of different data types.
- **Constants**:
  - `email_max_bytes_const()`: Defines the maximum byte size for an email.
  - `domain_len_const()`: Specifies the length for a domain.
  - `invitation_code_len_const()`: Sets the length for an invitation code.
  - `field_pack_bits_const()`: Determines the number of bits for packing fields.
  - `pack_bytes_const()`: Specifies the number of bytes for packing.
  - `timestamp_len_const()`: Defines the length of a timestamp.

#### `digit2int.circom`

Converts a big-endian digit string into an integer.
- **Template**:
  - `Digit2Int(n)`: Converts a digit string of length `n` into an integer.
    - **Inputs**:
      - `in[n]`: The input digit string.
    - **Outputs**:
      - `out`: The resulting integer.

#### `hex2int.circom`

Converts a big-endian hexadecimal string into an integer or field element.
- **Templates**:
  - `Hex2Field()`: Converts a 64-character hex string into a field element.
    - **Inputs**:
      - `in[64]`: The input hex string.
    - **Outputs**:
      - `out`: The resulting field element.
  - `Hex2Ints(n)`: Converts a hex string of length `n` into an array of integers.
    - **Inputs**:
      - `in[n]`: The input hex string.
    - **Outputs**:
      - `out[bytes]`: The resulting array of integers.
