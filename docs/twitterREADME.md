# Proof of Twitter Example 
This is an example project that demonstrates how to use the ZK Email Verifier to prove ownership of a Twitter username on-chain.

## Overview 
The Twitter Email Verifier is a frontend application that interacts with the ZK Email Verifier. It allows users to generate proofs of Twitter username ownership and verify them.

Check out our demo [here](twitter.prove.email)

Note that local proving only works on Chrome/Brave/Arc (or other Chromium-based browsers) due to 1GB download limits on other browsers.

## Getting Started locally
1. Ensure you have Node 16 enabled (you can use nvm for this).
2. Navigate to the twitter-verifier-app directory:

```bash
cd packages/twitter-verifier-app
```
3. Start the application:

```bash
yarn start
```

 If the frontend shows an error on the fullProve line, run this command and then restart the application:
```
yarn add snarkjs@https://github.com/sampritipanda/snarkjs.git#fef81fc51d17a734637555c6edbd585ecda02d9e
``````

## Getting email headers

### Outlook
In Outlook, turn on plain text mode. Copy paste the 'full email details' into the textbox on the (only client side!) webpage.

### Gmail and Yahoo
In gmail and yahoo, download original message then copy paste the contents into the textbox.

## Registering your email identity
If you wish to generate a ZK proof of Twitter badge, you must do these:

Send yourself a password reset email from Twitter in incognito.
In your inbox, find the email from Twitter and download headers (three dots, then download message).
Copy paste the entire contents of the file into the box below. We admit it is an unfortunate flow, but we are still searching for a good Twitter email that anyone can induce that cannot be injected.
Paste in your sending Ethereum address
Click "Generate Proof"
Note that it is completely client side and open source, and you are not trusting us with any private information.



## Support
If you encounter any issues while using the Twitter Email Verifier. Feel free to open an issue on our Github repository or message us in our Telegram groupchat 




<!-- ### Regex to Circom

See regex_to_circom/README.md for usage instructions.

### Email Circuit Build Steps

#### Build

Install rust/circom2 via the following steps, according to: https://docs.circom.io/getting-started/installation/

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh # Install rust if don't already have
source "$HOME/.cargo/env" # Also rust installation step

git clone https://github.com/iden3/circom.git
sudo apt update
sudo apt-get install nlohmann-json3-dev libgmp-dev nasm # Ubuntu packages needed for C-based witness generator
sudo apt install build-essential # Ubuntu
brew install nlohmann-json gmp nasm # OSX
cd circom
cargo build --release
cargo install --path circom
```

Inside `zk-email-verify` folder, do

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash # If don't have npm
. ~/.nvm/nvm.sh # If don't have npm
nvm install 16 # If don't have node 16
nvm use 16 # If not using node 16
sudo npm i -g yarn # If don't have yarn (may need to remove sudo)
yarn install # If this fails, delete yarn.lock and try again
```

To get the ptau, do (note that you only need the 22 file right now)

```bash
cd packages/twitter-verifier-circuits

wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau

wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_21.ptau
```

<!-- Previously snarkjs@git+https://github.com/vb7401/snarkjs.git#fae4fe381bdad2da13eee71010dfe477fc694ac1 -->
<!-- Now -> yarn add https://github.com/vb7401/snarkjs/commits/chunk_zkey_gen -->


<!-- #### Building circuit and generating Zkeys

You can also edit the constant filename at the top of generate_input.ts to import that file instead of the args. You can then use the output of running that file as the input file (you may need to rename it) for both zkey and verifier generation.

To create a chunked zkey for in-browser proving, run the following on a high CPU computer:

```bash
yarn add snarkjs@git+https://github.com/vb7401/snarkjs.git#24981febe8826b6ab76ae4d76cf7f9142919d2b8 # Swap to chunked generation version for browser, leave this line out for serverside proofs onluy

cd packages/twitter-verifier-circuits/scripts
cp circuit.env.example circuit.env
cp entropy.env.example entropy.env
```

Fill out the env via random characters into the values for entropy1 and entropy2, and hexadecimal characters into the beacon. These scripts will compile and test your zkey for you, and generate a normal zkey with for an on chain verifier or server side prover, with the same entropy as the chunked one. If you only want the chunked one, use ./3_gen_chunk_zkey.sh in place of the generation.

```bash
./1_compile.sh && ./3_gen_both_zkeys.sh && ./4_gen_vkey.sh
```

#### Generating input and witness

Put the email into `emls` folder. Use the below command to generate the input.json for twitter

`ts-node --project=tsconfig.json  packages/twitter-verifier-app/scripts/generate_input.ts --email_file=./emls/zktestemail_twitter.eml`

`input.json` will be written to `/packages/twitter-verifier-circuits/inputs/input.json` which can be used for witness generation and proving.

You can generate witness by running

```bash
./2_gen_wtns.sh
```

and create generate proof using
```bash
./5_gen_proof.sh
```

#### Generating solidity verifier

Run
```bash
./7_gen_solidity_verifier.sh
``` 

The generated `twitter-verifier-circuits/contracts/verifier.sol` can be copied over to `twitter-verifier-contracts/src/Groth16VerifierTwitter.sol`. You can deploy this contract to verify the proof generated using the `zkey` with own entropy.


#### Server-side Prover: Rapidsnark Setup (Optional)

If you want to run a fast server side prover, install rapidsnark and test proofgen:

```bash
cd ../../
git clone https://github.com/iden3/rapidsnark
cd rapidsnark
npm install
git submodule init
git submodule update
npx task createFieldSources
```

You're supposed to run `npx task buildPistache` next, but that errored, so I had to manually build the pistache lib first:

```bash
cd depends/pistache
sudo apt-get install meson ninja-build
meson setup build --buildtype=release
ninja -C build
sudo ninja -C build install
sudo ldconfig
cd ../..
```

Then, from rapidsnark/ I could run

```bash
npx task buildProverServer
```

And from zk-email-verify, convert your proof params to a rapidsnark friendly version, generating the C-based witness generator and rapidsnark prover. To target to the AWS autoprover, go to the Makefile and manually replace the `CFLAGS=-std=c++11 -O3 -I.` line with (targeted to g4dn.xlarge and g5.xlarge, tuned to g5.xlarge):

```bash
cd ../zk-email-verify/dizkus-scripts
./6_gen_proof_rapidsnark.sh
```

To compile a non-chunked zkey for server-side use only,

```bash
yarn compile-all
```

#### Uploading to AWS

To upload zkeys to an s3 box on AWS, change bucket_name in upload_to_s3.py and run:

```bash
sudo apt install awscli # Ubuntu
brew install awscli # Mac

aws configure # Only needs to be run once
pip3 install boto3
python3 upload_to_s3.py
yarn add snarkjs@https://github.com/sampritipanda/snarkjs.git#fef81fc51d17a734637555c6edbd585ecda02d9e # Revert to frontend version
```

If you want to upload different files, you can parameterize the script as well:

```bash
python3 dizkus-scripts/upload_to_s3.py --dirs ~/zk-email-verify/build/email/email_js/ --bucket_name zkemail-zkey-chunks --prefix email.wasm
```

Note that there's no .zkeya file, only .zkeyb ... .zkeyk. The script will automatically zip into .tar.gz files and load into s3 bucket.

#### Recompile Frontend (Important!)

We use a fork of [zkp.ts](https://github.com/personaelabs/heyanon/blob/main/lib/zkp.ts) to load these keys into localforage. In the browser, to read off of localforage, you have to use this fork when running the frontend locally/in prod. THIS IS VERY IMPORTANT -- WRONG SNARKJS FORKS CAUSE THE MOST ERRORS.

```bash
yarn install snarkjs@git+https://github.com/vb7401/snarkjs.git#53e86631b5e409e5bd30300611b495ca469503bc
```

Manually copy paste the modulus in the resulting generated file into solidity verified mailserver keys.

Change s3 address in the frontend to your bucket.

### Really Large Circuits

If your circuit ends up being > 20M constraints, you will need to follow [these guidelines](https://hackmd.io/V-7Aal05Tiy-ozmzTGBYPA?view#Compilation-and-proving) to compile it.

### Compiling Subcircuits

If you want to compile subcircuits instead of the whole thing, you can use the following:

If you want to generate a new email/set of inputs, edit the src/constants.ts file with your constants.
In generate_input.ts, change the circuitType variable inside to match what circom file you are running, then run

```bash
npm install typescript ts-node -g
# uncomment do_generate function call at end of file
# go to tsconfig.json and change esnext to CommonJS
# if weird things dont work with this and yarn start, go go node_modules/react-scripts/config/webpack.config.ts and add/cut `target: 'node',` after like 793 after `node:`.
npx tsc --moduleResolution node --target esnext src/scripts/generate_input.ts
```

which will autowrite input\_<circuitName>.json to the inputs folder.

To do the steps in https://github.com/iden3/snarkjs#7-prepare-phase-2 automatically, do

```
yarn compile email true
```

and you can swap `email` for `sha` or `rsa` or any other circuit name that matches your generate_input type.

and when the circuit doesn't change,

```bash
yarn compile email true skip-r1cswasm
```

and when the zkey also doesn't change,

```bash
yarn compile email true skip-r1cswasm skip-zkey
```

### Contract Deployment

Follow the instructions in `src/contracts/README.md`.

### Production

For production, make sure to set a beacon in .env.

Note that this leaks the number of characters in the username of someone who sent you an email, iff the first field in the email serialization format is from (effectively irrelevant).

### Testing

To constraint count, do

```bash
cd circuits
node --max-old-space-size=614400 ./../node_modules/.bin/snarkjs r1cs info email.r1cs
```

To test solidity,

```bash
cp node_modules/forge-std src/contracts/lib/forge-std
cd src/contracts
forge test
```

To deploy contracts, look at src/contracts/README.md.


### Constraint breakdown

|          Operation          | Constraint # |
| :-------------------------: | :----------: |
|     SHA of email header     |   506,670    |
|    RSA signature verify     |   149,251    |
|      DKIM header regex      |   736,553    |
|       Body hash regex       |   617,597    |
|        SHA body hash        |   760,142    |
|    Twitter handle regex     |   328,044    |
| Packing output for solidity |    16,800    |
|      Total constraints      |  3,115,057   |

| Function | % of constraints |
| :------: | ---------------- |
|  Regex   | 54.00 %          |
| SHA hash | 40.67 %          |
|   RSA    | 4.79 %           |
| Packing  | 0.54 %           |

### Optimization plan

The current circom version is too expensive for any widely deployed in-browser use case, even with a plethora of tricks (chunked zkeys, single threaded proof gen for lower memory, compressing zkey and decompressing locally, etc.).

Short term ways to improve the performance would be to replace the regex checks with substring checks for everything except the email header, where we need regex (as far as we can tell) to correctly parse the "from" or "to" email from the header.

Looking more long term, we are actively using Halo2 and Nova to speed up the most expensive operations of regex and SHA. As hash functions and regex DFA traversal are repeated operations, they are a great fit for Nova's folding methods to compress repeated computation into a constant sized folded instance. But to actually use Nova to fold expensive operations outside of Halo2/Groth16, we need to verify the folded instance is valid inside the circuit for zero-knowledge and to link it to the rest of the computation. We also are attempting to use the lookup feature of Halo2 to precompute the entire table of possible regex state transitions, and just looking up that all of the transitions made are valid ones in the table instead of expensively checking each state! This idea is due to Sora Suegami, explained in more detail here: https://hackmd.io/@SoraSuegami/Hy9dWgT8i.

The current set `of remaining tasks and potential final states is documented in the following DAG, please reach out if any of the projects seem interesting!

![Optimization plan](public/zk_email_optim.jpg)

### General guidelines

Just RSA + SHA (without masking or regex proofs) for arbitrary message length <= 512 bytes is 402,802 constraints, and the zkey took 42 minutes to generate on an intel mac.

RSA + SHA + Regex + Masking with up to 1024 byte message lengths is 1,392,219 constraints, and the chunked zkey took 9 + 15 + 15 + 2 minutes to generate on a machine with 32 cores.

The full email header circuit above with the 7-byte packing into signals is 1,408,571 constraints, with 163 public signals, and the verifier script fits in the 24kb contract limit.

The full email header and body check circuit, with 7-byte packing and final public output compression, is **3,115,057 constraints**, with 21 public signals. zkey size was originally 1.75GB, and with tar.gz compression it is now 982 MB.

In the browser, on a 2019 Intel Mac on Chrome, proving uses 7.3/8 cores. zk-gen takes 384 s, groth16 prove takes 375 s, and witness calculation takes 9 s.

For baremetal, proof generation time on 16 CPUs took 97 seconds. Generating zkey 0 took 17 minutes. zkey 1 and zkey 2 each took 5 minutes. r1cs + wasm generation took 5 minutes. Witness generation took 16 seconds. cpp generation of witness gen file (from script 6) took 210 minutes -- this is only useful for server side proving.

### Scrubbing Sensitive Files

```bash
brew install git-filter-repo
git filter-repo --replace-text <(echo "0x000000000000000000000000000000000000000000000000000000000abcdef")
git filter-repo --path mit_msg.eml --invert-paths
git remote add origin https://github.com/zk-email-verify/zk-email-verify
ls
git push --set-upstream origin main --force
```

## Regexes we compiled

Test these on cyberzhg's toolbox modified at [zkregex.com/min_dfa](https://zkregex.com/min_dfa). The regex to get out the from/to emails is:

```
// '(\r\n|\x80)(to|from):([A-Za-z0-9 _."@-]+<)?[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.]+>?\r\n';
// let regex = '(\r\n|\x80)(to|from):((a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9| |_|.|"|@|-)+<)?(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_|.|-)+@(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_|.|-)+>?\r\n';
```

The regex to get out the body hash is:

```
const key_chars = '(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z)';
const catch_all = '(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|!|"|#|$|%|&|\'|\\(|\\)|\\*|\\+|,|-|.|/|:|;|<|=|>|\\?|@|[|\\\\|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c)';
const catch_all_without_semicolon = '(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|!|"|#|$|%|&|\'|\\(|\\)|\\*|\\+|,|-|.|/|:|<|=|>|\\?|@|[|\\\\|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c)';
const base_64 = '(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|\\+|/|=)';

let regex = `\r\ndkim-signature:(${key_chars}=${catch_all_without_semicolon}+; )+bh=${base_64}+; `;
```

The regex for Twitter is:

```
const word_char = '(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_)';
let regex = `email was meant for @${word_char}+`;
```

To understand these better, use https://cyberzhg.github.io/toolbox/ and use the 3 regex tools for visualization of the min-DFA state. -->


### Credits
This was originally conceived of in August 2022 by [@yush_g](https://twitter.com/yush_g) and [@sampriti0](https://twitter.com/sampriti0) at [@0xparc](https://twitter.com/0xparc), and has been improved since by several contributors supported by EF PSE including Sora, Saleel, Tyler, Sambhav, Javier, Rasul, Vivek, and more. We are grateful to circomlib, 0xparc, and double blind for their circuits. [DM us](http://t.me/zkemail) if interested in discussing usage, integrations, or building next generation primitives like this! 
