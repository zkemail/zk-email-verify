# Welcome to ZK-Email
![My Image](path/to/my/image.png)

ZK Email is an application that allows for anonymous verification of email signatures while masking specific data. It enables verification of emails to/from specific domains or subsets of domains, as well as verification based on specific text in the email body. This technology can be used for web2 interoperability, decentralized anonymous KYC, or to create interesting on-chain anonymity sets.

Visit our [docs](/docs/README.md) to learn how to build on top of zkEmail.
## Installation
To get started with the ZK Email Verifier, follow these steps:
1. Install the `@zk-email/helpers` package:
```shell
npm install @zk-email/helpers
```
2. Install the `@zk-email/contracts` package:
```shell
npm install @zk-email/contracts
```

3. Install the `@zk-email/circuits` package:
```shell
npm install @zk-email/circuits
```
## Package Overviews

The ZK Email Verifier codebase consists of three main packages:

### `@zk-email/helpers`

The `@zk-email/helpers` package provides utility functions for email verification and cryptographic operations. It includes functions for handling RSA signatures, public keys, email bodies, and hashes. The `generateCircuitInputs` function in the `input.helpers.ts` file is particularly important, as it is central to the operation of the SDK.
### `@zk-email/circuits`

The `@zk-email/circuits` package offers pre-built circuits for generating proofs and verifying DKIM signatures. These circuits are designed to be used in conjunction with the `@zk-email/helpers` package to generate the necessary inputs. The `email-verifier.circom` file serves as a template for email verification and can be customized for specific applications. It reads DKIM headers using regular expressions.

### `@zk-email/contracts`

The `@zk-email/contracts` package contains Solidity contracts used for email verification. These contracts can be modified to suit different use cases, providing flexibility in their application. The `DKIMRegistry.sol` contract specifically contains the hash of DKIM keys for public domains. After compiling the circuit, `snarkjs` generates a Solidity file named `verifier.sol`, which allows for on-chain proof verification.

## Filetree Description
We follow a monorepo architecture where packages are located in the `packages` folder. There are core reusable packages which is for general ZK email verification

```bash
packages/
  circuits/ # groth16 zk circuits
    regexes/ # Generated regexes
    helpers/ # Common helper functions used to generate inputs for circom 
    test/ # Circom tests for circuit
  
  contracts # Solidity contracts for Email verification

  helpers # Helper files for DKIM verification, input generation, etc.
```
## Contributors 💡
We will award $50 for every successfully merged PR that resolves any [open issue](https://github.com/zkemail/zk-email-verify/issues). If we forget, please dm us a reminder!

We want to say thanks to these amazing contributors!!

## Projects 🛠
Take a look at all of the cool innovative projects that are building on top of Zk-Email!

- Zkp2p
- Zk Email Safe 

## FAQ/Possible Errors
### Can you provide an example header for me to understand what exactly is signed?

We are hijacking DKIM signatures in order to verify parts of emails, which can be verified on chain via succinct zero knowledge proofs. Here is an example of the final, canoncalized actual header string that is signed by google.com's public key:

`to:"zkemailverify@gmail.com" <zkemailverify@gmail.com>\r\nsubject:test email\r\nmessage-id:<CAOmXgjU78_L7d-H7Wqf2qph=-uED3Kw6NEU2PzSP6jiUH0Bb+Q@mail.gmail.com>\r\ndate:Fri, 24 Mar 2023 13:02:10 +0700\r\nfrom:ZK Email <zkemailverify2@gmail.com>\r\nmime-version:1.0\r\ndkim-signature:v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20210112; t=1679637743; h=to:subject:message-id:date:from:mime-version:from:to:cc:subject :date:message-id:reply-to; bh=gCRK/FdzAYnMHic55yb00uF8AHZ/3HvyLVQJbWQ2T8o=; b=`

Thus, we can extract whatever information we want out of here via regex, including to/from/body hash! We can do the same for an email body.

### I'm having issues with the intricacies of the SHA hashing. How do I understand the function better?

Use https://sha256algorithm.com/ as an explainer! It's a great visualization of what is going on, and our code should match what is going on there.

### I'm having trouble with regex or base64 understanding. How do I understand that better?

Use https://cyberzhg.github.io/toolbox/ to experiment with conversions to/from base64 and to/from DFAs and NFAs.

### What are the differences between generating proofs (snarkjs.groth16.fullprove) on the client vs. on a server?

If the server is generating the proof, it has to have the private input. We want people to own their own data, so client side proving is the most secure both privacy and anonymity wise. There are fancier solutions (MPC, FHE, recursive proofs etc), but those are still in the research stage.

### “Cannot resolve module ‘fs’”

Fixed by downgrading react-scripts version.

### TypeError: Cannot read properties of undefined (reading 'toString')

This is the full error:

```
zk-email-verify/src/scripts/generateinput.ts:182
const = result.results[0].publicKey.toString();
                                    ^
TypeError: Cannot read properties of undefined (reading 'toString')
```

You need to have internet connection while running dkim verification locally, in order to fetch the public key. If you have internet connection, make sure you downloaded the email with the headers: you should see a DKIM section in the file. DKIM verifiction may also fail after the public keys rotate, though this has not been confirmed.

### How do I lookup the RSA pubkey for a domain?

Use [easydmarc.com/tools/dkim-lookup?domain=twitter.com](https://easydmarc.com/tools/dkim-lookup?domain=twitter.com).

### DKIM parsing/public key errors with generate_input.ts

```
Writing to file...
/Users/aayushgupta/Documents/.projects.nosync/zk-email-verify/src/scripts/generate_input.ts:190
        throw new Error(`No public key found on generate_inputs result ${JSON.stringify(result)}`);
```

Depending on the "info" error at the end of the email, you probably need to go through src/helpers/dkim/\*.js and replace some ".replace" functions with ".replaceAll" instead (likely tools.js), and also potentially strip some quotes.

### No available storage method found.

If when using snarkjs, you see this:

```
[ERROR] snarkJS: Error: No available storage method found. [full path]
/node_modules/localforage/dist/localforage.js:2762:25
```

Rerun with this:
`yarn add snarkjs@git+https://github.com/vb7401/snarkjs.git#24981febe8826b6ab76ae4d76cf7f9142919d2b8`

### I'm trying to edit the circuits, and running into the error 'Non-quadratic constraints are not allowed!'

The line number of this error is usually arbitrary. Make sure you are not mixing signals and variables anywhere: signals can only be assigned once, and assigned to other signals (not variables), and cannot be used as parameters in control flow like for, if, array indexing, etc. You can get versions of these by using components like isEqual, lessThan, and quinSelector, respectively.

### Where do I get the public key for the signature?

Usually, this will be hosted on DNS server of some consistent URL under the parent organization. You can try to get it from a .pem file, but that is usually a fraught effort since the encoding of such files varies a lot, is idiosyncratic, and hard to parse. The easiest way is to just extract it from the RSA signature itself (like our generate_input.ts file), and just verify that it matches the parent organization.

### How can I trust that you verify the correct public key?

You can see the decomposed public key in our Solidity verifier, and you can auto-check this against the mailserver URL. This prevents the code from falling victim to DNS spoofing attacks. We don't have mailserver key rotations figured out right now, but we expect that can be done trustlessly via DNSSEC (though not widely enabled) or via deploying another contract.

### How do I get a Verifier.sol file that matches my chunked zkeys?

You should be able to put in identical randomness on both the chunked zkey fork and the regular zkey generation fork in the beacon and Powers of Tau phase 2, to be able to get the same zkey in both a chunked and non-chunked form. You can then run compile.js, or if you prefer the individual line, just `node --max-old-space-size=614400 ${snarkJSPath} zkey export solidityverifier ${cwd}/circuits/${circuitNamePrimary}/keys/circuit_final.zkey ${cwd}/circuits/contracts/verifier.sol`, where you edit the path variables to be your preferred ones.

The chunked file utils will automatically search for circuit_final.zkeyb from this command line call if you are using the chunked zkey fork (you'll know you have that fork, if you have a file called chunkFileUtils in snarkJS).

### How do I deal with all of these snarkJS forks?

Apologies, this part is some messy legacy code from previous projects. You use vivekab's fork for keygeneration, sampritipanda's fork for chunked zkey checking on the frontend, and the original snarkjs@latest to get rid of chunking entirely (but you'll need to edit frontend code to not do that). You can do something like `./node_modules/bin/snarkjs' inside your repo, and it'll run the snarkjs command built from the fork you're using instead of the global one.

### How do I build my own frontend but plug in your ZK parsing?

zkp.ts is the key file that calls the important proving functions. You should be able to just call the exported functions from there, along with setting up your own s3 bucket and setting the constants at the top.

### What is the licensing on this technology?

Everything we write is MIT licensed. Note that circom and circomlib is GPL. Broadly we are pro permissive open source usage with attribution! We hope that those who derive profit from this, contribute that money altruistically back to this technology and open source public good.

## To-Do

- Make a general method to get formatted signatures and bodies from all email clients
- Make versions for different size RSA keys
- Add ENS DNSSEC code (possibly SNARKed), so anyone can add a website's RSA key via DNS record
- Design the NFT/POAP to have the user's domain/verified identity on it and display SVG properly on opensea
- Make a testnet faucet as a PoC for Sybil resistance and to get developers interested
- Dynamically tradeoff between gzip (2x faster decompression) and xz (30% smaller file size): https://www.rootusers.com/gzip-vs-bzip2-vs-xz-performance-comparison/ based on internet speed (i.e. minimize download time + unzip time)
- Fix these circom bugs from `circom email.circom --inspect`:
  - warning[CA02]: In template "Base64Decode(32)": Subcomponent input/output signal bits_out[10][2].out does not appear in any constraint of the father component
  - warning[CA01]: In template "TwitterResetRegex(1536)": Local signal states[1536][0] does not appear in any constraint
  - warning[CA02]: In template "EmailVerify(1024,1536,121,17,7)": Subcomponent input/output signal dkim_header_regex.reveal[0] does not appear in any constraint of the father component
  - warning[CA02]: In template "RSAVerify65537(121,17)": Array of subcomponent input/output signals signatureRangeCheck[13].out contains a total of 121 signals that do not appear in any constraint of the father component
    = For example: signatureRangeCheck[13].out[0], signatureRangeCheck[13].out[100].
  - warning[CA02]: In template "LessThan(8)": Array of subcomponent input/output signals n2b.out contains a total of 8 signals that do not appear in any constraint of the father component
    = For example: n2b.out[0], n2b.out[1].
  - warning[CA01]: In template "DKIMHeaderRegex(1024)": Local signal states[1025][0] does not appear in any constraint
  - warning[CA01]: In template "Bytes2Packed(7)": Array of local signals in_prefix_sum contains a total of 8 signals that do not appear in any constraint
    = For example: in_prefix_sum[0], in_prefix_sum[1].
  - warning[CA01]: In template "Bytes2Packed(7)": Array of local signals pow2 contains a total of 8 signals that do not appear in any constraint
    = For example: pow2[0], pow2[1].
- Enable parsing of emails via tagged-dfa/lookahead/lookbehinds in all cases where 1) from:email [rare, only gcal] and 2) from:<email> and 3) from:text <email>
- Fix it so only a recent email after deploy cutoff can be used to send money
## Licensing
Everything we write is MIT licensed. Note that circom and circomlib is GPL. Broadly we are pro permissive open source usage with attribution! We hope that those who derive profit from this, contribute that money altruistically back to this technology and open source public good.