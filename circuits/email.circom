pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha.circom";
include "./rsa.circom";
include "./dkim_header_regex.circom";
include "./body_hash_regex.circom";
include "./twitter_reset_regex.circom";
include "./base64.circom";

// Here, n and k are the biginteger parameters for RSA
// This is because the number is chunked into n chunks of k bits each
// Max header bytes shouldn't need to be changed much per email,
// but the max mody bytes may need to be changed to be larger if the email has a lot of i.e. HTML formatting
template EmailVerify(max_header_bytes, max_body_bytes, n, k) {
    assert(max_header_bytes % 64 == 0);
    assert(max_body_bytes % 64 == 0);
    assert(n * k > 2048); // constraints for 2048 bit RSA
    assert(k < 255 / 2); // we want a multiplication to fit into a circom signal

    var max_packed_bytes = (max_header_bytes - 1) \ 7 + 1; // ceil(max_num_bytes / 7)
    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    // Next 3 signals are for decreasing SHA constraints for parsing out information from the in-body text
    // The precomputed_sha value is the Merkle-Damgard state of our SHA hash uptil our first regex match
    // This allows us to save a ton of SHA constraints by only hashing the relevant part of the body
    // It doesn't have an impact on security since a user must have known the pre-image of a signed message to be able to fake it
    signal input precomputed_sha[32];
    // The lower two body signals are only the part we care about, a significant prefix of the body has been pre-hashed into precomputed_sha.
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

    // SHA HEADER: 506,670 constraints
    // This calculates the SHA256 hash of the header, which is the "base_msg" that is RSA signed.
    // The header signs the fields in the "h=Date:From:To:Subject:MIME-Version:Content-Type:Message-ID;"
    // section of the "DKIM-Signature:"" line, along with the body hash.
    // Note that nothing above the "DKIM-Signature:" line is signed.
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
    // The fields that this signature actually signs are defined as the body and the values in the header
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
    // This extracts the from and the to emails, and the precise regex format can be viewed in the README
    component dkim_header_regex = DKIMHeaderRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        dkim_header_regex.msg[i] <== in_padded[i];
    }
    dkim_header_regex.out === 2;
    for (var i = 0; i < max_header_bytes; i++) {
        reveal[i] <== dkim_header_regex.reveal[i+1];
    }
    log(dkim_header_regex.out);

    // BODY HASH REGEX: 617,597 constraints
    // This extracts the body hash from the header (i.e. the part after bh= within the DKIM-signature section)
    // which is used to verify the body text matches this signed hash + the signature verifies this hash is legit
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
    // This verifies that the hash of the body, when calculated from the precomputed part forwards,
    // actually matches the hash in the header
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

    // TWITTER REGEX: 328,044 constraints
    // This computes the regex states on each character in the email body. For new emails, this is the
    // section that you want to swap out via using the zk-regex library.

    component twitter_regex = TwitterResetRegex(max_body_bytes);
    for (var i = 0; i < max_body_bytes; i++) {
        twitter_regex.msg[i] <== in_body_padded[i];
    }
    // This ensures we found a match at least once
    component found_twitter = IsZero();
    found_twitter.in <== twitter_regex.out;
    found_twitter.out === 0;
    log(twitter_regex.out);
    // We isolate where the username begins: twitter_eq there is 1, everywhere else is 0
    component twitter_eq[max_body_bytes];
    for (var i = 0; i < max_body_bytes; i++) {
        twitter_eq[i] = IsEqual();
        twitter_eq[i].in[0] <== i;
        twitter_eq[i].in[1] <== twitter_username_idx;
    }
    for (var j = 0; j < max_twitter_len; j++) {
        // This vector is 0 everywhere except at one value
        // [x][x] is the starting character of the twitter username
        reveal_twitter[j][j] <== twitter_eq[j].out * twitter_regex.reveal[j];
        for (var i = j + 1; i < max_body_bytes; i++) {
            // This shifts the username back to the start of the string. For example,
            // [0][k0] = y, where k0 >= twitter_username_idx + 0
            // [1][k1] = u, where k1 >= twitter_username_idx + 1
            // [2][k2] = s, where k2 >= twitter_username_idx + 2
            // [3][k3] = h, where k3 >= twitter_username_idx + 3
            // [4][k4] = _, where k4 >= twitter_username_idx + 4
            // [5][k5] = g, where k5 >= twitter_username_idx + 5
            reveal_twitter[j][i] <== reveal_twitter[j][i - 1] + twitter_eq[i-j].out * twitter_regex.reveal[i];
        }
    }

    // PACKING: 16,800 constraints (Total: 3,115,057)
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
