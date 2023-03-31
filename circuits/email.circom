pragma circom 2.1.5;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha.circom";
include "./rsa.circom";
include "./dkim_header_regex.circom";
include "./body_hash_regex.circom";
include "./twitter_reset_regex.circom";
include "./base64.circom";
include "./extract.circom";

// Here, n and k are the biginteger parameters for RSA
// This is because the number is chunked into k pack_size of n bits each
// Max header bytes shouldn't need to be changed much per email,
// but the max mody bytes may need to be changed to be larger if the email has a lot of i.e. HTML formatting
template EmailVerify(max_header_bytes, max_body_bytes, n, k, pack_size) {
    assert(max_header_bytes % 64 == 0);
    assert(max_body_bytes % 64 == 0);
    assert(n * k > 2048); // constraints for 2048 bit RSA
    assert(n < (255 \ 2)); // we want a multiplication to fit into a circom signal

    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + DNSSEC proof. split up into k parts of n bits each.
    signal input signature[k]; // rsa signature. split up into k parts of n bits each.
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    // Precomputed sha vars
    // Next 3 signals are for decreasing SHA constraints for parsing out information from the in-body text
    // The precomputed_sha value is the Merkle-Damgard state of our SHA hash uptil our first regex match
    // This allows us to save a ton of SHA constraints by only hashing the relevant part of the body
    // It doesn't have an impact on security since a user must have known the pre-image of a signed message to be able to fake it
    // The lower two body signals describe the suffix of the body that we care about
    // The part before these signals, a significant prefix of the body, has been pre-hashed into precomputed_sha.
    signal input precomputed_sha[32];
    signal input in_body_padded[max_body_bytes];
    signal input in_body_len_padded_bytes;

    // Header reveal vars
    var max_email_from_len = 30;
    var max_email_from_packed_bytes = count_packed(max_email_from_len, pack_size);
    signal input email_from_idx;
    signal output reveal_email_from_packed[max_email_from_packed_bytes]; // packed into 7-bytes. TODO: make this rotate to take up even less space
    assert(max_email_from_packed_bytes < max_header_bytes);

    // Body reveal vars
    var max_twitter_len = 21;
    var max_twitter_packed_bytes = count_packed(max_twitter_len, pack_size); // ceil(max_num_bytes / 7)
    signal input twitter_username_idx;
    signal output reveal_twitter_packed[max_twitter_packed_bytes];

    // Identity commitment variables
    // (note we don't need to constrain the +1 due to https://geometry.xyz/notebook/groth16-malleability)
    signal input address;
    signal input address_plus_one;

    // Base 64 body hash variables
    var LEN_SHA_B64 = 44;     // ceil(32/3) * 4, due to base64 encoding.
    signal input body_hash_idx;

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
    component from_revealer = ShiftAndPack(max_header_bytes, max_email_from_len, pack_size);
    for (var i = 0; i < max_header_bytes; i++) {
        // TODO: WARNING!!!!!!! CHECK FOR OFF BY ONE ERROR
        from_revealer.in[i] <== dkim_header_regex.reveal[i+1];
    }
    from_revealer.shift <== email_from_idx;
    for (var i = 0; i < max_email_from_packed_bytes; i++) {
        reveal_email_from_packed[i] <== from_revealer.out[i];
    }
    log(dkim_header_regex.reveal[0]);
    log(dkim_header_regex.out);

    // BODY HASH REGEX: 617,597 constraints
    // This extracts the body hash from the header (i.e. the part after bh= within the DKIM-signature section)
    // which is used to verify the body text matches this signed hash + the signature verifies this hash is legit
    component body_hash_regex = BodyHashRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        body_hash_regex.msg[i] <== in_padded[i];
    }
    body_hash_regex.out === 1;
    component bh_packer = VarShiftLeft(max_header_bytes, LEN_SHA_B64);
    for (var i = 0; i < max_header_bytes; i++) {
        // TODO: Verify off by 1 error
        bh_packer.in[i] <== body_hash_regex.reveal[i];
    }
    bh_packer.shift <== body_hash_idx;
    log(body_hash_regex.out);

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
    for (var i = 0; i < LEN_SHA_B64; i++) {
        sha_b64.in[i] <== bh_packer.out[i];
    }
    // When we convert the manually hashed email sha_body into bytes, it matches the
    // base64 decoding of the final hash state that the signature signs (sha_b64)
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

    // PACKING: 16,800 constraints (Total: 3,115,057)
    component twitter_revealer = ShiftAndPack(max_body_bytes, max_twitter_len, pack_size);
    for (var i = 0; i < max_body_bytes; i++) {
        // TODO: WARNING!!!!!!! CHECK FOR OFF BY ONE ERROR
        twitter_revealer.in[i] <== twitter_regex.reveal[i];
    }
    twitter_revealer.shift <== twitter_username_idx;
    for (var i = 0; i < max_twitter_packed_bytes; i++) {
        reveal_twitter_packed[i] <== twitter_revealer.out[i];
    }
}

// In circom, all output signals of the main component are public (and cannot be made private), the input signals of the main component are private if not stated otherwise using the keyword public as above. The rest of signals are all private and cannot be made public.
// This makes modulus and reveal_twitter_packed public. hash(signature) can optionally be made public, but is not recommended since it allows the mailserver to trace who the offender is.

component main { public [ modulus, address ] } = EmailVerify(1024, 1536, 121, 17, 7);
// Args:
// * pack_size = 7 is the number of bytes that can fit into a 255ish bit signal (can increase later)
