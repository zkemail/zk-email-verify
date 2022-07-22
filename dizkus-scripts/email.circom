pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha.circom";
include "./rsa.circom";
include "./regex.circom";

template EmailVerify(max_num_bytes, n, k) {
    // max_num_bytes must be a multiple of 64
    signal input in_padded[max_num_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    signal output reveal[max_num_bytes];

    component sha = Sha256Bytes(max_num_bytes);
    for (var i = 0; i < max_num_bytes; i++) {
        sha.in_padded[i] <== in_padded[i];
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

    component regex = Regex(max_num_bytes);
    for (var i = 0; i < max_num_bytes; i++) {
        regex.msg[i] <== in_padded[i];
    }
    regex.out === 2;
    for (var i = 0; i < max_num_bytes; i++) {
        reveal[i] <== regex.reveal[i+1];
    }

    log(regex.out);
    for (var i = 0; i < max_num_bytes; i++) {
        log(reveal[i]);
    }
}

// In circom, all output signals of the main component are public (and cannot be made private), the input signals of the main component are private if not stated otherwise using the keyword public as above. The rest of signals are all private and cannot be made public.
// This makes modulus and reveal_from public. Signature can optionally be made public, but is not recommended since it allows the mailserver to trace who the offender is.

component main { public [ modulus ] } = EmailVerify(1024, 121, 17);
