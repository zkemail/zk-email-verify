pragma circom 2.1.5;

include "../node_modules/circomlib/circuits/bitify.circom";
include "./helpers/sha.circom";
include "./helpers/rsa.circom";
include "./helpers/base64.circom";
include "./helpers/extract.circom";

include "./regexes/from_regex.circom";
include "./regexes/tofrom_domain_regex.circom";
include "./regexes/body_hash_regex.circom";
include "./regexes/to_regex.circom";
include "./regexes/subject_regex.circom";
include "./regexes/coinbase_kyc_regex.circom";

// Here, n and k are the biginteger parameters for RSA
// This is because the number is chunked into k pack_size of n bits each
// Max header bytes shouldn't need to be changed much per email,
// but the max mody bytes may need to be changed to be larger if the email has a lot of i.e. HTML formatting
// TODO: split into header and body
template CoinbaseEmailVerify(max_header_bytes, n, k) {
    assert(max_header_bytes % 64 == 0);
    // assert(n * k > 2048); // constraints for 2048 bit RSA
    assert(n * k > 1024); // costraints for 1024 bit RSA
    assert(n < (255 \ 2)); // we want a multiplication to fit into a circom signal

    signal input in_padded[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature[k];
    signal input in_len_padded_bytes; // length of in email data including the padding, which will inform the sha256 block length

    signal input email_to_idx;
    signal output to_email[max_header_bytes]; // to email address of email

    // Identity commitment variables
    // (note we don't need to constrain the +1 due to https://geometry.xyz/notebook/groth16-malleability)
    signal input address;

    // Base 64 body hash variables
    var LEN_SHA_B64 = 44;     // ceil(32/3) * 4, should be automatically calculated.
    signal input body_hash_idx;
    signal output body_hash_reveal[LEN_SHA_B64];

    // SHA HEADER: 506,670 constraints
    // This calculates the SHA256 hash of the header, which is the "base_msg" that is RSA signed.
    // The header signs the fields in the "h=Date:From:To:Subject:MIME-Version:Content-Type:Message-ID;"
    // section of the "DKIM-Signature:"" line, along with the body hash.
    // Note that nothing above the "DKIM-Signature:" line is signed.
    component sha = Sha256Bytes(max_header_bytes);
    sha.in_padded <== in_padded;
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
    rsa.modulus <== modulus;
    rsa.signature <== signature;

    // TO HEADER REGEX: X constraints
    // This extracts the to email, and the precise regex format can be viewed in the README
    // We cannot use to: field at all due to Hotmail
    signal to_regex_out, to_regex_reveal[max_header_bytes];
    (to_regex_out, to_regex_reveal) <== ToRegex(max_header_bytes)(in_padded);
    to_regex_out === 1;
    to_email <== VarShiftLeft(max_header_bytes, max_header_bytes)(to_regex_reveal, email_to_idx); // can probably change output length
    // for (var i = 0; i < max_header_bytes; i++) {
    //     log(to_email[i]);
    // }

    // BODY HASH REGEX: 617,597 constraints
    // This extracts the body hash from the header (i.e. the part after bh= within the DKIM-signature section)
    // which is used to verify the body text matches this signed hash + the signature verifies this hash is legit
    signal bh_regex_out, bh_reveal[max_header_bytes];
    (bh_regex_out, bh_reveal) <== BodyHashRegex(max_header_bytes)(in_padded);
    bh_regex_out === 1;
    body_hash_reveal <== VarShiftLeft(max_header_bytes, LEN_SHA_B64)(bh_reveal, body_hash_idx);

    // COINBASE REGEX: X constraints
    // Checks Coinbase regex matches KYC confirmation email
    component coinbase_regex = CoinbaseKYCRegex(max_header_bytes);
    coinbase_regex.msg <== in_padded;
    // This ensures we found a match at least once
    component found_coinbase = IsZero();
    found_coinbase.in <== coinbase_regex.out;
    found_coinbase.out === 0;
    // log(coinbase_regex.out);
}

// In circom, all output signals of the main component are public (and cannot be made private), the input signals of the main component are private if not stated otherwise using the keyword public as above. The rest of signals are all private and cannot be made public.
// This makes modulus and reveal_twitter_packed public. hash(signature) can optionally be made public, but is not recommended since it allows the mailserver to trace who the offender is.

// Args:
// * max_header_bytes = 1024 is the max number of bytes in the header
// * n = 121 is the number of bits in each chunk of the modulus (RSA parameter)
// * k = 17 is the number of chunks in the modulus (RSA parameter)
// component main { public [ modulus, address ] } = CoinbaseEmailVerify(1024, 121, 17);