# Rust Verifier CLI Tool

This is a mini CLI tool for exporting Rust verifiers from snarkjs artifacts. It allows you to generate a verifier from a snarkjs verifying key and generate verifier arguments from snarkjs proof and public inputs.

## Usage

### Commands

1. **GenerateVerifier**: Generates a verifier from a snarkjs verifying key.
2. **GenerateVerifierArguments**: Generates verifier arguments from snarkjs proof and public inputs.

### Examples

#### Generate Verifier

To generate a verifier from a snarkjs verifying key, use the `generate-verifier` command:

```sh
cargo run -- generate-verifier -v <path_to_verifying_key_file> -o <output_file_path>
```

**Example:**

```sh
cargo run -- generate-verifier -v tests/data/proof_of_twitter/vkey.json -o verifier.rs
```

#### Generate Verifier Arguments

To generate verifier arguments from snarkjs proof and public inputs, use the `generate-verifier-arguments` command:

```sh
cargo run -- generate-verifier-arguments -p <path_to_proof_file> -i <path_to_public_inputs_file>
```

**Example:**

```sh
cargo run -- generate-verifier-arguments -p tests/data/proof_of_twitter/proof.json -i tests/data/proof_of_twitter/public.json
```
