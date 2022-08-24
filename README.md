# The App
The application is located at https://zk-email.xyz.

The documentation for the app is located at https://zk-email.xyz/docs (to-do)

# Development Instructions.

(this section is under construction)

```
circuits/
    inputs/ # Test inputs for example witness generation for compilation
    scripts/ # Run snarkjs ceremony to generate zkey with yarn compile
```

## Getting email headers

In outlook, turn on plain text mode. Send an email to yourself, and copy paste the full email details into the textbox on the (only client side!) webpage.

Notes about email providers: tl;dr: view headers in a non-gmail client.

Gmail self-emails censor the signature of the mailserver, so it is unclear if it is generated. .edu domain, hotmail, custom domain, and outlook domain self-emails have the signatures. In fact, Gmail-sent self-emails using the .edu domain, viewed in a non-gmail client, are not censored -- it seems to be just a property of the gmail viewer to not show signatures on self emails (but it has signatures on every other recieved email).

## Circuit Build Steps
Install circom2 via the following steps, according to: https://docs.circom.io/getting-started/installation/
```
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
source "$HOME/.cargo/env"
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
sudo apt-get install nlohmann-json3-dev libgmp-dev nasm
```

If no yarn, do
```
sudo npm i -g yarn
```

To get the ptau, do
```
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_21.ptau
# shasum pot21_final.ptau: e0ef07ede5c01b1f7ddabb14b60c0b740b357f70
mv powersOfTau28_hez_final_21.ptau powersoftau/powersOfTau28_hez_final_21.ptau
```

To create a chunked zkey for in-browser proving, run the following:
```
yarn install snarkjs@git+https://github.com/vb7401/snarkjs.git#fae4fe381bdad2da13eee71010dfe477fc694ac1
cd dizkus-scripts/
./1_compile.sh
./2_...
./2_...
./2_...
./2_...
./2_...

```

To do a non-chunked zkey for non-browser running,
```
yarn compile-all
```
If you want to compile subcircuits instead of the whole thing, you can use the following:

    If you want to generate a new email/set of inputs, edit the src/constants.ts file with your constants.
    In generate_input.ts, change the circuitType to match what circom file you are running, then run
    ```
    ts-node circuits/scripts/generate_input.ts
    ```
    which will autowrite input_<circuitName>.json to the inputs folder.

    To do the steps in https://github.com/iden3/snarkjs#7-prepare-phase-2 automatically, do
    ```
    yarn compile email true
    ```
    and you can swap `email` for `sha` or `rsa` or any other circuit name that matches your generate_input type.

    and when the circuit doesn't change,
    ```
    yarn compile email true skip-r1cswasm
    ```

    and when the zkey also doesn't change,
    ```
    yarn compile email true skip-r1cswasm skip-zkey
    ```

For production, make sure to set a beacon in .env.

Double blind circuit:
```
circom circuits/main/rsa_group_sig_verify.circom --wasm --r1cs
snarkjs zkey new ./rsa_group_sig_verify.r1cs pot21_final.ptau public/rsa_group_sig_verify_0000.zkey
snarkjs zkey export verificationkey public/rsa_group_sig_verify_0000.zkey public/rsa_group_sig_verify_0000.vkey.json
cp rsa_group_sig_verify_js/rsa_group_sig_verify.wasm public
```

This leaks the number of characters in the username of someone who sent you an email, iff the first field in the email serialization format is from (effectively irrelevant)

## Stats
Just RSA + SHA (without masking or regex proofs) for arbitrary message length <= 512 bytes is 402802 constraints, and the zkey took 42 minutes to generate on an intel mac.
RSA + SHA + Regex + Masking with up to 1024 byte message lengths is 1392219 constraints, and the chunked zkey took 9 + 15 + 15 + 2 minutes to generate on a machine with 32 cores.

## To-Do
- Test emails where a@b.com is bcced on an email from x@y.com -> z@y.com -- can a falsely prove membership in y.com? Specifically, does DKIM happen on the message layer or the connection layer?
- Make the frontend circuit calls work (Vivek B @vb7401 knows the right instructions)
- Make a general method to get formatted signatures and bodies from all email clients
- Make versions for different size RSA keys
- Add root cert DNS in snark, to allow anyone to add a website's RSA key
- Design the NFT/POAP to have the user's domain/verified identity on it
- Make a testnet faucet that checks this for sybil resistance    
