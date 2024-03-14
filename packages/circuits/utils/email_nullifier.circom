
pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";

template EmailNullifier() {
    // signal input header_hash[256];
    signal input sign_hash;

    signal output email_nullifier;

    // var field_pack_bits = field_pack_bits_const();

    // signal header_hash_int[field_pack_bits+1];
    // header_hash_int[0] <== 0;
    // for(var i = 0; i < field_pack_bits; i++) {
    //     header_hash_int[i+1] <== 2 * header_hash_int[i] + header_hash[i];
    // }
    // signal email_nullifier_input[1];
    // email_nullifier_input[0] <== sign_hash;
    email_nullifier <== Poseidon(1)([sign_hash]);
}


