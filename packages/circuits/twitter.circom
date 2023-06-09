pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "./helpers/sha.circom";
include "./helpers/rsa.circom";
include "./helpers/base64.circom";
include "./helpers/extract.circom";

include "./regexes/from_regex.circom";
include "./regexes/tofrom_domain_regex.circom";
include "./regexes/body_hash_regex.circom";
include "./regexes/twitter_reset_regex.circom";

// Here, n and k are the biginteger parameters for RSA
// This is because the number is chunked into k pack_size of n bits each
// Max header bytes shouldn't need to be changed much per email,
// but the max mody bytes may need to be changed to be larger if the email has a lot of i.e. HTML formatting
// TODO: split into header and body
template EmailVerify(max_header_bytes, max_body_bytes, n, k, pack_size, expose_from, expose_to) {
    assert(max_header_bytes % 64 == 0);
    assert(max_body_bytes % 64 == 0);
    assert(expose_from < 2); // 1 if we should expose the from, 0 if we should not
    assert(expose_to == 0); // 1 if we should expose the to, 0 if we should not: due to hotmail restrictions, we force-disable this
    assert(n * k > 2048); // constraints for 2048 bit RSA
    assert(n < (255 \ 2)); // we want a multiplication to fit into a circom signal

    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + DNSSEC proof. split up into k parts of n bits each.
    signal input signature[k]; // rsa signature. split up into k parts of n bits each.
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    // Identity commitment variables
    // (note we don't need to constrain the + 1 due to https://geometry.xyz/notebook/groth16-malleability)
    signal input address;

    // Base 64 body hash variables
    var LEN_SHA_B64 = 44;     // ceil(32 / 3) * 4, due to base64 encoding.
    signal input body_hash_idx;

    // SHA HEADER: 506,670 constraints
    // This calculates the SHA256 hash of the header, which is the "base_msg" that is RSA signed.
    // The header signs the fields in the "h=Date:From:To:Subject:MIME-Version:Content-Type:Message-ID;"
    // section of the "DKIM-Signature:"" line, along with the body hash.
    // Note that nothing above the "DKIM-Signature:" line is signed.
    signal sha[256] <== Sha256Bytes(max_header_bytes)(in_padded, in_len_padded_bytes);
    var msg_len = (256 + n) \ n;

    component base_msg[msg_len];
    for (var i = 0; i < msg_len; i++) {
        base_msg[i] = Bits2Num(n);
    }
    for (var i = 0; i < 256; i++) {
        base_msg[i \ n].in[i % n] <== sha[255 - i];
    }
    for (var i = 256; i < n * msg_len; i++) {
        base_msg[i \ n].in[i % n] <== 0;
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
    rsa.modulus <== modulus;
    rsa.signature <== signature;

    // FROM HEADER REGEX: 736,553 constraints
    // This extracts the from email, and the precise regex format can be viewed in the README
    if(expose_from){
        var max_email_from_len = 30;
        var max_email_from_packed_bytes = count_packed(max_email_from_len, pack_size);
        assert(max_email_from_packed_bytes < max_header_bytes);

        signal input email_from_idx;
        signal output reveal_email_from_packed[max_email_from_packed_bytes]; // packed into 7-bytes. TODO: make this rotate to take up even less space

        signal (from_regex_out, from_regex_reveal[max_header_bytes]) <== FromRegex(max_header_bytes)(in_padded);
        log(from_regex_out);
        from_regex_out === 1;
        reveal_email_from_packed <== ShiftAndPack(max_header_bytes, max_email_from_len, pack_size)(from_regex_reveal, email_from_idx);
    }


    // TO HEADER REGEX: 736,553 constraints
    // This extracts the to email, and the precise regex format can be viewed in the README
    // We cannot use to: field at all due to Hotmail
    // if(expose_to){
    //     var max_email_to_len = 30;
    //     var max_email_to_packed_bytes = count_packed(max_email_to_len, pack_size);
    //     assert(max_email_to_packed_bytes < max_header_bytes);

    //     signal input email_to_idx;
    //     signal output reveal_email_to_packed[max_email_to_packed_bytes]; // packed into 7-bytes. TODO: make this rotate to take up even less space

    //     signal to_regex_out, to_regex_reveal[max_header_bytes];
    //     (to_regex_out, to_regex_reveal) <== ToRegex(max_header_bytes)(in_padded);
    //     to_regex_out === 1;
    //     reveal_email_to_packed <== ShiftAndPack(max_header_bytes, max_email_to_len, pack_size)(to_regex_reveal, email_to_idx);
    // }

    // BODY HASH REGEX: 617,597 constraints
    // This extracts the body hash from the header (i.e. the part after bh= within the DKIM-signature section)
    // which is used to verify the body text matches this signed hash + the signature verifies this hash is legit
    signal (bh_regex_out, bh_reveal[max_header_bytes]) <== BodyHashRegex(max_header_bytes)(in_padded);
    bh_regex_out === 1;
    signal shifted_bh_out[LEN_SHA_B64] <== VarShiftLeft(max_header_bytes, LEN_SHA_B64)(bh_reveal, body_hash_idx);
    // log(body_hash_regex.out);


    // SHA BODY: 760,142 constraints

    // Precomputed sha vars for big body hashing
    // Next 3 signals are for decreasing SHA constraints for parsing out information from the in-body text
    // The precomputed_sha value is the Merkle-Damgard state of our SHA hash uptil our first regex match
    // This allows us to save a ton of SHA constraints by only hashing the relevant part of the body
    // It doesn't have an impact on security since a user must have known the pre-image of a signed message to be able to fake it
    // The lower two body signals describe the suffix of the body that we care about
    // The part before these signals, a significant prefix of the body, has been pre-hashed into precomputed_sha.
    signal input precomputed_sha[32];
    signal input in_body_padded[max_body_bytes];
    signal input in_body_len_padded_bytes;

    // This verifies that the hash of the body, when calculated from the precomputed part forwards,
    // actually matches the hash in the header
    signal sha_body_out[256] <== Sha256BytesPartial(max_body_bytes)(in_body_padded, in_body_len_padded_bytes, precomputed_sha);
    signal sha_b64_out[32] <== Base64Decode(32)(shifted_bh_out);

    // When we convert the manually hashed email sha_body into bytes, it matches the
    // base64 decoding of the final hash state that the signature signs (sha_b64)
    component sha_body_bytes[32];
    for (var i = 0; i < 32; i++) {
        sha_body_bytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            sha_body_bytes[i].in[7 - j] <== sha_body_out[i * 8 + j];
        }
        sha_body_bytes[i].out === sha_b64_out[i];
    }

    // Body reveal vars
    var max_twitter_len = 21;
    var max_twitter_packed_bytes = count_packed(max_twitter_len, pack_size); // ceil(max_num_bytes / 7)
    signal input twitter_username_idx;
    signal output reveal_twitter_packed[max_twitter_packed_bytes];

    // TWITTER REGEX: 328,044 constraints
    // This computes the regex states on each character in the email body. For new emails, this is the
    // section that you want to swap out via using the zk-regex library.
    signal (twitter_regex_out, twitter_regex_reveal[max_body_bytes]) <== TwitterResetRegex(max_body_bytes)(in_body_padded);
    // This ensures we found a match at least once (i.e. match count is not zero)
    signal is_found_twitter <== IsZero()(twitter_regex_out);
    is_found_twitter === 0;

    // PACKING: 16,800 constraints (Total: 3,115,057)
    reveal_twitter_packed <== ShiftAndPack(max_body_bytes, max_twitter_len, pack_size)(twitter_regex_reveal, twitter_username_idx);
}

// In circom, all output signals of the main component are public (and cannot be made private), the input signals of the main component are private if not stated otherwise using the keyword public as above. The rest of signals are all private and cannot be made public.
// This makes modulus and reveal_twitter_packed public. hash(signature) can optionally be made public, but is not recommended since it allows the mailserver to trace who the offender is.

// Args:
// * max_header_bytes = 1024 is the max number of bytes in the header
// * max_body_bytes = 1536 is the max number of bytes in the body after precomputed slice
// * n = 121 is the number of bits in each chunk of the modulus (RSA parameter)
// * k = 17 is the number of chunks in the modulus (RSA parameter)
// * pack_size = 7 is the number of bytes that can fit into a 255ish bit signal (can increase later)
// * expose_from = 0 is whether to expose the from email address
// * expose_to = 0 is whether to expose the to email (not recommended)
component main { public [ modulus, address ] } = EmailVerify(1024, 1536, 121, 17, 7, 0, 0);
