# Usage Guide

This guide provides a step-by-step walkthrough on how to use the ZK Email Verifier. It covers the process from converting your email to regex to creating your zero-knowledge proof for email verification. The guide assumes you have already installed the necessary packages as outlined in the [Installation Guide](../Installation/README.md). If you haven't done so, please refer to the Installation Guide first.


For an easy setup, we suggest utilizing [Zkrepl](https://github.com/zkemail/zk-regex), a playground for compiling and testing your circuits in the early stages of development.

## Step 1: Generating the Regex File
To convert your target email string into a regex format and compile it into a regex.circom file, please refer to our [zk-regex repository](www.github.com/zkemail/zk-regex).


## Step 2: Generate Circuit Inputs

The second step in the zkEmail verification process is to generate the necessary circuit inputs. This involves parsing the email headers to extract the required information. 

The required information includes the RSA signature, the public key, the body of the email, and the hash of the email body. To do this, create a directory named 'emls' and place the raw email inside it.

Next, create an `inputs.ts` file. In this file, you will use the `generateCircuitInputs` function from the `@zk-email/helpers` package and the `verifyDKIMSignature` function to specify all of your inputs and ensure they match the DKIM in your email header. 

Here is a sample code snippet to guide you:

```javascript
import { generateCircuitInputs, verifyDKIMSignature } from "@zk-email/helpers";
import fs from "fs";
import path from "path";

const rawEmail = fs.readFileSync(
  path.join(__dirname, "./emls/rawEmail.eml"),
  "utf8"
);

const dkimResult = await verifyDKIMSignature(Buffer.from(rawEmail));

const circuitInputs = generateCircuitInputs({
  rsaSignature: dkimResult.signature, // The RSA signature of the email
  rsaPublicKey: dkimResult.rsaPublicKey, // The RSA public key used for verification
  body: dkimResult.body, // body of the email 
  bodyHash: dkimResult.bodyHash, // hash of the email body
  message: dkimResult.message, // the message that was signed (header + bodyHash)
  //Optional to verify regex in the body of email
 shaPrecomputeSelector: STRING_PRESELECTOR, // String to split the body for SHA pre computation 
maxMessageLength: MAX_HEADER_PADDED_BYTES, // Maximum allowed length of the message in circuit
 maxBodyLength: MAX_BODY_PADDED_BYTES, // Maximum allowed length of the body in circuit
 ignoreBodyHashCheck = false, // To be used when ignore_body_hash_check is true in circuit
});

fs.writeFileSync("./input.json", JSON.stringify(circuitInputs));
```

To generate the `input.json` file, run the following command:

```bash
npx ts-node inputs.ts
```

Note: Increasing the `messageLength` or `BodyLength` sizes will increase the time required for compiling and creating proving keys.



## Step 3: Implementing the Circuits
Next, use `email-veriifier.circom` from the zk-email/circuits package to create your zk circuit to verify the DKIM signature.


To set up your own circuit for the email-verifier, you can follow these steps:

1. Include the `email-verifier.circom` file from the `@zk-email/circuits` package as well as the `regex.circom` file that was generated from Step 1 of this guide.
2. Create a template for your circuit, let's call it `MyCircuit`.
3. Define the input signal for your circuit, which will come from your `input.ts` file.
4. Add any necessary witnesses and constraints for regex (learn more about how to setup regex [here]( https://github.com/zkemail/zk-regex))
5. Define the output signal, which will be public.
6. Instantiate the `emailVerifier` component within your `MyCircuit` template.

Here's an example of how you can set up your own circuit:

```javascript
include "@zk-email/circuits/email-verifier.circom";
include "simple_regex.circom"

template MyCircuit() {
    signal input // inputs from your input.ts file

    // Witnesses and constraints for regex go here

    signal output // output that is public

    component emailVerifier {
 // public inputs are specified here
         } = MyCircuit();
}
```

## Step 4: Compile your circuit

To compile the circuit locally, you need to have Rust and Circom installed first. You can visit this link to install both https://docs.circom.io/getting-started/installation/#installing-dependencies


```bash
circom MyCircuit.circom -o --r1cs --wasm --sym --c 
```
*Note: You can add -l to specify the directory where the directive `include` should look for the circuits indicated.

After running this command, the circuit will be compiled into a `.r1cs` file, a `.wasm` file, and a `.sym` file. These files are used in the next steps to generate the proving and verifying keys, and to compute the witness.

## Step 5: Compute the Witness

The process of creating a proof involves ensuring that all signals in the file adhere to the existing constraints. This is achieved by computing the witness using the Wasm file generated during compilation. 

Navigate to the MyCircuit_js file and incorporate the input.json file that was produced in Step 2. Execute the following command in your terminal:

```
node generate_witness.js myCircuit.wasm input.json witness.wtns

```

This operation will produce a file named 'witness.wtns'. This file is encoded in a format that is compatible with the snarkjs library. In the following steps, we will utilize snarkJs to initiate the proof creation process.

## Step 6: Proving the Circuit

The next step involves using the `snarkjs` command-line tool to generate the keys and the verifier contract. If you haven't installed `snarkjs` globally, you can do so by running `npm install -g snarkjs`.

The generation of the zk proof requires a trusted setup, which includes the `powers of tau ceremony` and `phase 2`. Click [here](https://zkp2p.gitbook.io/zkp2p/developer/circuits/trusted-setup-ceremony/) to read more about Trusted Setup.

Firstly, you need to determine the constraint size of your circuit. You can do this by running the following command:
```bash
snarkjs r1cs info myCircuit.r1cs
```

### Powers of Tau
After obtaining the constraint size, find the next highest power of 2 and replace the '12' in the following command with that number. This command initiates the Powers of tau ceremony.

```
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
```

Then contribute to the ceremony by running:
```bash
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
```
### Phase 2

For Phase 2 of the trusted setup you can either use https://docs.circom.io/getting-started/proving-circuits/#phase-2 or [P0tion](https://github.com/privacy-scaling-explorations/p0tion) 

## Step 7: Verify your circuit

After this process you should get three files
-  the proving key(vkey) 
- proof.json
- public.json

You can use these files to verify your circuit. 

### Off-chain Verification
To verify your proof run:

```bash
snarkjs groth16 verify verification_key.json public.json proof.json

```

The command uses the files verification_key.json we exported earlier,proof.json and public.json to check if the proof is valid. If the proof is valid, the command outputs an OK.


### On-chain Verification
To create a solidity verifier that allows you to verify your proof on the ethereum blockchain, run:

```bash
snarkjs zkey export solidityverifier multiplier2_0001.zkey verifier.sol

```

This will generate a `verifier.sol` contract.



