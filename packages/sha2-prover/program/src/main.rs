//! A simple program that takes a number `n` as input, and writes the `n-1`th and `n`th fibonacci
//! number as an output.

// These two lines are necessary for the program to properly compile.
//
// Under the hood, we wrap your main function with some extra code so that it behaves properly
// inside the zkVM.
#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_sol_types::SolType;
use ark_ff::*;
use sha2_prover_lib::{
    poseidon_hash, poseidon_large, rlc, sha2_hash, Sha2ProverInputs, Sha2ProverOutputs, ToFr,
};

pub fn main() {
    let inputs = sp1_zkvm::io::read::<Sha2ProverInputs>();

    let body_fr = inputs.body.iter().map(|b| b.to_fr()).collect::<Vec<_>>();
    let signature_fr = inputs
        .signature
        .iter()
        .map(|s| s.to_fr())
        .collect::<Vec<_>>();

    let body_hash = sha2_hash(&inputs.body);
    let body_hash_fr = body_hash.iter().map(|h| h.to_fr()).collect::<Vec<_>>();
    let body_hash_hash = poseidon_large(&body_hash_fr, 8, 32);
    let signature_hash = poseidon_large(&signature_fr, 121, 17);

    let body_hash_commit = poseidon_hash(&[signature_hash, body_hash_hash]).unwrap();
    let body_commit = rlc(&body_hash_commit, &body_fr);

    let output_bytes = Sha2ProverOutputs::abi_encode(&Sha2ProverOutputs {
        body_hash_commit: alloy_sol_types::private::FixedBytes(
            body_hash_commit.0.to_bytes_be().try_into().unwrap(),
        ),
        body_commit: alloy_sol_types::private::FixedBytes(
            body_commit.0.to_bytes_be().try_into().unwrap(),
        ),
    });

    sp1_zkvm::io::commit_slice(&output_bytes);
}
