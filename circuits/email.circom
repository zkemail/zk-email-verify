pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha.circom";
include "./rsa.circom";
include "./dkim_header_regex.circom";
include "./body_hash_regex.circom";
include "./twitter_reset_regex.circom";
include "./base64.circom";

// This circuit takes in an email body and header
// It extracts the body hash and DKIM signature from this info, proves correctness, and extracts the email address and twitter username from the email.
// The max arguments are the maximum number of bytes that can be passed in for the header and body.
// The n and k define bigInts for all of the RSA arithmetic: they are represented as k parts of n bits each.
// n < 127, and n * k > 2048 (or your RSA key size), otherwise the circuit will not handle bigInt arithmetic correctly.
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

    var max_twitter_len = 21;
    var max_twitter_packed_bytes = (max_twitter_len - 1) \ 7 + 1; // ceil(max_num_bytes / 7)

    signal input twitter_username_idx;
    signal reveal_twitter[max_twitter_len][max_body_bytes];
    signal output reveal_twitter_packed[max_twitter_packed_bytes];

    signal input address;
    signal input address_plus_one;

    var LEN_SHA_B64 = 44;     // ceil(32/3) * 4, should be automatically calculated.
    signal input body_hash_idx;
    signal body_hash[LEN_SHA_B64][max_header_bytes];

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

    // The header regex right now checks for both a from and a to,
    // To mask these out, check the old circuits
    // Regex runs on the raw string chars, not the base64-encoded string
    component dkim_header_regex = DKIMHeaderRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        dkim_header_regex.msg[i] <== in_padded[i];
    }

    // This verifies two matches for from/to, and outputs the masked header in .msg
    // (emails sent from hotmail won't work, they don't have a to field).
    dkim_header_regex.out === 2;

    // This reveal section extracts the relevant regex state into a mask array
    // For instance, reveal may look like 0000yush_g0000, where it's only non-zero at the characters to be revealed
    for (var i = 0; i < max_header_bytes; i++) {
        reveal[i] <== dkim_header_regex.reveal[i+1];
    }
    log(dkim_header_regex.out);

    // This isolates the hash of the body within the header via regex, and outputs the masked header in .msg
    component body_hash_regex = BodyHashRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        body_hash_regex.msg[i] <== in_padded[i];
    }

    // There should only be one body hash match
    body_hash_regex.out === 1;
    log(body_hash_regex.out);

    // Extracts the body hash index
    // body_hash_eq is a vector that is 1 at starting index, everywhere else is 0
    component body_hash_eq[max_header_bytes];
    for (var i = 0; i < max_header_bytes; i++) {
        body_hash_eq[i] = IsEqual();
        body_hash_eq[i].in[0] <== i;
        body_hash_eq[i].in[1] <== body_hash_idx;
    }

    // This part converts the regex-masked body into a 2d array from which we can extract just the username
    for (var j = 0; j < 44; j++) {
        body_hash[j][j] <== body_hash_eq[j].out * body_hash_regex.reveal[j];
        for (var i = j + 1; i < max_header_bytes; i++) {
            body_hash[j][i] <== body_hash[j][i - 1] + body_hash_eq[i-j].out * body_hash_regex.reveal[i];
        }
    }

    component sha_body = Sha256BytesPartial(max_body_bytes);
    for (var i = 0; i < max_body_bytes; i++) {
        sha_body.in_padded[i] <== in_body_padded[i];
    }
    for (var i = 0; i < 32; i++) {
        sha_body.pre_hash[i] <== precomputed_sha[i];
    }
    sha_body.in_len_padded_bytes <== in_body_len_padded_bytes;

    // Base64 decode just the body hash
    component sha_b64 = Base64Decode(32);
    for (var i = 0; i < 44; i++) {
        sha_b64.in[i] <== body_hash[i][max_header_bytes - 1];
    }

    // Convert bits to bytes to verify the byte-wise base64 decoding correctly
    component sha_body_bytes[32];
    for (var i = 0; i < 32; i++) {
        sha_body_bytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            sha_body_bytes[i].in[7-j] <== sha_body.out[i*8+j];
        }
        sha_body_bytes[i].out === sha_b64.out[i];
    }

    // This computes the regex states on each character
    component twitter_regex = TwitterResetRegex(max_body_bytes);
    for (var i = 0; i < max_body_bytes; i++) {
        twitter_regex.msg[i] <== in_body_padded[i];
    }

    // This ensures we found a match at least once
    component found_twitter = IsZero();
    found_twitter.in <== twitter_regex.out;
    found_twitter.out === 0;
    log(twitter_regex.out);

    // We isolate the index where the username begins
    // twitter_eq a vector that is 1 at the starting index, everywhere else is 0
    component twitter_eq[max_body_bytes];
    for (var i = 0; i < max_body_bytes; i++) {
        twitter_eq[i] = IsEqual();
        twitter_eq[i].in[0] <== i;
        twitter_eq[i].in[1] <== twitter_username_idx;
    }

    // This part converts the regex-masked body into a 2d array from which we can extract just the username
    // Without doing variable array indexes, which would require a more complex quinselector circuit
    for (var j = 0; j < max_twitter_len; j++) {
        // This vector is 0 everywhere except at one value
        // [x][x] is the starting character of the twitter username
        reveal_twitter[j][j] <== twitter_eq[j].out * twitter_regex.reveal[j];
        for (var i = j + 1; i < max_body_bytes; i++) {
            // This shifts the username back to the start of the string. For example, for username yush_g
            // [0][k0] = y, where k0 >= twitter_username_idx + 0
            // [1][k1] = u, where k1 >= twitter_username_idx + 1
            // [2][k2] = s, where k2 >= twitter_username_idx + 2
            // [3][k3] = h, where k3 >= twitter_username_idx + 3
            // [4][k4] = _, where k4 >= twitter_username_idx + 4
            // [5][k5] = g, where k5 >= twitter_username_idx + 5
            reveal_twitter[j][i] <== reveal_twitter[j][i - 1] + twitter_eq[i-j].out * twitter_regex.reveal[i];
        }
    }

    // Pack output for solidity verifier to be < 24kb size limit
    // chunks = 7 is the number of bytes that can fit into a 255ish bit signal
    var chunks = 7;
    component packed_twitter_output[max_twitter_packed_bytes];
    for (var i = 0; i < max_twitter_packed_bytes; i++) {
        packed_twitter_output[i] = Bytes2Packed(chunks);
        for (var j = 0; j < chunks; j++) {
            var reveal_idx = i * chunks + j;
            if (reveal_idx < max_body_bytes) {
                packed_twitter_output[i].in[j] <== reveal_twitter[i * chunks + j][max_body_bytes - 1];
            } else {
                packed_twitter_output[i].in[j] <== 0;
            }
        }
        reveal_twitter_packed[i] <== packed_twitter_output[i].out;
        log(reveal_twitter_packed[i]);
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

component main { public [ modulus, address ] } = EmailVerify(1024, 1536, 121, 17);
