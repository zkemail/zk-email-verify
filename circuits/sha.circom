pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha256.circom";
include "./rsa.circom";

template Sha256Bytes(num_bytes) {
    signal input in[num_bytes];
    signal input in_len;
    signal output out[256];

    var num_bits = num_bytes * 8;
    component sha = Sha256(num_bits);

    component bytes[num_bytes];
    for (var i = 0; i < num_bytes; i++) {
        bytes[i] = Num2Bits(8);
        bytes[i].in <== in[i];
        for (var j = 0; j < 8; j++) {
            sha.in[i*8+j] <== bytes[i].out[7-j];
        }
    }
    sha.in_len <== in_len;

    for (var i = 0; i < 256; i++) {
        out[i] <== sha.out[i];
    }
}

template EmailVerify(num_bytes, n, k) {
    signal input in[num_bytes]; // prehashed email data, potentially padded with lots of 0s at end
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];
    signal input in_len; // length of in email data, corresponding to sha256 block length

    component sha = Sha256Bytes(num_bytes);
    for (var i = 0; i < num_bytes; i++) {
        sha.in[i] <== in[i];
    }
    sha.in_len <== in_len;

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

component main { public [ in, modulus, signature ] } = EmailVerify(350, 121, 17);