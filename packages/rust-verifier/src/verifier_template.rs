use ark_bn254::Bn254;
use ark_bn254::Config;
use ark_bn254::FrConfig;
use ark_circom::CircomReduction;
use ark_crypto_primitives::snark::SNARK;
use ark_ec::bn::Bn;
use ark_ff::Fp;
use ark_ff::MontBackend;
use ark_groth16::Groth16;
use ark_groth16::Proof;
use ark_groth16::VerifyingKey;
use ark_serialize::CanonicalDeserialize;
use ark_serialize::Compress;
use ark_serialize::SerializationError;
use ark_serialize::Validate;

pub fn verify(proof: &[u8], public_inputs: &[u8]) -> Result<bool, SerializationError> {
    // no need to check serialization since it's hardcoded and known to be correct
    let vk = VerifyingKey::<Bn254>::deserialize_compressed_unchecked([COMPRESSED_VKEY].as_slice())?;

    let public_inputs =
        <[Fp<MontBackend<FrConfig, 4>, 4>; PUBLIC_INPUTS_COUNT]>::deserialize_with_mode(
            &public_inputs[..],
            Compress::Yes,
            Validate::Yes,
        )?;

    let proof = Proof::<Bn<Config>>::deserialize_compressed(&proof[..])?;

    Ok(Groth16::<Bn254, CircomReduction>::verify(&vk, &public_inputs, &proof).unwrap())
}
