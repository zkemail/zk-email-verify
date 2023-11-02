
# zkEmail Verify SDK Documentation

The zkEmail Verify SDK is a set of three npm packages designed to facilitate the verification of DKIM signatures in emails using zero-knowledge proofs.

## **Installation**

To get started with zk-email, install these three npm packages:
## **1.  @zk-email/helpers**
This package provides utility functions for email verification and cryptographic operations.
```
npm i @zk-email/helpers
```

## **2.  @zk-email/contracts**
This package contains Solidity contracts for email verification. Import the contract from the package and deploy it in your migration script.

```
npm i @zk-email/circuits
```

## **3.  @zk-email/contracts**
This package provides circuits for generating proofs and verifying DKIM signatures in emails. Import the necessary circuits from the package and use them to compile your circuit and generate a proof.
```
npm i @zk-email/circuits
```
## Filetree Description
Our packages are organized in a monorepo architecture. These are core reusable packages for general ZK email verification.
```
packages/
  circuits/ # groth16 zk circuits
    regexes/ # Generated regexes
    helpers/ # Common helper circom circuits imported in email circuits 
    test/ # Circom tests for circuit
  
  contracts # Solidity contracts for Email verification

  helpers # Helper files for DKIM verification, input generation, etc.

  ```


## **Usage** 
## **@zk-email/helpers**

The `@zk-email/helpers` package provides utility functions for generating proof inputs. The main function is 'generateCircuitInputs' which is found in the `input-helpers.ts` file:

```javascript
import { generateCircuitInputs } from "@zk-email/helpers";

const circuitInputs = generateCircuitInputs({
  rsaSignature, // The RSA signature of the email
  rsaPublicKey, // The RSA public key used for verification
  body, // body of the email 
  bodyHash, // hash of the email body
  message, // the message that was signed (header + bodyHash)
  shaPrecomputeSelector, // String to split the body for SHA pre computation
  maxMessageLength = MAX_HEADER_PADDED_BYTES, // Maximum allowed length of the message in circuit
  maxBodyLength = MAX_BODY_PADDED_BYTES, // Maximum allowed length of the body in circuit
  ignoreBodyHashCheck = false, // To be used when ignore_body_hash_check is true in circuit
});
```

This function takes parameters like email body, message, body hash, RSA signature, RSA public key, shaPrecomputeSelector, maximum message and body lengths, and an optional `ignoreBodyHashCheck`. If `ignoreBodyHashCheck` is true, the email contents will be public.

## **@zk-email/contracts**
The `@zk-email/contracts` package contains Solidity contracts for DKIM public key registry.

**DKIMRegistry.sol**

This contract is used to store the hash of the DKIM public key for each domain. The hash is calculated by taking Poseidon of DKIM key split into 9 chunks of 242 bits each.

The contract provides the following functions:

- `getDKIMPublicKeyHash(string memory domainName)`: Returns the DKIM public key hash for the given domain name.
- `setDKIMPublicKeyHash(string memory domainName, bytes32 publicKeyHash)`: Sets the DKIM public key hash for the given domain name. This function can only be called by the owner of the contract.


## **@zk-email/circuits**
The `@zk-email/circuits` package provides a set of pre-built circuits that developers can use to build their own application-specific circuits. The main circuit provided by the SDK is the `EmailVerifier template`, which verifies the integrity of an email message.

### **EmailVerifier Template** 

The EmailVerifier template is defined in the `email-verifier.circom` file. This template takes as input the email data, RSA public key, RSA signature, and other parameters, and outputs the SHA256 hash of the email data and the Poseidon hash of the public key.

```javascript
template EmailVerifier(max_header_bytes, max_body_bytes, n, k, ignore_body_hash_check) {
    
    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input pubkey[k]; // rsa pubkey, verified with smart contract + DNSSEC proof. split up into k parts of n bits each.
    signal input signature[k]; // rsa signature. split up into k parts of n bits each.
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    signal output sha[256] <== Sha256Bytes(max_header_bytes)(in_padded, in_len_padded_bytes);
    signal output pubkey_hash;
}
```

**Template Arguments** 
The EmailVerifier template takes the following arguments:

- max_header_bytes: The maximum number of bytes in the email header. 
- max_body_bytes: The maximum number of bytes in the email body.
- n: The bit size of the RSA public key.
- k: The number of chunks the RSA public key is split into.
- ignore_body_hash_check: A flag that allows skipping the body hash check.


**Inputs**

- in_padded: The prehashed email data, padded with zeros at the end.
- pubkey: The RSA public key, split up into parts.
- signature: The RSA signature, split up into parts.
- in_len_padded_bytes: The length of the email data including the padding.
- precomputed_sha: The precomputed SHA256 hash of a significant prefix of the email body.
- in_body_padded: The remaining part of the email body, padded with zeros at the end.
- in_body_len_padded_bytes: The length of the remaining part of the email body including the padding.

**Outputs**

- sha: The SHA256 hash of the email data.
- pubkey_hash: The Poseidon hash of the public key.

**Usage**

To use the EmailVerifier template in your own application, you would import it like so:
```javascript
include "email-verifier.circom";

template MyCircuit() {
    // Your circuit code here...

    component emailVerifier = EmailVerifier(...);
    // Connect the inputs and outputs of the emailVerifier component...
}
```


