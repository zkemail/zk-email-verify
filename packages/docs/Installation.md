# Installation
In the case of any issues message in the `Telegram`, or check out the `FAQ`

Install `rust/circom2` via the following steps, according to: https://docs.circom.io/getting-started/installation

### `Rust` Installation (if not already installed):

```
Install Rust by running the following commands:

curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
source "$HOME/.cargo/env"

```
### Clone ```Circom``` Repository and Install Dependencies:

For Ubuntu:
```
git clone https://github.com/iden3/circom.git
sudo apt update
sudo apt-get install nlohmann-json3-dev libgmp-dev nasm
sudo apt install build-essential
cd circom
cargo build --release
cargo install --path circom

```
For MacOS users (via Homebrew)
```
Install Homebrew, if you don't have it already
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
git clone https://github.com/iden3/circom.git
brew install nlohmann-json gmp nasm
cd circom
cargo build --release
cargo install --path circom
```

### Installing our SDKs


2. In the root directory of your project run the following command to install the @zk-email/circuits package:
```
npm i @zk-email/circuits
```
3. Run the following command to install the @zk-email/contracts package:
```
npm i @zk-email/contracts
```

4. Run the following command to install the @zk-email/helpers package:

```
npm i @zk-email/helpers
```


## Quick start

## Generating a Proof of Email

## Testing


## Contributing