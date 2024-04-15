# @zk-email/circuits Package Overview
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

- **Input Signals**:
  - `emailHeader[maxHeadersLength]`: Email headers that are signed (ones in `DKIM-Signature` header) as ASCII int[], padded as per SHA-256 block size.
  - `emailHeaderLength`: Length of the email header including the SHA-256 padding.
  - `pubkey[k]`: RSA public key split into k chunks of n bits each.
  - `signature[k]`: RSA signature split into k chunks of n bits each.
  - `emailBody[maxBodyLength]`: Email body after the precomputed SHA as ASCII int[], padded as per SHA-256 block size.
  - `emailBodyLength`: Length of the email body including the SHA-256 padding.
  - `bodyHashIndex`: Index of the body hash `bh` in the `emailHeader`.
  - `precomputedSHA[32]`: Precomputed SHA-256 hash of the email body till the bodyHashIndex.

  **Output Signal** 
  - `pubkeyHash`: Poseidon hash of the pubkey - Poseidon(n/2)(n/2 chunks of pubkey with k*2 bits per chunk).

<br/>

## **Libraries**
The package also exports circuits for some popular cryptographic protocols. 

They are used in `EmailVerifier` circuit for signature verification, but can also be used independently in other ZK projects (even when not using ZK Email).

### `@zk-email/circuits/lib/rsa.circom`

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


### `@zk-email/circuits/lib/sha.circom`

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


<details>
<summary>
Sha256General: A modified version of the SHA256 circuit that allows specified length messages up to a max to all work via array indexing on the SHA256 compression circuit.
</summary>

- **[Source](lib/sha.circom#L82-L202)**
- **Parameters**
  - `maxBitLength`: Maximum length of the input bits.
- **Inputs**:
  - `paddedIn[maxBitLength]`: Message to hash padded as per the SHA256 specification.
  - `paddedInLength`: Length of the message in bits including padding.
- **Output**:
  - `out[256]`: The 256-bit hash of the input message.

</details>


<details>
<summary>
Sha256Partial: Calculates the SHA256 hash of a message with a precomputed state.
</summary>

- **[Source](lib/sha.circom#L211-L299)**
- **Parameters**
  - `maxBitLength`: Maximum length of the input bits.
- **Inputs**:
  - `paddedIn[maxBitLength]`: Message to hash padded as per the SHA256 specification.
  - `paddedInLength`: Length of the message in bits including padding.
  - `preHash[256]`: The precomputed state of the hash.
- **Output**:
  - `out[256]`: The 256-bit hash of the input message.

</details>


---



### base64.circom
This component decodes base64 encoded data within arithmetic circuits, focusing on the conversion of base64 encoded strings into binary data.

**[`Base64Decode`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/lib/base64.circom#L11-L61)**: Decodes a base64 encoded string into binary data.
- **Inputs**:
    - `in`: The base64 encoded string to decode.
    - `N`: The expected length of the output binary data.
- **Outputs**:
    - `out`: The decoded binary data.

- **Usage**:
  - To decode base64 encoded data, include the `Base64Decode` template in your circuit and provide the encoded string as input. The template will output the decoded binary data.



## **Utilities**
These utility templates in circom are used to support the creation of zk proofs, extending beyond the confines of our predefined code.

### array.circom

**[` ItemAtIndex`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/array.circom#L15-L46 "ItemAtIndex")**: This template selects an item at a given index from the input array. It is based on the QuinSelector from MACI.

- **Parameters**:
  - `maxArrayLen`: The number of elements in the array.
- **Inputs**:
  - `in`: The input array.
  - `index`: The index of the element to select.
- **Output**:
  - `out`: The selected element.
- **Usage**:
  - To select an item from an array at a specific index, use the `ItemAtIndex` template by specifying the array and the index.

**[`CalculateTotal`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/array.circom#L54-L67 "CalculateTotal")**: This template calculates the sum of an array.

- **Inputs**:
  - `nums`: The input array.
- **Output**:
  - `sum`: The sum of the input array.
- **Usage**:
  - To calculate the total sum of an array, include the `CalculateTotal` template in your circuit and provide the array as input.

**[`SelectSubArray`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/array.circom#L80-L104)**: Extracts a segment from an array using a starting index (`startIndex`) and segment length (`length`), zeroing elements outside this range.

- **Parameters**:
  - `maxArrayLen`: The upper limit on the byte count within the input array.
  - `maxSubArrayLen`: The maximum count of integers allowed within the resultant sub-array.
- **Inputs**:
  - `in`: The byte array from which a segment is to be extracted.
  - `startIndex`: The array index at which the desired segment begins.
  - `length`: The extent of the segment, defined by the number of elements it encompasses.
- **Output**:
  - `out`: A `maxSubArrayLen`-sized array, populated starting from `startIndex` for the defined `length`, with subsequent elements reset to zero.
- **Usage**:
  - To isolate a segment from an array, the `SelectSubArray` template should be employed, specifying the original array, the commencement index, and the segment length.

**[`VarShiftLeft`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/array.circom#L116-L146)**:This template shifts an input array by `shift` indices to the left. The output array length can be reduced by setting `maxOutArrayLen`.

- **Parameters**:
  - `maxArrayLen`: The maximum length of the input array.
  - `maxOutArrayLen`: The maximum length of the output array.
- **Inputs**:
  - `in`: The input array.
  - `shift`: The number of indices to shift the array to the left.
- **Output**:
  - `out`: Shifted subarray.
- **Usage**:
  - To shift an array to the left by a specific number of indices, include the `VarShiftLeft` template in your circuit and specify the array and shift amount.

**[`AssertZeroPadding`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/array.circom#L154-L172)**: This template asserts that the input array is zero-padded from the given `startIndex`.

- **Parameters**:
  - `maxArrayLen`: The maximum number of elements in the input array.
- **Inputs**:
  - `in`: The input array.
  - `startIndex`: The index from which the array should be zero-padded.
- **Usage**:
  - To ensure an array is zero-padded from a specific index, use the `AssertZeroPadding` template by specifying the array and start index.



### bytes.circom

These templates are for converting byte arrays into integer arrays, considering specified packing sizes, and for packing byte arrays to numbers that fit in a field.

**[`PackBytes`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/bytes.circom#L28-L60 "PackBytes")**: Packs an array of bytes to numbers that fit in the field.
- **Inputs**:
  - `in`: The input byte array.
  - `maxBytes`: The maximum number of bytes in the input array.
- **Outputs**:
  - `out`: The output integer array after packing.
- **Usage**:
  - To pack byte data to integers, include the `PackBytes` template in your circuit and provide the byte array as input. The template will output the packed integer array.

**[`PackByteSubArray`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/bytes.circom#L72-L93 "PackByteSubArray")**: Selects a sub-array from the input array and packs it to numbers that fit in the field.
- **Inputs**:
  - `in`: The input byte array.
  - `startIndex`: The start index of the sub-array.
  - `length`: The length of the sub-array.
  - `maxArrayLen`: The maximum number of elements in the input array.
  - `maxSubArrayLen`: The maximum number of elements in the sub-array.
- **Outputs**:
  - `out`: The output integer array after packing the sub-array.
- **Usage**:
  - To pack a specific sub-array of byte data to integers, use the `PackByteSubArray` template by specifying the inputs, including the start index and length of the sub-array.

**[`DigitBytesToInt`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/bytes.circom#L102-L117 "DigitBytesToInt")**: Converts a byte array representing digits to an integer.
- **Inputs**:
  - `in`: The input byte array - big-endian digit string of `out`.
  - `n`: The number of bytes in the input array.
- **Outputs**:
  - `out`: The output integer after conversion.
- **Usage**:
  - To convert a byte array of digit characters into an integer, include the `DigitBytesToInt` template in your circuit and provide the byte array as input. The template will output the corresponding integer.

### constants.circom

This file defines a set of constants used across various circom circuits for standardizing sizes and lengths of different data types.

- **[Constants](./utils/constants.circom)**:
  - `EMAIL_ADDR_MAX_BYTES()`: Returns the maximum byte size for an email, defined as 256.
  - `DOMAIN_MAX_BYTES()`: Returns the maximum byte size for a domain, defined as 255.
  - `MAX_BYTES_IN_FIELD()`: Returns the maximum number of bytes that can fit in a field, defined as 31.

### functions.circom

This file contains utility functions that are used across various circom circuits for performing common mathematical and logical operations.

- **[`log2Ceil`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/functions.circom#L2-L10 "log2Ceil")**: Calculates the ceiling of the base 2 logarithm of a given number.
  - **Inputs**:
    - `a`: The input number for which the base 2 logarithm ceiling is to be calculated.
  - **Outputs**:
    - Returns the smallest integer greater than or equal to the base 2 logarithm of the input number.
  - **Usage**:
    - To calculate the ceiling of the base 2 logarithm of a number, include the `log2Ceil` function in your circuit and provide the number as input. The function will return the calculated value.


### hash.circom

**[`PoseidonLarge`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/hash.circom#L13-L37 "PoseidonLarge")**: Circuit to calculate Poseidon hash of inputs more than 16.
- **Inputs**:
  - `in[chunkSize]`: The input array of chunkSize elements.
  - `bytesPerChunk`: Number of bits in each chunk.
  - `chunkSize`: Number of chunks in input.
- **Outputs**:
  - `out`: Poseidon hash of input where consecutive elements are merged.
- **Usage**:
  - To calculate a Poseidon hash for large inputs, include the `PoseidonLarge` template in your circuit and provide the necessary inputs. The template will output the Poseidon hash of the input.


### regex.circom

This file contains templates for performing operations related to regular expressions on byte arrays. These templates allow for selecting and packing parts of byte arrays that match specific patterns defined by regular expressions.

**[`SelectRegexReveal`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/regex.circom#L15-L50 "SelectRegexReveal")**: Selects the reveal part of a byte array that matches a regular expression.
- **Inputs**:
  - `in`: The input byte array.
  - `startIndex`: The index of the start of the reveal part in the input array.
  - `maxArrayLen`: The maximum length of the input array.
  - `maxRevealLen`: The maximum length of the reveal part.
- **Outputs**:
  - `out`: The revealed data array that matches the regular expression.
- **Usage**:
  - To extract a specific part of a byte array that matches a regular expression, use the `SelectRegexReveal` template by specifying the inputs, including the start index of the reveal part.

**[`PackRegexReveal`](https://github.com/zkemail/zk-email-verify/blob/v4/packages/circuits/utils/regex.circom#L60-L77 "PackRegexReveal")**: Packs the reveal data from a regex match into an integer array.
- **Inputs**:
  - `in`: The input byte array.
  - `startIndex`: The index of the start of the reveal part in the input array.
  - `maxArrayLen`: The maximum length of the input array.
  - `maxRevealLen`: The maximum length of the reveal part.
- **Outputs**:
  - `out`: The packed integer array after processing the reveal data.
- **Usage**:
  - To pack the reveal data from a regular expression match into integers, use the `PackRegexReveal` template by specifying the inputs, including the start index of the reveal part.


