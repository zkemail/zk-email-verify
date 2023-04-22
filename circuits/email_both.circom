pragma circom 2.1.5;

include "./email_airbnb.circom";
include "./email_coinbase.circom";

// Current "to email" extractor only works on certain formats of emails. In particular, if there's a name after the "To:" and before the email, the extractor will extract part of the extra text.
// The current setup works for Airbnb and Coinbase confirmation emails, although that may change in the future.

// Here, n and k are the biginteger parameters for RSA
// This is because the number is chunked into n chunks of k bits each
// Max header bytes shouldn't need to be changed much per email,
// but the max mody bytes may need to be changed to be larger if the email has a lot of i.e. HTML formatting
template KYCVerify(max_header_bytes, n, k) {
    assert(max_header_bytes % 64 == 0);
    // assert(n * k > 2048); // constraints for 2048 bit RSA, e.g., Twitter
    assert(n * k > 1024); // constraints for 1024 bit RSA, e.g., Airbnb and Coinbase
    assert(n < 255 \ 2); // we want a multiplication to fit into a circom signal

    var max_packed_bytes = (max_header_bytes - 1) \ 7 + 1; // ceil(max_header_bytes / 7)
    signal body_hash_concat[128]; // body hash output from each email has length 44, round up to lowest multiple of 64

    // AIRBNB INPUT SIGNALS
    signal input in_padded_airbnb[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus_airbnb[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature_airbnb[k];
    signal input in_len_padded_bytes_airbnb; // length of in email data including the padding, which will inform the sha256 block length
    signal input body_hash_idx_airbnb;
    signal input email_to_idx_airbnb;
    signal input address_airbnb;

    // COINBASE INPUT SIGNALS
    signal input in_padded_coinbase[max_header_bytes]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input modulus_coinbase[k]; // rsa pubkey, verified with smart contract + optional oracle
    signal input signature_coinbase[k];
    signal input in_len_padded_bytes_coinbase; // length of in email data including the padding, which will inform the sha256 block length
    signal input body_hash_idx_coinbase;
    signal input email_to_idx_coinbase;
    signal input address_coinbase;

    // OUTPUT SIGNALS
    // Outputs the hash of the two body hashes, which serves as the nullifier
    // Currently doesn't output from/to emails for domain check but should probably add that later
    var pack_size = 7;
    var output_len = (32 - 1) \ pack_size + 1;
    signal output nullifier[output_len];

    component airbnb_verify = AirbnbEmailVerify(max_header_bytes, n, k);
    component coinbase_verify = CoinbaseEmailVerify(max_header_bytes, n, k);
    
    // Airbnb email inputs
    airbnb_verify.in_padded <== in_padded_airbnb;
    airbnb_verify.modulus <== modulus_airbnb;
    airbnb_verify.signature <== signature_airbnb;
    airbnb_verify.in_len_padded_bytes <== in_len_padded_bytes_airbnb;
    airbnb_verify.body_hash_idx <== body_hash_idx_airbnb;
    airbnb_verify.email_to_idx <== email_to_idx_airbnb;
    airbnb_verify.address <== address_airbnb;

    // Coinbase email inputs
    coinbase_verify.in_padded <== in_padded_coinbase;
    coinbase_verify.modulus <== modulus_coinbase;
    coinbase_verify.signature <== signature_coinbase;
    coinbase_verify.in_len_padded_bytes <== in_len_padded_bytes_coinbase;
    coinbase_verify.body_hash_idx <== body_hash_idx_coinbase;
    coinbase_verify.email_to_idx <== email_to_idx_coinbase;
    coinbase_verify.address <== address_coinbase;

    // TO EMAILS MATCH
    // Check that the to emails match
    signal to_email_airbnb[max_header_bytes] <== airbnb_verify.to_email;
    signal to_email_coinbase[max_header_bytes] <== coinbase_verify.to_email;
    for (var i = 0; i < max_header_bytes; i++) {
        to_email_airbnb[i] === to_email_coinbase[i];
    }

    // PACKED OUTPUT
    // Nullifier output for solidity verifier
    for (var i = 0; i < 44; i++) {
        body_hash_concat[i] <== airbnb_verify.body_hash_reveal[i];
        body_hash_concat[i + 44] <== coinbase_verify.body_hash_reveal[i];
    }
    for (var i = 88; i < 128; i++) {
        body_hash_concat[i] <== 0;
    }
    component sha = Sha256Bytes(128);
    sha.in_padded <== body_hash_concat;
    sha.in_len_padded_bytes <== 128;

    // Convert SHA output into 256/8 = 32 bytes
    component sha_out[32];
    for (var i = 0; i < 32; i++) {
        sha_out[i] = Bits2Num(8);
    }
    for (var i = 0; i < 256; i++) {
        sha_out[i\8].in[i%8] <== sha.out[255 - i];
    }

    component packer = PackBytes(32, output_len, pack_size);
    for (var i = 0; i < 32; i++) {
        packer.in[i] <== sha_out[i].out;
    }
    nullifier <== packer.out;
}

// In circom, all output signals of the main component are public (and cannot be made private), the input signals of the main component are private if not stated otherwise using the keyword public as above. The rest of signals are all private and cannot be made public.
// This makes modulus and reveal_twitter_packed public. hash(signature) can optionally be made public, but is not recommended since it allows the mailserver to trace who the offender is.
// TODO: change public signals in smart contract to match new public signals
component main { public [ modulus_airbnb, modulus_coinbase, address_airbnb, address_coinbase ] } = KYCVerify(1024, 121, 17);
