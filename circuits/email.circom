pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha.circom";
include "./rsa.circom";
include "./dkim_header_regex.circom";
include "./body_hash_regex.circom";
include "./github_regex.circom";
include "./base64.circom";

template EmailVerify(max_header_bytes, max_body_bytes, n, k) {
    // max_num_bytes must be a multiple of 64
    var max_packed_bytes = (max_header_bytes - 1) \ 7 + 1; // ceil(max_num_bytes / 7)
    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    // Next 3 signals are only needed if we are doing in-body verification
    signal input precomputed_sha[32];
    // This body is only the part we care about, a significant prefix of the body has been pre-hashed into precomputed_sha.
    signal input in_body_padded[max_body_bytes];
    signal input in_body_len_padded_bytes;

    signal reveal[max_header_bytes]; // bytes to reveal
    signal reveal_packed[max_packed_bytes]; // packed into 7-bytes. TODO: make this rotate to take up even less space

    var max_github_len = 35;
    var max_github_packed_bytes = (max_github_len - 1) \ 7 + 1; // ceil(max_num_bytes / 7)

    signal input github_username_idx;
    signal reveal_github[max_github_len][max_body_bytes];
    signal output reveal_github_packed[max_github_packed_bytes];

    signal input address;
    signal input address_plus_one;

    var LEN_SHA_B64 = 44;     // ceil(32/3) * 4, should be automatically calculated.
    signal input body_hash_idx;
    signal body_hash[LEN_SHA_B64][max_header_bytes];

    // SHA HEADER: 506,670 constraints
    component sha = Sha256Bytes(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
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

    // VERIFY RSA SIGNATURE: 149,251 constraints
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

    // DKIM HEADER REGEX: 736,553 constraints
    component dkim_header_regex = DKIMHeaderRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        dkim_header_regex.msg[i] <== in_padded[i];
    }
    log("dkim_header_match:",dkim_header_regex.out);
    dkim_header_regex.out === 1;
    for (var i = 0; i < max_header_bytes; i++) {
        reveal[i] <== dkim_header_regex.reveal[i+1];
    }
    log(dkim_header_regex.out);

    // BODY HASH REGEX: 617,597 constraints
    component body_hash_regex = BodyHashRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        body_hash_regex.msg[i] <== in_padded[i];
    }
    body_hash_regex.out === 1;
    log(body_hash_regex.out);
    component body_hash_eq[max_header_bytes];
    for (var i = 0; i < max_header_bytes; i++) {
        body_hash_eq[i] = IsEqual();
        body_hash_eq[i].in[0] <== i;
        body_hash_eq[i].in[1] <== body_hash_idx;
    }
    for (var j = 0; j < 44; j++) {
        body_hash[j][j] <== body_hash_eq[j].out * body_hash_regex.reveal[j];
        for (var i = j + 1; i < max_header_bytes; i++) {
            body_hash[j][i] <== body_hash[j][i - 1] + body_hash_eq[i-j].out * body_hash_regex.reveal[i];
        }
    }

    // SHA BODY: 760,142 constraints
    component sha_body = Sha256BytesPartial(max_body_bytes);
    for (var i = 0; i < max_body_bytes; i++) {
        sha_body.in_padded[i] <== in_body_padded[i];
    }
    for (var i = 0; i < 32; i++) {
        sha_body.pre_hash[i] <== precomputed_sha[i];
    }
    sha_body.in_len_padded_bytes <== in_body_len_padded_bytes;
    component sha_b64 = Base64Decode(32);
    for (var i = 0; i < 44; i++) {
        sha_b64.in[i] <== body_hash[i][max_header_bytes - 1];
    }
    component sha_body_bytes[32];
    for (var i = 0; i < 32; i++) {
        sha_body_bytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            sha_body_bytes[i].in[7-j] <== sha_body.out[i*8+j];
        }
        sha_body_bytes[i].out === sha_b64.out[i];
    }

    // Github REGEX: 328,044 constraints
    // This computes the regex states on each character
    component github_regex = GithubRegex(max_body_bytes,max_github_len,0);
    for (var i = 0; i < max_body_bytes; i++) {
        github_regex.msg[i] <== in_body_padded[i];
    }
    github_regex.match_idx<==0;
    // This ensures we found a match at least once
    component found_github = IsZero();
    found_github.in <== github_regex.entire_count;
    found_github.out === 0;
    log(github_regex.entire_count);
    // We isolate where the username begins: twitter_eq there is 1, everywhere else is 0
    // component github_eq[max_body_bytes];
    // for (var i = 0; i < max_body_bytes; i++) {
    //     github_eq[i] = IsEqual();
    //     github_eq[i].in[0] <== i;
    //     github_eq[i].in[1] <== github_username_idx;
    // }
    // for (var j = 0; j < max_github_len; j++) {
    //     // This vector is 0 everywhere except at one value
    //     // [x][x] is the starting character of the twitter username
    //     reveal_github[j][j] <== github_eq[j].out * github_regex.reveal[j];
    //     for (var i = j + 1; i < max_body_bytes; i++) {
    //         // This shifts the username back to the start of the string. For example,
    //         // [0][k0] = y, where k0 >= twitter_username_idx + 0
    //         // [1][k1] = u, where k1 >= twitter_username_idx + 1
    //         // [2][k2] = s, where k2 >= twitter_username_idx + 2
    //         // [3][k3] = h, where k3 >= twitter_username_idx + 3
    //         // [4][k4] = _, where k4 >= twitter_username_idx + 4
    //         // [5][k5] = g, where k5 >= twitter_username_idx + 5
    //         reveal_github[j][i] <== reveal_github[j][i - 1] + github_eq[i-j].out * github_regex.reveal[i];
    //     }
    // }
    for (var j =0; j<max_github_len;j++){
        for (var i =j; i< max_body_bytes;i++){
            reveal_github[j][i] <== github_regex.reveal_shifted_intermediate[j][i];
        }
    }
    // PACKING: 16,800 constraints (Total: 3,115,057)
    // Pack output for solidity verifier to be < 24kb size limit
    // chunks = 7 is the number of bytes that can fit into a 255ish bit signal
    var chunks = 7;
    component packed_github_output[max_github_packed_bytes];
    for (var i = 0; i < max_github_packed_bytes; i++) {
        packed_github_output[i] = Bytes2Packed(chunks);
        for (var j = 0; j < chunks; j++) {
            var reveal_idx = i * chunks + j;
            if (reveal_idx < max_body_bytes) {
                packed_github_output[i].in[j] <== reveal_github[i * chunks + j][max_body_bytes - 1];
            } else {
                packed_github_output[i].in[j] <== 0;
            }
        }
        reveal_github_packed[i] <== packed_github_output[i].out;
        log(reveal_github_packed[i]);
    }

    component packed_output[max_packed_bytes];
    for (var i = 0; i < max_packed_bytes; i++) {
        packed_output[i] = Bytes2Packed(chunks);
        for (var j = 0; j < chunks; j++) {
            var reveal_idx = i * chunks + j;
            if (reveal_idx < max_header_bytes) {
                packed_output[i].in[j] <== reveal[i * chunks + j];
            } else {
                packed_output[i].in[j] <== 0;
            }
        }
        reveal_packed[i] <== packed_output[i].out;
    }
}

// In circom, all output signals of the main component are public (and cannot be made private), the input signals of the main component are private if not stated otherwise using the keyword public as above. The rest of signals are all private and cannot be made public.
// This makes modulus and reveal_twitter_packed public. hash(signature) can optionally be made public, but is not recommended since it allows the mailserver to trace who the offender is.

component main { public [ modulus, address ] } = EmailVerify(2048, 1536, 121, 17);
