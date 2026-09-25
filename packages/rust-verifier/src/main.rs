use std::{
    fs::OpenOptions,
    io::BufWriter,
    process::{Command, Stdio},
    str::FromStr,
};

use ark_serialize::{CanonicalSerialize, Write};
use clap::{Parser, Subcommand};
use utils::verifier_utils::{GrothBnProof, GrothBnVkey, GrothFp, JsonDecoder, PublicInputsCount};

#[derive(Parser)]
#[command(name = "rust verifier")]
#[command(about = "A mini CLI tool for exporting rust verifier from snarkjs artifacts")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generates a verifier from a snarkjs verifying key
    GenerateVerifier {
        /// Path to the snarkjs verifying key file
        #[arg(short, long)]
        verifying_key: String,
        /// Path to the output file
        #[arg(short, long)]
        output: String,
    },
    /// Generates verifier arguments from snarkjs proof and public inputs
    GenerateVerifierArguments {
        /// Path to the snarkjs proof file
        #[arg(short, long)]
        proof: String,
        /// Path to the snarkjs public inputs file
        #[arg(short, long)]
        inputs: String,
    },
}

/// Runs the `rust verifier` CLI: exports a verifier from a snarkjs verifying key,
/// or prints the serialized proof and public inputs for a snarkjs proof.
fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::GenerateVerifier {
            verifying_key,
            output,
        } => {
            println!("Generating verifier with verifying key: {}", verifying_key);
            let vkey = GrothBnVkey::from_json_file(verifying_key);
            let public_inputs_count = PublicInputsCount::from_json_file(verifying_key);

            let mut serialized_vkey = Vec::new();
            let writer = BufWriter::new(&mut serialized_vkey);
            vkey.serialize_compressed(writer).unwrap();

            let template = include_str!("verifier_template.rs");

            let verifier_content = template
                .replace("[COMPRESSED_VKEY]", &format!("{:?}", &serialized_vkey))
                .replace(
                    "PUBLIC_INPUTS_COUNT",
                    public_inputs_count.nPublic.to_string().as_str(),
                );

            let formatted_content =
                format_rust_code(&verifier_content).expect("Failed to format the code");

            let mut output_file = OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .open(output)
                .expect("Failed to open output file");
            output_file
                .write_all(formatted_content.as_bytes())
                .expect("Failed to write to output file");
        }
        Commands::GenerateVerifierArguments {
            proof,
            inputs: public_inputs,
        } => {
            println!(
                "Generating verifier arguments with proof: {} and public inputs: {}",
                proof, public_inputs
            );

            let proof = GrothBnProof::from_json_file(proof);
            let public_inputs = parse_public_inputs_file(public_inputs);

            let mut serialized_proof = Vec::new();

            let writer = BufWriter::new(&mut serialized_proof);
            proof.serialize_compressed(writer).unwrap();

            println!("PROOF: {:?}\n", serialized_proof);
            println!("{}\n", format_public_inputs_output(&public_inputs));
        }
    }
}

/// Reads a snarkjs public inputs file and parses every entry as a field element.
///
/// Panics if the file cannot be read or does not contain a JSON array of decimal strings.
fn parse_public_inputs_file(file_path: &str) -> Vec<GrothFp> {
    let json = std::fs::read_to_string(file_path).expect("Failed to read public inputs file");
    parse_public_inputs_json(&json)
}

/// Parses a JSON array of decimal strings (snarkjs `public.json`) into field elements,
/// keeping their order. Any number of elements is accepted.
fn parse_public_inputs_json(json: &str) -> Vec<GrothFp> {
    let inputs: Vec<String> = serde_json::from_str(json).expect("Invalid public inputs JSON");
    inputs
        .iter()
        .map(|input| GrothFp::from_str(input).expect("Invalid public input field element"))
        .collect()
}

/// Serializes the public inputs in compressed form, one element after another.
fn serialize_public_inputs(inputs: &[GrothFp]) -> Vec<u8> {
    // Same bytes as `[GrothFp; N]::serialize_compressed`: each element in order, no length prefix.
    let mut serialized = Vec::new();
    for input in inputs {
        input
            .serialize_compressed(&mut serialized)
            .expect("Failed to serialize public input");
    }
    serialized
}

/// Formats the `PUBLIC_INPUTS: [...]` line printed by `generate-verifier-arguments`.
fn format_public_inputs_output(inputs: &[GrothFp]) -> String {
    format!("PUBLIC_INPUTS: {:?}", serialize_public_inputs(inputs))
}

/// Formats generated Rust source by piping it through `rustfmt`.
fn format_rust_code(code: &str) -> Result<String, std::io::Error> {
    let mut rustfmt = Command::new("rustfmt")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("Failed to start rustfmt process");

    {
        let stdin = rustfmt.stdin.as_mut().expect("Failed to open stdin");
        stdin.write_all(code.as_bytes())?;
    }

    let output = rustfmt.wait_with_output()?;
    let formatted_code = String::from_utf8(output.stdout).expect("Failed to read rustfmt output");

    Ok(formatted_code)
}

#[cfg(test)]
mod tests {
    use super::{format_public_inputs_output, parse_public_inputs_json, serialize_public_inputs};
    use ark_serialize::CanonicalSerialize;
    use utils::verifier_utils::{GrothFp, JsonDecoder, PublicInputs};

    #[test]
    /// Inputs of two and four elements parse to the expected field elements, in order.
    fn parses_public_inputs_of_any_length_in_order() {
        for (json, expected) in [
            (r#"["1", "2"]"#, vec![1u64, 2]),
            (r#"["1", "2", "3", "4"]"#, vec![1u64, 2, 3, 4]),
        ] {
            let expected: Vec<GrothFp> = expected.into_iter().map(GrothFp::from).collect();
            assert_eq!(parse_public_inputs_json(json), expected);
        }
    }

    #[test]
    /// Three inputs serialize to the same bytes as the previous `PublicInputs<3>` format.
    fn serialization_matches_the_previous_fixed_size_format() {
        let json = r#"["1", "2", "21888242871839275222246405745257275088548364400416034343698204186575808495616"]"#;
        let fixed: PublicInputs<3> = PublicInputs::from_json(json);
        let mut previous = Vec::new();
        fixed.inputs.serialize_compressed(&mut previous).unwrap();

        assert_eq!(
            serialize_public_inputs(&parse_public_inputs_json(json)),
            previous
        );
    }

    #[test]
    /// The printed output covers every input, not only the first three.
    fn includes_all_public_inputs_in_command_output() {
        let inputs = parse_public_inputs_json(r#"["1", "2", "3", "4"]"#);
        let output = format_public_inputs_output(&inputs);
        assert!(output.starts_with("PUBLIC_INPUTS: ["));
        assert_eq!(serialize_public_inputs(&inputs).len(), 4 * 32);
    }
}
