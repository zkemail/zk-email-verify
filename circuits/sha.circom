pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha256.circom";
include "./rsa.circom";

template Sha256Bytes(max_num_bytes) {
    signal input in[max_num_bytes];
    signal input in_len_padded_bytes;
    signal output out[256];

    var num_bits = max_num_bytes * 8;
    component sha = Sha256General(num_bits);

    component bytes[max_num_bytes];
    for (var i = 0; i < max_num_bytes; i++) {
        bytes[i] = Num2Bits(8);
        bytes[i].in <== in[i];
        for (var j = 0; j < 8; j++) {
            sha.paddedIn[i*8+j] <== bytes[i].out[7-j];
        }
    }
    sha.in_len_padded_bits <== in_len_padded_bytes * 8;

    for (var i = 0; i < 256; i++) {
        out[i] <== sha.out[i];
    }
}

template EmailVerify(max_num_bytes, n, k) {
    // max_num_bytes must be a multiple of 64
    signal input in[max_num_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    component sha = Sha256Bytes(max_num_bytes);
    for (var i = 0; i < max_num_bytes; i++) {
        sha.in[i] <== in[i];
    }
    sha.in_len_padded_bytes <== in_len_padded_bytes;

    var msg_len = (256+n)\n;
    component base_msg[msg_len];
    for (var i = 0; i < msg_len; i++) {
        base_msg[i] = Bits2Num(n);
    }
    for (var i = 0; i < 256; i++) {
        base_msg[i\n].in[i%n] <== sha.out[255 - i];
    }
    for (var i = 256; i < n*msg_len; i++) {
        base_msg[i\n].in[i%n] <== 0;
    }

    component rsa = RSAVerify65537(n, k);
    for (var i = 0; i < msg_len; i++) {
        rsa.base_message[i] <== base_msg[i].out;
    }
    for (var i = msg_len; i < k; i++) {
        rsa.base_message[i] <== 0;
    }
    for (var i = 0; i < k; i++) {
        rsa.modulus[i] <== modulus[i];
    }
    for (var i = 0; i < k; i++) {
        rsa.signature[i] <== signature[i];
    }
}

// todo move to sha256 padding to js
component main { public [ in, modulus, signature, in_len_padded_bytes ] } = EmailVerify(448, 121, 17);