# @zk-email/circuits
The `circuits` package exports the circom circuits needed for building on ZK Email. 

All circuits in this package are libraries that can be imported to your circom project (i.e this package does not contain a `main` circuit).

<br />

## Installation 
```
yarn add @zk-email/circuits
```

<br />

## EmailVerifier Circuit

[`EmailVerifier`](./email-verifier.circom "Email Verifier Circuit") is the primary circuit exported from `@zk-email/circuits` which is used for proving the signature of the input email is valid. 

### Usage:

Import to your circuit file like below. 
```
include "@zk-email/circuits/email-verifier.circom";
```

- **Parameters**:
  - `maxHeadersLength`: Maximum length for the email header.
  - `maxBodyLength`: Maximum length for the email body.
  - `n`: Number of bits per chunk the RSA key is split into. Recommended to be 121.
  - `k`: Number of chunks the RSA key is split into. Recommended to be 17.
  - `ignoreBodyHashCheck`: Set 1 to skip body hash check in case data to prove/extract is only in the headers.
  - `enableHeaderMasking`: Set 1 to turn on header masking.
  - `enableBodyMasking`: Set 1 to turn on body masking.
  - `removeSoftLineBreaks`: Set 1 to remove soft line breaks (`=\r\n`) from the email body.
  
  `Note`: We use these values for n and k because their product (n * k) needs to be more than 2048 (RSA constraint) and n has to be less than half of 255 to fit in a circom signal.

- **Input Signals**:
  - `emailHeader[maxHeadersLength]`: Email headers that are signed (ones in `DKIM-Signature` header) as ASCII int[], padded as per SHA-256 block size.
  - `emailHeaderLength`: Length of the email header including the SHA-256 padding.
  - `pubkey[k]`: RSA public key split into k chunks of n bits each.
  - `signature[k]`: RSA signature split into k chunks of n bits each.
  - `emailBody[maxBodyLength]`: Email body after the precomputed SHA as ASCII int[], padded as per SHA-256 block size.
  - `emailBodyLength`: Length of the email body including the SHA-256 padding.
  - `bodyHashIndex`: Index of the body hash `bh` in the `emailHeader`.
  - `precomputedSHA[32]`: Precomputed SHA-256 hash of the email body till the bodyHashIndex.
  - `headerMask[maxHeadersLength]`: Mask to be applied on the `emailHeader`.
  - `bodyMask[maxBodyLength]`: Mask to be applied on the `emailBody`.
  - `decodedEmailBody[maxBodyLength]`: Decoded email body after removing soft line breaks.

  **Output Signal** 
  - `pubkeyHash`: Poseidon hash of the pubkey - Poseidon(n/2)(n/2 chunks of pubkey with k*2 bits per chunk).
  - `maskedHeader[maxHeadersLength]`: Masked email header.
  - `maskedBody[maxBodyLength]`: Masked email body.
<br/>

## **Libraries**
This section contains a template library located in the `@zk-email/circuits/lib` directory. These templates are important for building your main circuit (EmailVerifier).

These templates are used in the `EmailVerifier` circuit, and can also be used in a wide range of ZK projects, even those not directly related to ZK Email.

### `lib/rsa.circom`

<details>
<summary>
RSAVerifier65537: Verifies RSA signatures with exponent 65537.
</summary>

- **[Source](lib/rsa.circom#L13-L39)**
- **Parameters**
  - `n`: Number of bits per chunk the modulus is split into. Recommended to be 121.
  - `k`: Number of chunks the modulus is split into. Recommended to be 17.
- **Inputs**: 
  - `message[k]`: The message that was signed.
  - `signature[k]`: The signature to verify.
  - `modulus[k]`: The modulus of the RSA key (pubkey).

</details>


### `lib/sha.circom`

<details>
<summary>
Sha256Bytes: Computes the SHA256 hash of input bytes.
</summary>

- **[Source](lib/sha.circom#L17-L38)**
- **Parameters**
  - `maxByteLength`: Maximum length of the input bytes.
- **Inputs**:
  - `paddedIn[maxByteLength]`: Message to hash padded as per the SHA256 specification.
  - `paddedInLength`: Length of the message in bytes including padding.
- **Output**:
  - `out[256]`: The 256-bit hash of the input message.

</details>


<details>
<summary>
Sha256BytesPartial: Computes the SHA256 hash of input bytes with a precomputed state.
</summary>

- **[Source](lib/sha.circom#L41-L79)**
- **Parameters**
  - `maxByteLength`: Maximum length of the input bytes.
- **Inputs**:
  - `paddedIn[maxByteLength]`: Message to hash padded as per the SHA256 specification.
  - `paddedInLength`: Length of the message in bytes including padding.
  - `preHash[32]`: The precomputed state of the hash.
- **Output**:
  - `out[256]`: The 256-bit hash of the input message.

</details>


### `lib/base64.circom`

<details>
<summary>
Base64Decode: Decodes a base64 encoded string into binary data.
</summary>

- **[Source](lib/base64.circom#L11-L61)**
- **Inputs**:
  - `in`: The base64 encoded string to decode.
  - `N`: The expected length of the output binary data.
- **Outputs**:
  - `out`: The decoded binary data.

</details>

## Utils
This section provides an overview of utility circom templates available in the `@zk-email/circuits/utils` directory. These templates assist in the construction of ZK circuits for various applications beyond the core ZK Email functionalities.

> Important: When using these templates outside of zk-email, please ensure you read the assumptions on the input signals that are documented above each template source code. You would need to constrain the inputs accordingly before you pass them to these utility circuits.

### `utils/array.circom`

<details>
<summary>
AssertZeroPadding: Asserts that the input array is zero-padded from the given `startIndex`.
</summary>

- **[Source](utils/array.circom#L154-L172)**
- **Parameters**:
  - `maxArrayLen`: The maximum number of elements in the input array.
- **Inputs**:
  - `in`: The input array.
  - `startIndex`: The index from which the array should be zero-padded.

</details>

<details>
<summary>
ItemAtIndex: Selects an item at a given index from the input array.
</summary>

- **[Source](utils/array.circom#L15-L42)**
- **Parameters**:
  - `maxArrayLen`: The number of elements in the array.
- **Inputs**:
  - `in`: The input array.
  - `index`: The index of the element to select.
- **Output**:
  - `out`: The selected element.

</details>

<details>
<summary>
CalculateTotal: Calculates the sum of an array.
</summary>

- **[Source](utils/array.circom#L54-L67)**
- **Parameters**:
  - `n`: The number of elements in the array.
- **Inputs**:
  - `nums`: The input array.
- **Output**:
  - `sum`: The sum of the input array.

</details>

<details>
<summary>
SelectSubArray: Selects a subarray from an array given a `startIndex` and `length`.
</summary>

- **[Source](utils/array.circom#L80-L104)**
- **Parameters**:
  - `maxArrayLen`: The maximum number of bytes in the input array.
  - `maxSubArrayLen`: The maximum number of integers in the output array.
- **Inputs**:
  - `in`: The input byte array.
  - `startIndex`: The start index of the subarray.
  - `length`: The length of the subarray.
- **Output**:
  - `out`: Array of `maxSubArrayLen` size, items starting from `startIndex`, and items after `length` set to zero.

</details>

<details>
<summary>
VarShiftLeft: Shifts input array by `shift` indices to the left.
</summary>

- **[Source](utils/array.circom#L116-L140)**
- **Parameters**:
  - `maxArrayLen`: The maximum length of the input array.
  - `maxOutArrayLen`: The maximum length of the output array.
- **Inputs**:
  - `in`: The input array.
  - `shift`: The number of indices to shift the array to the left.
- **Output**:
  - `out`: Shifted subarray.

</details>


### `utils/bytes.circom`

<details>
<summary>
PackBytes: Packs an array of bytes to numbers that fit in the field.
</summary>

- **[Source](utils/bytes.circom#L28-L60)**
- **Inputs**:
  - `in`: The input byte array.
  - `maxBytes`: The maximum number of bytes in the input array.
- **Outputs**:
  - `out`: The output integer array after packing.

</details>

<details>
<summary>
PackByteSubArray: Selects a sub-array from the input array and packs it to numbers that fit in the field.
</summary>

- **[Source](utils/bytes.circom#L72-L93)**
- **Inputs**:
  - `in`: The input byte array.
  - `startIndex`: The start index of the sub-array.
  - `length`: The length of the sub-array.
  - `maxArrayLen`: The maximum number of elements in the input array.
  - `maxSubArrayLen`: The maximum number of elements in the sub-array.
- **Outputs**:
  - `out`: The output integer array after packing the sub-array.
</details>

<details>
<summary>
DigitBytesToInt: Converts a byte array representing digits to an integer.
</summary>

- **[Source](utils/bytes.circom#L102-L117)**
- **Inputs**:
  - `in`: The input byte array - big-endian digit string of `out`.
  - `n`: The number of bytes in the input array.
- **Outputs**:
  - `out`: The output integer after conversion.
</details>

<details>
<summary>
AssertBit: Asserts that a given input is binary.
</summary>

- **[Source](utils/bytes.circom#L1-L7)**
- **Inputs**:
  - `in`: An input signal, expected to be 0 or 1.
- **Outputs**:
  - None. This template will throw an assertion error if the input is not binary.

</details>

<details>
<summary>
ByteMask: Masks an input array using a binary mask array.
</summary>

- **[Source](utils/bytes.circom#L9-L25)**
- **Parameters**:
  - `maxLength`: The maximum length of the input and mask arrays.
- **Inputs**:
  - `in`: An array of signals representing the body to be masked.
  - `mask`: An array of signals representing the binary mask.
- **Outputs**:
  - `out`: An array of signals representing the masked input.
</details>

### `utils/constants.circom`

<details>
<summary>
Constants: Defines a set of constants used across various circom circuits for standardizing sizes and lengths of different data types.
</summary>

- **[Source](utils/constants.circom)**
- **Constants**:
  - `EMAIL_ADDR_MAX_BYTES()`: Returns the maximum byte size for an email, defined as 256.
  - `DOMAIN_MAX_BYTES()`: Returns the maximum byte size for a domain, defined as 255.
  - `MAX_BYTES_IN_FIELD()`: Returns the maximum number of bytes that can fit in a field, defined as 31.

</details>


### `utils/functions.circom`

<details>
<summary>
log2Ceil: Calculate log2 of a number and round it up
</summary>

- **[Source](utils/functions.circom#L2-L10)**
- **Inputs**:
  - `a`: The input number for which the `ceil(log2())` needs to be calculated.
- **Outputs**:
  - Returns `ceil(log2())` of the input number.
</details>


### `utils/hash.circom`

<details>
<summary>
PoseidonLarge: Circuit to calculate Poseidon hash of inputs more than 16.
</summary>

- **[Source](utils/hash.circom#L13-L37)**
- **Inputs**:
  - `in[chunkSize]`: The input array of chunkSize elements.
  - `bytesPerChunk`: Number of bits in each chunk.
  - `chunkSize`: Number of chunks in input.
- **Outputs**:
  - `out`: Poseidon hash of input where consecutive elements are merged.
</details>


### `utils/regex.circom`

<details>
<summary>
SelectRegexReveal: Selects the reveal part of a byte array that matches a regular expression.
</summary>

- **[Source](utils/regex.circom#L15-L50)**
- **Inputs**:
  - `in`: The input byte array.
  - `startIndex`: The index of the start of the reveal part in the input array.
  - `maxArrayLen`: The maximum length of the input array.
  - `maxRevealLen`: The maximum length of the reveal part.
- **Outputs**:
  - `out`: The revealed data array that matches the regular expression.
</details>

<details>
<summary>
PackRegexReveal: Packs the reveal data from a regex match into an integer array.
</summary>

- **[Source](utils/regex.circom#L60-L77)**
- **Inputs**:
  - `in`: The input byte array.
  - `startIndex`: The index of the start of the reveal part in the input array.
  - `maxArrayLen`: The maximum length of the input array.
  - `maxRevealLen`: The maximum length of the reveal part.
- **Outputs**:
  - `out`: The packed integer array after processing the reveal data.
</details>

## Helpers
This section contains helper circom templates in` @zk-email/circuits/helpers` that you can use to build on top of ZK Email.

### `helpers/email-nullifier.circom`

<details>

<summary>
EmailNullifier: Calculates the email nullifier using Poseidon hash.
</summary>

- **[Source](helpers/email-nullifier.circom#L15-L23)**
- **Parameters**:
  - `bitPerChunk`: The number of bits per chunk the signature is split into.
  - `chunkSize`: The number of chunks the signature is split into.
- **Inputs**:
  - `signature[chunkSize]`: The signature of the email.
- **Output**:
  - `out`: The email nullifier.
</details>

### `helpers/remove-soft-line-breaks.circom`

<details>
<summary>
RemoveSoftLineBreaks: Verifies the removal of soft line breaks from an encoded input string.
</summary>

- **[Source](helpers/remove-soft-line-breaks.circom)**
- **Parameters**:
  - `maxLength`: The maximum length of the input strings.
- **Inputs**:
  - `encoded[maxLength]`: An array of ASCII values representing the input string with potential soft line breaks.
  - `decoded[maxLength]`: An array of ASCII values representing the expected output after removing soft line breaks.
- **Outputs**:
  - `isValid`: A signal that is 1 if the decoded input correctly represents the encoded input with soft line breaks removed, 0 otherwise.

</details>