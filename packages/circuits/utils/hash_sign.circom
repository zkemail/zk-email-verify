
pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";

template HashSign(n,k) {
    // signal input pubkey[k];
    signal input signature[k];

    // signal output pubkey_hash;
    signal output sign_hash;    

    var k2_chunked_size = k >> 1;
    if(k % 2 == 1) {
        k2_chunked_size += 1;
    }
    signal output sign_ints[k2_chunked_size];

    // signal pubkey_hash_input[k2_chunked_size];
    // for(var i = 0; i < k2_chunked_size; i++) {
    //     if(i==k2_chunked_size-1 && k2_chunked_size % 2 == 1) {
    //         pubkey_hash_input[i] <== pubkey[2*i];
    //     } else {
    //         pubkey_hash_input[i] <== pubkey[2*i] + (1<<n) * pubkey[2*i+1];
    //     }
    // }
    // pubkey_hash <== Poseidon(k2_chunked_size)(pubkey_hash_input);
    for(var i = 0; i < k2_chunked_size; i++) {
        if(i==k2_chunked_size-1 && k2_chunked_size % 2 == 1) {
            sign_ints[i] <== signature[2*i];
        } else {
            sign_ints[i] <== signature[2*i] + (1<<n) * signature[2*i+1];
        }
    }
    sign_hash <== Poseidon(k2_chunked_size)(sign_ints);
}


