use crate::verifier_utils::GrothFp;
use ark_ff::*;
use poseidon_ark as poseidon;

const EMAIL_MAX_BYTES: usize = 256;
const TX_BODY_MAX_BYTES: usize = 512;

pub fn calculate_email_commitment(salt: &str, email: &str) -> GrothFp {
    let padded_salt_bytes = pad_bytes(salt.as_bytes(), 31);
    let padded_email_bytes = pad_bytes(email.as_bytes(), EMAIL_MAX_BYTES);
    let mut salt = pack_bytes_into_fields(padded_salt_bytes);
    let email = pack_bytes_into_fields(padded_email_bytes);
    salt.extend(email);
    let poseidon = poseidon::Poseidon::new();
    poseidon.hash(salt).unwrap()
}

pub fn calculate_tx_body_commitment(tx: &str) -> GrothFp {
    let padded_tx_bytes = pad_bytes(tx.as_bytes(), TX_BODY_MAX_BYTES);
    let tx = pack_bytes_into_fields(padded_tx_bytes);
    let poseidon = poseidon::Poseidon::new();
    let mut commitment = GrothFp::zero(); // Initialize commitment with an initial value

    tx.chunks(16).enumerate().for_each(|(i, chunk)| {
        let chunk_commitment = poseidon.hash(chunk.to_vec()).unwrap();
        commitment = if i == 0 {
            chunk_commitment
        } else {
            poseidon.hash(vec![commitment, chunk_commitment]).unwrap()
        };
    });

    commitment
}

fn pack_bytes_into_fields(bytes: Vec<u8>) -> Vec<GrothFp> {
    // convert each 31 bytes into one field element
    let mut fields = vec![];
    bytes.chunks(31).for_each(|chunk| {
        fields.push(GrothFp::from_le_bytes_mod_order(chunk));
    });
    fields
}

fn pad_bytes(bytes: &[u8], length: usize) -> Vec<u8> {
    let mut padded = bytes.to_vec();
    let padding = length - bytes.len();
    for _ in 0..padding {
        padded.push(0);
    }
    padded
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn should_calculate_email_commitment() {
        let salt_str = "XRhMS5Nc2dTZW5kEpAB";
        let email_str = "thezdev1@gmail.com";

        let commitment = calculate_email_commitment(&salt_str, &email_str);

        assert_eq!(
            commitment,
            Fp::from_str(
                "20222897760242655042591071331570003228637614099423116142933693104079157558229"
            )
            .unwrap()
        );
    }

    #[test]
    fn should_calculate_tx_body_commitment() {
        let tx_body = "CrQBCrEBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEpABCj94aW9uMWd2cDl5djZndDBwcmdzc3\
        ZueWNudXpnZWszZmtyeGxsZnhxaG0wNzYwMmt4Zmc4dXI2NHNuMnAycDkSP3hpb24xNGNuMG40ZjM4ODJzZ3B2NWQ5ZzA2dzNxN3hzZ\
        m51N3B1enltZDk5ZTM3ZHAwemQ4bTZscXpwemwwbRoMCgV1eGlvbhIDMTAwEmEKTQpDCh0vYWJzdHJhY3RhY2NvdW50LnYxLk5pbFB1\
        YktleRIiCiBDAlIzSFvCNEIMmTE+CRm0U2Gb/0mBfb/aeqxkoPweqxIECgIIARh/EhAKCgoFdXhpb24SATAQwJoMGg54aW9uLXRlc3R\
        uZXQtMSCLjAo=";

        let commitment = calculate_tx_body_commitment(&tx_body);

        assert_eq!(
            commitment,
            Fp::from_str(
                "21532090391056315603450239923154193952164369422267200983793686866358632420524"
            )
            .unwrap()
        );
    }
}
