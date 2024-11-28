//! An end-to-end example of using the SP1 SDK to generate a proof of a program that can be executed
//! or have a core proof generated.
//!
//! You can run this script using the following command:
//! ```shell
//! RUST_LOG=info cargo run --release -- --execute
//! ```
//! or
//! ```shell
//! RUST_LOG=info cargo run --release -- --prove
//! ```

use std::{fs, process::Command};

use actix_web::{rt::task, web};
use alloy_sol_types::SolType;
use clap::Parser;
use serde::Deserialize;
use sha2_prover_lib::{Sha2ProverInputs, Sha2ProverOutputs};
use sp1_sdk::{include_elf, ProverClient, SP1Stdin};

/// The ELF (executable and linkable format) file for the Succinct RISC-V zkVM.
pub const SHA2_PROVER_ELF: &[u8] = include_elf!("sha2-prover-program");

/// The arguments for the command.
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    #[clap(long)]
    execute: bool,

    #[clap(long)]
    prove: bool,
}

#[derive(Debug, Deserialize)]
struct Inputs {
    body: Vec<String>,
    signature: Vec<String>,
}

impl From<Inputs> for Sha2ProverInputs {
    fn from(val: Inputs) -> Self {
        Sha2ProverInputs {
            body: val.body.iter().map(|b| b.parse::<u8>().unwrap()).collect(),
            signature: val
                .signature
                .iter()
                .map(|s| s.parse::<u128>().unwrap())
                .collect(),
        }
    }
}

async fn generate_input(eml_path: String) -> Result<Inputs, String> {
    let email =
        fs::read_to_string(&eml_path).map_err(|e| format!("failed to read email file: {}", e))?;

    let write_email = web::block(move || {
        fs::write("node/email.eml", email).expect("failed to write email.eml");
    });
    write_email.await.expect("failed to write email.eml");

    let delete_script = task::spawn_blocking(|| {
        let script_path = "node/input.json";
        if fs::metadata(script_path).is_ok() {
            fs::remove_file(script_path).expect("failed to delete input.json");
        }
    });
    delete_script.await.expect("failed to delete input.json");

    let run_script = task::spawn_blocking(|| {
        Command::new("sh")
            .arg("-c")
            .arg("cd node && node index.js")
            .spawn()
            .expect("failed to run index.js")
            .wait()
            .expect("failed to wait for index.js");
    });
    run_script.await.expect("failed to run index.js");

    let inputs_path = "node/input.json";
    let inputs_json = match fs::read_to_string(inputs_path) {
        Ok(json) => json,
        Err(err) => return Err(format!("failed to read input.json: {}", err)),
    };

    let inputs: Inputs = match serde_json::from_str(&inputs_json) {
        Ok(inputs) => inputs,
        Err(err) => return Err(format!("failed to parse input.json: {}", err)),
    };

    Ok(inputs)
}

#[tokio::main]
async fn main() {
    // Setup the logger.
    sp1_sdk::utils::setup_logger();

    // Parse the command line arguments.
    let args = Args::parse();

    if args.execute == args.prove {
        eprintln!("Error: You must specify either --execute or --prove");
        std::process::exit(1);
    }

    // Setup the prover client.
    let client = ProverClient::new();

    let input: Sha2ProverInputs =
        generate_input("../../circuits/tests/test-emails/test.eml".to_string())
            .await
            .unwrap()
            .into();

    // Setup the inputs.
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    if args.execute {
        // Execute the program
        let (output, report) = client.execute(SHA2_PROVER_ELF, stdin).run().unwrap();
        println!("Program executed successfully.");

        // Read the output.
        let decoded = Sha2ProverOutputs::abi_decode(output.as_slice(), true).unwrap();
        let Sha2ProverOutputs {
            body_hash_commit,
            body_commit,
        } = decoded;
        println!("body_hash_commit: {:?}", body_hash_commit);
        println!("body_commit: {:?}", body_commit);

        // Record the number of cycles executed.
        println!("Number of cycles: {}", report.total_instruction_count());
    } else {
        // Setup the program for proving.
        let (pk, vk) = client.setup(SHA2_PROVER_ELF);

        // Generate the proof
        let proof = client
            .prove(&pk, stdin)
            .run()
            .expect("failed to generate proof");

        println!("Successfully generated proof!");

        // Verify the proof.
        client.verify(&proof, &vk).expect("failed to verify proof");
        println!("Successfully verified proof!");
    }
}
