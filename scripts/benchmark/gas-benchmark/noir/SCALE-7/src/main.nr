use sha256::sha256_var;
use std::{collections::bounded_vec::BoundedVec, hash::pedersen_hash};
use zkemail::{dkim::RSAPubkey, headers::body_hash::get_body_hash, KEY_LIMBS_2048, Sequence};

global MAX_EMAIL_HEADER_LENGTH: u32 = 2048;
global MAX_EMAIL_BODY_LENGTH: u32 = 4096;

fn main(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    body: BoundedVec<u8, MAX_EMAIL_BODY_LENGTH>,
    pubkey: RSAPubkey<KEY_LIMBS_2048>,
    signature: [Field; KEY_LIMBS_2048],
    body_hash_index: u32,
    dkim_header_sequence: Sequence,
) -> pub [Field; 3] {
    assert(header.len() <= MAX_EMAIL_HEADER_LENGTH);
    assert(body.len() <= MAX_EMAIL_BODY_LENGTH);

    pubkey.verify_dkim_signature(header, signature);

    let signed_body_hash = get_body_hash(header, dkim_header_sequence, body_hash_index);

    let computed_body_hash: [u8; 32] = sha256_var(body.storage, body.len() as u64);

    assert(
        signed_body_hash == computed_body_hash,
        "SHA256 hash computed over body does not match body hash found in DKIM-signed header",
    );

    let email_nullifier = pedersen_hash(signature);
    let pubkey_hash = pubkey.hash();
    [pubkey_hash[0], pubkey_hash[1], email_nullifier]
}
