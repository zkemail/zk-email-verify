#[cfg(test)]
mod tests {
    use std::io::BufWriter;

    use ark_crypto_primitives::snark::SNARK;
    use ark_serialize::CanonicalDeserialize;
    use ark_serialize::CanonicalSerialize;
    use base64::{engine, Engine};
    use utils::commit::calculate_tx_body_commitment;
    use utils::sample_verifier::verify;
    use utils::verifier_utils::{
        GrothBn, GrothBnProof, GrothBnVkey, GrothFp, JsonDecoder, PublicInputs,
    };

    #[test]
    fn test_burnt_proof_valid() {
        let vkey_base64 = "eyJ2a19hbHBoYV8xIjpbIjIwNDkxMTkyODA1MzkwNDg1Mjk5MTUzMDA5NzczNTk0NTM0OTQwMTg5MjYxODY2MjI4NDQ3OTE4MDY4NjU4NDcxOTcwNDgxNzYzMDQyIiwiOTM4MzQ4NTM2MzA1MzI5MDIwMDkxODM0NzE1NjE1NzgzNjU2NjU2Mjk2Nzk5NDAzOTcxMjI3MzQ0OTkwMjYyMTI2NjE3ODU0NTk1OCIsIjEiXSwidmtfYmV0YV8yIjpbWyI2Mzc1NjE0MzUxNjg4NzI1MjA2NDAzOTQ4MjYyODY4OTYyNzkzNjI1NzQ0MDQzNzk0MzA1NzE1MjIyMDExNTI4NDU5NjU2NzM4NzMxIiwiNDI1MjgyMjg3ODc1ODMwMDg1OTEyMzg5Nzk4MTQ1MDU5MTM1MzUzMzA3MzQxMzE5Nzc3MTc2ODY1MTQ0MjY2NTc1MjI1OTM5NzEzMiJdLFsiMTA1MDUyNDI2MjYzNzAyNjIyNzc1NTI5MDEwODIwOTQzNTY2OTc0MDk4MzU2ODAyMjA1OTA5NzE4NzMxNzExNDAzNzEzMzEyMDY4NTYiLCIyMTg0NzAzNTEwNTUyODc0NTQwMzI4ODIzMjY5MTE0NzU4NDcyODE5MTE2MjczMjI5OTg2NTMzODM3NzE1OTY5MjM1MDA1OTEzNjY3OSJdLFsiMSIsIjAiXV0sInZrX2dhbW1hXzIiOltbIjEwODU3MDQ2OTk5MDIzMDU3MTM1OTQ0NTcwNzYyMjMyODI5NDgxMzcwNzU2MzU5NTc4NTE4MDg2OTkwNTE5OTkzMjg1NjU1ODUyNzgxIiwiMTE1NTk3MzIwMzI5ODYzODcxMDc5OTEwMDQwMjEzOTIyODU3ODM5MjU4MTI4NjE4MjExOTI1MzA5MTc0MDMxNTE0NTIzOTE4MDU2MzQiXSxbIjg0OTU2NTM5MjMxMjM0MzE0MTc2MDQ5NzMyNDc0ODkyNzI0Mzg0MTgxOTA1ODcyNjM2MDAxNDg3NzAyODA2NDkzMDY5NTgxMDE5MzAiLCI0MDgyMzY3ODc1ODYzNDMzNjgxMzMyMjAzNDAzMTQ1NDM1NTY4MzE2ODUxMzI3NTkzNDAxMjA4MTA1NzQxMDc2MjE0MTIwMDkzNTMxIl0sWyIxIiwiMCJdXSwidmtfZGVsdGFfMiI6W1siMjIyMDk5OTM2NTkyMTI0NDExNTEwNDM1MDY3NzExNDc4NjM0NDc3Mjc1MjM4OTI4NzQyNDYzODU5NjAwODg0OTQ1NzQ1NDc2MTI4OCIsIjgxNTU0MDM1OTc1NTIwODk4NzExODA2MTg2MzUwNjI0OTgwMTQxOTY0OTU4MDUyMDk5NzYwOTIzODQ2NTMxOTcyOTk2MDkwNTg4MzkiXSxbIjg1ODg4ODM3MTU2OTQ3Njk2NTA2ODcxNzkzNzM1OTkzNzY3ODE3NDkyNjUwMjgzMTA2NDcyODU2NzYyMzAwMTA4MzA1NDAyNjE1NTQiLCI2ODY4NTgwNTE0NTY0MzYwNTE5NDQyMjAxMTU4NzYxNDAyNzY5NDcwMzI3MDc2OTQwMDYzNTcxMDk4MTQyNTI4NDc0MDQ2NjU5MTkzIl0sWyIxIiwiMCJdXSwiSUMiOltbIjEzNTUyNzk2MTU5MzIxNTAwNDQ2NTQyMDkyMzMzOTI1Nzg5NjI3MjIxNzYzOTk1OTE3MDU3NzA1MDI1MDI0NzM2ODQ1NzIxOTQyMzUzIiwiOTY4MDk4NTI4NTA0MDIzMDc1MTY0NDQ5NTg5MzIxNTM4MjY3NjA4MTUzNTg3NjM2MzU1MzY2MDM3NDExNTU4ODg2MjA2MDQ4NzAzNCIsIjEiXSxbIjE1MjU0Nzc2NzcyNjEwNTMzMzI3NDg4ODE0MjgxOTMxMjg3NjY1ODkzOTQzMTc3OTc3MzEwMTY4MDU2NzIyMzY4MjgxNzI4NjE4NjYyIiwiMTQzNjc2NTc3MDEyNDk1NDc5MTg1MTM2NzU1MzMwOTEyODYzODMzNTgxODU2NjI4Njk4ODczMTY0NjY4MTMwNjIxNDI2NzQ0OTkyNjAiLCIxIl0sWyIxNDg2Njg1OTE3Nzc1ODYzNTAzMDA3OTIyNjM0MTg2MjYwMTExMjk4MzQ4NzgzODUxMTY5MDU2Nzg5NTU3NDAzMDY3MjIxMjQ0MTY3NiIsIjExMzE0NTQyMjkzNTMzOTczMzI4NDE2NDQxNjYzMTc2MDMyMzk5ODQ1NTE5MzAwNDQ2ODk0NDA3NTIwMDgzNDEyMDM2ODg4MzQyOTgiLCIxIl0sWyIxNDQ1MjkwMjQ4MjgyODU1ODI3MDI5ODM3NDczNzcwNTY1ODM1MTI3MDc4ODQyODAxOTU4NTI0MTAyNjkwMTMzMTM2ODg1ODUyNzk0OCIsIjE5MDk3OTk3Nzc0NjA2NTIzNTI3MTU4NTI5NTUyNjQ1OTYxMjU3MTUwMTg5MzU3MzU3NjAxMDM1MDc4MTExNjQzOTUzMzg1MTcxMzg0IiwiMSJdXX0=";
        let proof_base64 = "eyJwaV9hIjpbIjE5NjQ0MTcxMTA2NTUzNzQ3ODI3NDY4MTM2MTY3NTcwNTg0Njk2NTU2OTY4MjA4OTM3NDgzMDA4NzA0MzIwODkyMDg3OTc0Mjg0NjEzIiwiNTE3MTk5MjkwNzk4MjI5MDM1MDIxMzI5ODU0NzIwMTA1NTcxNjg3OTc5MzE3OTEwNzAwMzU3OTY2NDUwMTQwNzA1OTg1MDc1OTg0MCIsIjEiXSwicGlfYiI6W1siMTkzNzYwMjM4OTIyMzk4OTQ4OTIyMDAyMzQ0NzI2NjIxMjg5MTI4NTIzMjgyNzM3MDA4NzY0OTI5ODQxOTU3NTY5MDIyNjg4Njg1NTEiLCIxMzk4ODUyODMxOTQyNjM5MjM0MTU1MjcwOTc5Mzg2MDg4MzEwMjU5MjUwODY5MDQ2NzcwOTY4OTkzMzI4NTQ5NTUxNDQ3ODMzNDgxIl0sWyI4NzM1NTAxMzcyMjQyMzY5ODk5MTgxNzUyOTc3MDM3NTIzODQ3OTUzMTY5NTY0MjU4NDUwMDE0NTkwODMyMzA4NjUwOTE0NDExMTc3IiwiOTMzNTM1Nzc5NDExNjA1OTM5MTUxNTExNDMxMjMwMTM2OTUyNTAwODkwODQ0NjUwNTQ2MDQxNzgxNDc3MTU1NTczNzA5OTgzMDc2MiJdLFsiMSIsIjAiXV0sInBpX2MiOlsiMTMxODc4NzI3MzQ5MjA5OTAwNzQxMDAzMTkxNzI2MDg0Njc3NjU0MDY2MTgzMTc3NDI4ODQ0OTUyNjIxMzA2ODE5NzY1NzEyODA0MTIiLCIxNDUwNjU1NjY3MTIzMDgxOTUxMzc4MTExNTY1NDI5MjEzMzgzNDI3NTcxMzk2MjA3OTc2NTUyNjQ1MDI3MjU4NDIwMzEwNzYzMjY4NSIsIjEiXX0=";
        let tx_base64 = "CqIBCp8BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEn8KP3hpb24xdHRrMjR4MnhoazNrcDhxNnd1ZHZ6ZHN4eGo4dWU0NWxjZjdjZDVrcGhueGd4bmw1NDg5cW1sbmt0cBIreGlvbjFxYWYyeGZseDVqM2FndGx2cWs1dmhqcGV1aGw2ZzQ1aHhzaHdxahoPCgV1eGlvbhIGMTAwMDAwEgYSBBDAmgwaBnhpb24tMSAN";
        let email_commitment_base64 = "wjFSp5GIspdOPb0WLFyYfcZLQKt3k2E3thW+/dWuxw0=";
        let pubkey_hash_base64 = "RjMpmQQPLhucCCEh0ouEDTeEkh4+IyOHCrVjy0R1iyo=";

        let vkey = engine::general_purpose::STANDARD
            .decode(vkey_base64)
            .unwrap();
        let vkey = std::str::from_utf8(&vkey).unwrap();
        let vkey: GrothBnVkey = GrothBnVkey::from_json(vkey);

        let proof = engine::general_purpose::STANDARD
            .decode(proof_base64)
            .unwrap();
        let proof = std::str::from_utf8(&proof).unwrap();
        let proof: GrothBnProof = GrothBnProof::from_json(proof);

        let tx_body_commitment = calculate_tx_body_commitment(tx_base64);
        let email_commitment = engine::general_purpose::STANDARD
            .decode(email_commitment_base64)
            .unwrap();
        let email_commitment =
            GrothFp::deserialize_compressed(email_commitment.as_slice()).unwrap();

        let pubkey_hash = engine::general_purpose::STANDARD
            .decode(pubkey_hash_base64)
            .unwrap();
        let pubkey_hash: GrothFp = GrothFp::deserialize_compressed(pubkey_hash.as_slice()).unwrap();

        let verified = GrothBn::verify(
            &vkey,
            &[tx_body_commitment, email_commitment, pubkey_hash],
            &proof,
        )
        .unwrap();

        assert!(verified); // fails
    }

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
