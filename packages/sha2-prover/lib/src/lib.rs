use alloy_sol_types::sol;
use ark_bn254::Fr;
use ark_ff::One;
use poseidon_ark::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

sol! {
    struct Sha2ProverOutputs {
        bytes32 body_hash_commit;
        bytes32 body_commit;
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sha2ProverInputs {
    pub body: Vec<u8>,
    pub signature: Vec<u128>,
}

pub trait ToFr {
    fn to_fr(&self) -> Fr;
}

impl ToFr for u8 {
    fn to_fr(&self) -> Fr {
        Fr::from(*self)
    }
}

impl ToFr for u128 {
    fn to_fr(&self) -> Fr {
        Fr::from(*self)
    }
}

pub fn poseidon_hash(inputs: &[Fr]) -> Result<Fr, String> {
    let poseidon = Poseidon::new();
    poseidon.hash(inputs.to_vec())
}

pub fn poseidon_large(input: &[Fr], bits_per_chunk: u32, chunk_size: usize) -> Fr {
    assert!(
        chunk_size > 16,
        "Can use regular Poseidon for smaller chunks"
    );
    assert!(chunk_size <= 32, "We only support up to 32 chunks");
    assert!(bits_per_chunk * 2 < 251, "Double chunk must fit in field");

    // Calculate half chunk size, rounding up for odd numbers
    let half_chunk_size = (chunk_size + 1) >> 1;

    // Prepare input for Poseidon by merging consecutive chunks
    let mut poseidon_input = Vec::with_capacity(half_chunk_size);
    let shift = Fr::from(1u128 << bits_per_chunk);

    for i in 0..half_chunk_size {
        let merged = if i == half_chunk_size - 1 && chunk_size % 2 == 1 {
            input[2 * i]
        } else {
            let a = input[2 * i];
            let b = input[2 * i + 1];

            a + b * shift
        };
        poseidon_input.push(merged);
    }

    // Calculate Poseidon hash
    let poseidon = Poseidon::new();
    poseidon.hash(poseidon_input).unwrap()
}

pub fn sha2_hash(input: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(input);
    hasher.finalize().into()
}

pub fn rlc(r: &Fr, input: &[Fr]) -> Fr {
    let mut result = input[0];
    let mut r_power = Fr::one();

    for element in input.iter().skip(1) {
        r_power *= r;
        result += element * &r_power;
    }

    result
}
