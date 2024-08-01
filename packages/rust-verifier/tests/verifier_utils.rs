#[cfg(test)]
mod tests {
    use std::io::BufWriter;

    use ark_crypto_primitives::snark::SNARK;
    use ark_serialize::CanonicalSerialize;
    use utils::sample_verifier::verify;
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

    #[test]
    fn test_embedded_verifier() {
        let proof = GrothBnProof::from_json_file("tests/data/proof_of_twitter/proof.json");
        let public_inputs: PublicInputs<3> =
            PublicInputs::from_json_file("tests/data/proof_of_twitter/public.json");

        let mut serialized_public_inputs = Vec::new();
        let mut serialized_proof = Vec::new();
        {
            let writer = BufWriter::new(&mut serialized_public_inputs);
            public_inputs.inputs.serialize_compressed(writer).unwrap();

            let writer = BufWriter::new(&mut serialized_proof);
            proof.serialize_compressed(writer).unwrap();
        }

        let verified = verify(&serialized_proof, &serialized_public_inputs).unwrap();

        assert!(verified);
    }
}
