#[cfg(test)]
mod tests {
    use ark_crypto_primitives::snark::SNARK;
    use utils::verifier_utils::{GrothBn, GrothBnProof, GrothBnVkey, JsonDecoder, PublicInputs};

    #[test]
    fn test_case_1_proof_valid() {
        let vkey = GrothBnVkey::from_json_file("tests/data/proof_of_twitter/vkey.json");
        let proof = GrothBnProof::from_json_file("tests/data/proof_of_twitter/proof.json");
        let public_inputs: PublicInputs<3> =
            PublicInputs::from_json_file("tests/data/proof_of_twitter/public.json");
        let verified = GrothBn::verify(&vkey, &public_inputs, &proof).unwrap();
        assert!(verified);
    }
}
