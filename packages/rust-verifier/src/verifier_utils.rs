use ark_bn254::Bn254;
use ark_bn254::Config;
use ark_bn254::Fq2;
use ark_bn254::FrConfig;
use ark_bn254::G1Affine;
use ark_bn254::G2Affine;
use ark_circom::CircomReduction;
use ark_ec::bn::Bn;
use ark_ff::Fp;
use ark_ff::MontBackend;
use ark_groth16::Groth16;
use ark_groth16::Proof;
use ark_groth16::VerifyingKey;
use ark_serialize::CanonicalSerialize;
use serde::Deserialize;
use std::fs;
use std::ops::Deref;
use std::str::FromStr;

pub type GrothBn = Groth16<Bn254, CircomReduction>;
pub type GrothBnProof = Proof<Bn<Config>>;
pub type GrothBnVkey = VerifyingKey<Bn254>;
pub type GrothFp = Fp<MontBackend<FrConfig, 4>, 4>;

#[derive(Debug, Deserialize)]
struct SnarkJsProof {
    pi_a: [String; 3],
    pi_b: [[String; 2]; 3],
    pi_c: [String; 3],
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
struct SnarkJsVkey {
    vk_alpha_1: [String; 3],
    vk_beta_2: [[String; 2]; 3],
    vk_gamma_2: [[String; 2]; 3],
    vk_delta_2: [[String; 2]; 3],
    IC: Vec<[String; 3]>,
}

#[derive(Debug)]
pub struct PublicInputs {
    pub inputs: Vec<GrothFp>,
}

#[derive(Deserialize)]
#[allow(non_snake_case)]
pub struct PublicInputsCount {
    pub nPublic: usize,
}

pub trait JsonDecoder {
    fn from_json(json: &str) -> Self;
    fn from_json_file(file_path: &str) -> Self
    where
        Self: Sized,
    {
        let json = fs::read_to_string(file_path).unwrap();
        Self::from_json(&json)
    }
}

impl JsonDecoder for GrothBnProof {
    fn from_json(json: &str) -> Self {
        let snarkjs_proof: SnarkJsProof = serde_json::from_str(json).unwrap();
        let a = G1Affine {
            x: Fp::from_str(snarkjs_proof.pi_a[0].as_str()).unwrap(),
            y: Fp::from_str(snarkjs_proof.pi_a[1].as_str()).unwrap(),
            infinity: false,
        };
        let b = G2Affine {
            x: Fq2::new(
                Fp::from_str(snarkjs_proof.pi_b[0][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_proof.pi_b[0][1].as_str()).unwrap(),
            ),
            y: Fq2::new(
                Fp::from_str(snarkjs_proof.pi_b[1][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_proof.pi_b[1][1].as_str()).unwrap(),
            ),
            infinity: false,
        };
        let c = G1Affine {
            x: Fp::from_str(snarkjs_proof.pi_c[0].as_str()).unwrap(),
            y: Fp::from_str(snarkjs_proof.pi_c[1].as_str()).unwrap(),
            infinity: false,
        };
        Proof { a, b, c }
    }
}

impl JsonDecoder for GrothBnVkey {
    fn from_json(json: &str) -> Self {
        let snarkjs_vkey: SnarkJsVkey = serde_json::from_str(json).unwrap();
        let vk_alpha_1 = G1Affine {
            x: Fp::from_str(snarkjs_vkey.vk_alpha_1[0].as_str()).unwrap(),
            y: Fp::from_str(snarkjs_vkey.vk_alpha_1[1].as_str()).unwrap(),
            infinity: false,
        };
        let vk_beta_2 = G2Affine {
            x: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_beta_2[0][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_beta_2[0][1].as_str()).unwrap(),
            ),
            y: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_beta_2[1][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_beta_2[1][1].as_str()).unwrap(),
            ),
            infinity: false,
        };
        let vk_gamma_2 = G2Affine {
            x: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_gamma_2[0][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_gamma_2[0][1].as_str()).unwrap(),
            ),
            y: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_gamma_2[1][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_gamma_2[1][1].as_str()).unwrap(),
            ),
            infinity: false,
        };
        let vk_delta_2 = G2Affine {
            x: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_delta_2[0][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_delta_2[0][1].as_str()).unwrap(),
            ),
            y: Fq2::new(
                Fp::from_str(snarkjs_vkey.vk_delta_2[1][0].as_str()).unwrap(),
                Fp::from_str(snarkjs_vkey.vk_delta_2[1][1].as_str()).unwrap(),
            ),
            infinity: false,
        };

        let ic = snarkjs_vkey
            .IC
            .iter()
            .map(|ic| G1Affine {
                x: Fp::from_str(ic[0].as_str()).unwrap(),
                y: Fp::from_str(ic[1].as_str()).unwrap(),
                infinity: false,
            })
            .collect();

        VerifyingKey {
            alpha_g1: vk_alpha_1,
            beta_g2: vk_beta_2,
            gamma_g2: vk_gamma_2,
            delta_g2: vk_delta_2,
            gamma_abc_g1: ic,
        }
    }
}

impl JsonDecoder for PublicInputsCount {
    fn from_json(json: &str) -> Self {
        serde_json::from_str(json).unwrap()
    }
}

impl JsonDecoder for PublicInputs {
    fn from_json(json: &str) -> Self {
        let inputs: Vec<String> = serde_json::from_str(json).unwrap();
        let inputs: Vec<GrothFp> = inputs
            .iter()
            .map(|input| Fp::from_str(input).unwrap())
            .collect();
        Self { inputs }
    }
}

impl Deref for PublicInputs {
    type Target = [GrothFp];

    fn deref(&self) -> &Self::Target {
        &self.inputs
    }
}

impl CanonicalSerialize for PublicInputs {
    fn serialize_with_mode<W: ark_serialize::Write>(
        &self,
        mut writer: W,
        compress: ark_serialize::Compress,
    ) -> Result<(), ark_serialize::SerializationError> {
        for input in &self.inputs {
            input.serialize_with_mode(&mut writer, compress)?;
        }
        Ok(())
    }

    fn serialized_size(&self, compress: ark_serialize::Compress) -> usize {
        self.inputs
            .iter()
            .map(|input| input.serialized_size(compress))
            .sum()
    }
}
