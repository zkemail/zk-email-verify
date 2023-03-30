pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha.circom";
include "./rsa.circom";
include "./dkim_header_regex.circom";
include "./extract_to_email_regex.circom";
include "./body_hash_regex.circom";
include "./coinbase_kyc_regex.circom";
include "./base64.circom";

// Here, n and k are the biginteger parameters for RSA
// This is because the number is chunked into n chunks of k bits each
// Max header bytes shouldn't need to be changed much per email,
// but the max mody bytes may need to be changed to be larger if the email has a lot of i.e. HTML formatting
template CoinbaseEmailVerify(max_header_bytes, n, k) {
    assert(max_header_bytes % 64 == 0);
    // assert(max_body_bytes % 64 == 0);
    assert(n * k > 2048); // constraints for 2048 bit RSA
    assert(k < 255 \ 2); // we want a multiplication to fit into a circom signal

    var max_packed_bytes = (max_header_bytes - 1) \ 7 + 1; // ceil(max_num_bytes / 7)
    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    // Next 2 signals are for decreasing SHA constraints for parsing out information from the in-body text
    signal reveal[max_header_bytes]; // bytes to reveal
    signal output reveal_packed[max_packed_bytes]; // packed into 7-bytes. TODO: make this rotate to take up even less space

    signal output to_email[max_header_bytes]; // to email address of email

    signal input address;
    signal input address_plus_one;

    signal input email_to_idx;

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

    // COINBASE REGEX
    // Checks Coinbase regex matches KYC confirmation email
    component coinbase_regex = CoinbaseKYCRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        coinbase_regex.msg[i] <== in_padded[i];
    }
    // This ensures we found a match at least once
    component found_coinbase = IsZero();
    found_coinbase.in <== coinbase_regex.out;
    found_coinbase.out === 0;
    log(coinbase_regex.out);

    // PACKING: 16,800 constraints (Total: 3,115,057)
    // Pack output for solidity verifier to be < 24kb size limit
    // chunks = 7 is the number of bytes that can fit into a 255ish bit signal
    var chunks = 7;
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

    // EXTRACT TO EMAIL REGEX
    // This extracts the to email
    component extract_to_email_regex = ExtractToEmailRegex(max_header_bytes);
    extract_to_email_regex.email_to_idx <== email_to_idx;
    for (var i = 0; i < max_header_bytes; i++) {
        extract_to_email_regex.msg[i] <== in_padded[i];
    }
    extract_to_email_regex.out === 1;
    for (var i = 0; i < max_header_bytes; i++) {
        to_email[i] <== extract_to_email_regex.to_email[i+1];
    }
}

// component main { public [ modulus, address ] } = CoinbaseEmailVerify(1024, 121, 17);