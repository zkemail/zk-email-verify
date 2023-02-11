pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha256general.circom";
include "./sha256partial.circom";

template Sha256Bytes(max_num_bytes) {
    signal input in_padded[max_num_bytes];
    signal input in_len_padded_bytes;
    signal output out[256];

    var num_bits = max_num_bytes * 8;
    component sha = Sha256General(num_bits);

    component bytes[max_num_bytes];
    for (var i = 0; i < max_num_bytes; i++) {
        bytes[i] = Num2Bits(8);
        bytes[i].in <== in_padded[i];
        for (var j = 0; j < 8; j++) {
            sha.paddedIn[i*8+j] <== bytes[i].out[7-j];
        }
    }
    sha.in_len_padded_bits <== in_len_padded_bytes * 8;

    for (var i = 0; i < 256; i++) {
        out[i] <== sha.out[i];
    }
}

template Sha256BytesPartial(max_num_bytes) {
    assert(max_num_bytes % 32 == 0);
    signal input in_padded[max_num_bytes];
    signal input in_len_padded_bytes;
    signal input pre_hash[32];
    signal output out[256];

    var num_bits = max_num_bytes * 8;
    component sha = Sha256Partial(num_bits);

    component bytes[max_num_bytes];
    for (var i = 0; i < max_num_bytes; i++) {
        bytes[i] = Num2Bits(8);
        bytes[i].in <== in_padded[i];
        for (var j = 0; j < 8; j++) {
            sha.paddedIn[i*8+j] <== bytes[i].out[7-j];
        }
    }
    sha.in_len_padded_bits <== in_len_padded_bytes * 8;

    component states[32];
    for (var i = 0; i < 32; i++) {
        states[i] = Num2Bits(8);
        states[i].in <== pre_hash[i];
        for (var j = 0; j < 8; j++) {
            sha.pre_state[8*i+j] <== states[i].out[7-j];
        }
    }

    for (var i = 0; i < 256; i++) {
        out[i] <== sha.out[i];
    }
}

// Takes in 2^(8 * 31)-sized integers, not bytes, to save calldata. n is usually 31.
// max_num_n_bytes is the number of n-byte size inputs we have. expected to be max_num_bytes / (n + 1)
// template Sha256NBytes(max_num_n_bytes, n) {
//     assert(1 << log_ceil(max_num_n_bytes) == max_num_n_bytes); // max_num_n_bytes is a power of 2
//     assert(1 << log_ceil(n+1) == n+1); // n+1 is a power of 2

//     // assert(1 << log_ceil(in_len_padded_bytes) == in_len_padded_bytes); // in_len_padded_bytes is a power of 2
//     // assert(in_len_padded_bytes <= max_num_n_bytes * n)
//     signal input in_padded[max_num_n_bytes];
//     signal input in_len_padded_bytes; // Keep this in bytes for now. Can make n_bytes later.
//     signal output out[256];

//     var num_bits = max_num_n_bytes * 8 * (n + 1); // makes it a power of 2, though we waste 3% of constraints
//     assert(1 << log_ceil(num_bits) == num_bits); // num_bits is a power of 2

//     component sha = Sha256General(num_bits);

//     component n_bytes[max_num_n_bytes];
//     for (var i = 0; i < max_num_n_bytes; i++) {
//         n_bytes[i] = Num2Bits(8 * n);
//         n_bytes[i].in <== in_padded[i];
//         for (var k = 0; k < n; k++){
//             for (var j = 0; j < 8; j++) {
//                 sha.paddedIn[i * 8 * n + k * 8 + j] <== n_bytes[i].out[k * 8 + 7 - j]; // Big/little endian handled here
//             }
//         }
//     }
//     for (var j = 0; j < 8; j++) {
//         sha.paddedIn[max_num_n_bytes * 8 * n + j] <== 0;
//     }

//     sha.in_len_padded_bits <== in_len_padded_bytes * 8;

//     for (var i = 0; i < 256; i++) {
//         out[i] <== sha.out[i];
//     }
// }

// component main { public [ in_padded, in_len_padded_bytes ] } = Sha256Bytes(448);
// Note that Sha256NBytes is an unnecesary optimization.
// component main { public [ in_padded, in_len_padded_bytes ] } = Sha256NBytes(64, 31);
