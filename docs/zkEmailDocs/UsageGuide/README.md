# Usage Guide

For an easy setup, we suggest utilizing [Zkrepl](https://github.com/zkemail/zk-regex), a playground for compiling and testing your circuits in the early stages of development. 

## Step 1: Generate Circuit inputs

The first step in using the zkEmail verification system is to generate the necessary inputs for the circuit. This involves parsing the email headers and extracting the required information. 

The information you need includes the RSA signature, the public key, the body of the email, and the hash of the email body. 

To make this process easier, the zk-email/helpers package provides utility functions. One of these is the `generateCircuitInputs` function. 

This function takes an object as an argument. The object should contain the following properties:

- **rsaSignature**: This is the RSA signature of the email. You can find it in the email header.
- **rsaPublicKey**: This is the RSA public key used for verification. It is also found in the email header.
- **body**: This is the body of the email. 
- **bodyHash**: This is the hash of the email body. 
- **message**: This is the message that was signed. It is a combination of the header and the bodyHash.
- **shaPrecomputeSelector**: This is a string used to split the body for SHA pre computation.
- **maxMessageLength**: This is the maximum allowed length of the message in the circuit. The default value is MAX_HEADER_PADDED_BYTES .
- **maxBodyLength**: This is the maximum allowed length of the body in the circuit. The default value is MAX_BODY_PADDED_BYTES.
- **ignoreBodyHashCheck**: This is a boolean value. If set to true, the body hash check in the circuit will be ignored. The default value is false.

Here's an example of how you can use the `generateCircuitInputs` function in your input.ts file:

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

The rsaSignature, rsaPublicKey, body, bodyHash, and message are all available in the header of an email. To get these, you will need to parse the email header. The other values are optional and have default values, but you can override them if necessary.

## Step 2:  Use the Circuits
Next, use `email-veriifier.circom` from the zk-email/circuits package to create your zk proof to verify the DKIM signature.


To set up your own circuit for the email-verifier, you can follow these steps:

1. Include the `email-verifier.circom` file from the `@zk-email/circuits` package.
2. Create a template for your circuit, let's call it `MyCircuit`.
3. Define the input signal for your circuit, which will come from your `input.ts` file.
4. Add any necessary witnesses and constraints for regex (learn more about how to setup regex [here]( https://github.com/zkemail/zk-regex))
5. Define the output signal, which will be public.
6. Instantiate the `emailVerifier` component within your `MyCircuit` template.

Here's an example of how you can set up your own circuit:

```javascript
include "@zk-email/circuits/email-verifier.circom";

template MyCircuit() {
    signal input // inputs from your input.ts file

    // Witnesses and constraints for regex go here

    signal output // output that is public

    component emailVerifier {
 // public inputs are specified here
         } = MyCircuit();
}
```

## Step 3: Compile the Circuit


To compile the circuit locally, you can use the `circom` command-line tool. Make sure you have `circom` installed globally by running `npm install -g circom`.  Then, navigate to the directory where your circuit file is located and run the following command:

```bash
circom circuit.circom -o circuit.json
```

This will compile your circuit and generate a JSON file named `circuit.json` that contains the compiled circuit. You can then use this JSON file to generate the proving and verifying keys, as well as the Solidity verifier contract.

To generate the keys and the verifier contract, you can use the `snarkjs` command-line tool. Make sure you have `snarkjs` installed globally by running `npm install -g snarkjs`. Then, run the following commands:

```bash
snarkjs setup
snarkjs calculatewitness
snarkjs proof
snarkjs verify
```

These commands will generate the proving and verifying keys, as well as the proof and the verification result. You can find more information about using `snarkjs` in the [official documentation](https://github.com/iden3/snarkjs).

Once you have the keys and the verifier contract, you can use them to verify the DKIM signature in your application. 

## Step 4: Verify the Circuit 
You have the option to validate your circuit either on-chain or off-chain.

### Off-chain Verification

```javascript
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "circuit.wasm",
    "circuit_final.zkey"
);
const vKey = JSON.parse(fs.readFileSync("verification_key.json").toString());
const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
console.log(res); // true if verification is successful
```

### On-chain Verification

After generating the `verifier.sol` file using `snarkjs`, you can use it to verify your proof on-chain. Here's an example of how you can do this in Solidity:

```javascript
// Assuming you have a contract instance `verifier` of the Verifier contract
bool result = verifier.verifyProof(
    proof.a,
    proof.b,
    proof.c,
    publicSignals
);
require(result, "The proof is not valid!");
```



