pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha.circom";
include "./rsa.circom";
include "./dkim_header_regex.circom";
include "./extract_to_email_regex.circom";
include "./body_hash_regex.circom";
include "./airbnb_kyc_regex.circom";
include "./base64.circom";

// Here, n and k are the biginteger parameters for RSA
// This is because the number is chunked into n chunks of k bits each
// Max header bytes shouldn't need to be changed much per email,
// but the max mody bytes may need to be changed to be larger if the email has a lot of i.e. HTML formatting
template AirbnbEmailVerify(max_header_bytes, n, k) {
    assert(max_header_bytes % 64 == 0);
    // assert(max_body_bytes % 64 == 0);
    // assert(n * k > 2048); // constraints for 2048 bit RSA
    assert(n * k > 1024); // costraints for 1024 bit RSA
    assert(k < 255 \ 2); // we want a multiplication to fit into a circom signal

    var max_packed_bytes = (max_header_bytes - 1) \ 7 + 1; // ceil(max_num_bytes / 7)
    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    // signal reveal[max_header_bytes]; // bytes to reveal

    signal output to_email[max_header_bytes]; // to email address of email

    signal input address;
    signal input address_plus_one;

    signal input email_to_idx;

    var LEN_SHA_B64 = 44;     // ceil(32/3) * 4, should be automatically calculated.
    var max_bh_packed_bytes = 7; // ceil(44/7)
    signal input body_hash_idx;
    signal body_hash[LEN_SHA_B64][max_header_bytes];

    signal output body_hash_reveal[LEN_SHA_B64];

    // signal output reveal_packed[max_bh_packed_bytes]; // packed into 7-bytes. TODO: make this rotate to take up even less space

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
    // for (var i = 0; i < max_header_bytes; i++) {
    //     reveal[i] <== dkim_header_regex.reveal[i+1];
    // }
    // log(dkim_header_regex.out);

    // BODY HASH REGEX: 617,597 constraints
    // This extracts the body hash from the header (i.e. the part after bh= within the DKIM-signature section)
    // which is used to verify the body text matches this signed hash + the signature verifies this hash is legit
    component body_hash_regex = BodyHashRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        body_hash_regex.msg[i] <== in_padded[i];
    }
    body_hash_regex.out === 1;
    // log(body_hash_regex.out);
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
    for (var i = 0; i < 44; i++) {
        body_hash_reveal[i] <== body_hash[i][max_header_bytes - 1];
    }

    // AIRBNB REGEX
    // Checks Airbnb regex matches KYC confirmation email
    component airbnb_regex = AirbnbKYCRegex(max_header_bytes);
    for (var i = 0; i < max_header_bytes; i++) {
        airbnb_regex.msg[i] <== in_padded[i];
    }
    // This ensures we found a match at least once
    component found_airbnb = IsZero();
    found_airbnb.in <== airbnb_regex.out;
    found_airbnb.out === 0;
    // log(airbnb_regex.out);

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

// component main { public [ modulus, address ] } = AirbnbEmailVerify(1024, 121, 9);