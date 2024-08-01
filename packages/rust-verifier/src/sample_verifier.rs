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

/// This is a sample verifier generated based on proof of twitter circuit.
pub fn verify(proof: &[u8], public_inputs: &[u8]) -> Result<bool, SerializationError> {
    // no need to check serialization since it's hardcoded and known to be correct
    let vk = VerifyingKey::<Bn254>::deserialize_compressed_unchecked(
        [
            226, 242, 109, 190, 162, 153, 245, 34, 59, 100, 108, 177, 251, 51, 234, 219, 5, 157,
            148, 7, 85, 157, 116, 65, 223, 217, 2, 227, 167, 154, 77, 45, 171, 183, 61, 193, 127,
            188, 19, 2, 30, 36, 113, 224, 192, 139, 214, 125, 132, 1, 245, 43, 115, 214, 208, 116,
            131, 121, 76, 173, 71, 120, 24, 14, 12, 6, 243, 59, 188, 76, 121, 169, 202, 222, 242,
            83, 166, 128, 132, 211, 130, 241, 119, 136, 248, 133, 201, 175, 209, 118, 247, 203, 47,
            3, 103, 137, 237, 246, 146, 217, 92, 189, 222, 70, 221, 218, 94, 247, 212, 34, 67, 103,
            121, 68, 92, 94, 102, 0, 106, 66, 118, 30, 31, 18, 239, 222, 0, 24, 194, 18, 243, 174,
            183, 133, 228, 151, 18, 231, 169, 53, 51, 73, 170, 241, 37, 93, 251, 49, 183, 191, 96,
            114, 58, 72, 13, 146, 147, 147, 142, 25, 1, 69, 121, 134, 93, 208, 2, 83, 92, 56, 239,
            172, 54, 84, 20, 35, 17, 100, 50, 145, 43, 13, 220, 39, 152, 144, 61, 92, 116, 203, 57,
            28, 205, 91, 30, 13, 232, 208, 19, 45, 175, 0, 153, 43, 95, 127, 73, 5, 197, 126, 16,
            222, 154, 192, 13, 15, 160, 246, 125, 166, 175, 222, 199, 8, 4, 0, 0, 0, 0, 0, 0, 0,
            74, 9, 106, 65, 34, 245, 168, 250, 60, 209, 129, 11, 236, 5, 203, 217, 29, 239, 226,
            161, 191, 159, 6, 122, 234, 24, 103, 53, 58, 71, 191, 157, 135, 33, 153, 194, 189, 14,
            222, 253, 84, 118, 245, 251, 81, 170, 176, 157, 251, 127, 158, 19, 221, 104, 48, 221,
            165, 77, 124, 253, 243, 148, 127, 166, 243, 4, 48, 221, 78, 125, 230, 89, 119, 207, 74,
            255, 135, 98, 32, 219, 216, 51, 106, 129, 224, 150, 232, 7, 49, 162, 143, 152, 181,
            176, 110, 164, 212, 176, 14, 157, 54, 99, 165, 116, 3, 194, 13, 6, 220, 75, 94, 204,
            113, 226, 198, 186, 49, 80, 39, 152, 13, 241, 151, 254, 186, 114, 68, 148,
        ]
        .as_slice(),
    )?;

    let public_inputs = <[Fp<MontBackend<FrConfig, 4>, 4>; 3]>::deserialize_with_mode(
        &public_inputs[..],
        Compress::Yes,
        Validate::Yes,
    )?;

    let proof = Proof::<Bn<Config>>::deserialize_compressed(&proof[..])?;

    Ok(Groth16::<Bn254, CircomReduction>::verify(&vk, &public_inputs, &proof).unwrap())
}
