# Installation
In the case of any issues message in the [Telegram](https://t.me/zkemail), or check out the [FAQ]().



Install `rust/circom2` via the following steps, according to: https://docs.circom.io/getting-started/installation


### **Rust** Installation (if not already installed):

Install Rust by running the following commands:
```
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
source "$HOME/.cargo/env"
```
### Clone **Circom** Repository and Install Dependencies:

**For Ubuntu:**
```
git clone https://github.com/iden3/circom.git
sudo apt update
sudo apt-get install nlohmann-json3-dev libgmp-dev nasm
sudo apt install build-essential
cd circom
cargo build --release
cargo install --path circom

```
**For MacOS users (via Homebrew)**

If you do not have Homebrew installed, install it with the following command:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Once installed run these commmands:
```
git clone https://github.com/iden3/circom.git
brew install nlohmann-json gmp nasm
cd circom
cargo build --release
cargo install --path circom
```

### Installing our SDKs

 In the root directory of your project run the following command to install the @zk-email/circuits, contracts and helpers package:

```
npm i @zk-email/circuits
npm i @zk-email/contracts
npm i @zk-email/helpers
```
