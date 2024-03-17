
pragma circom 2.1.5;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/helpers/extract.circom";
include "@zk-email/circuits/utils/constants.circom";
include "@zk-email/circuits/utils/email_addr_pointer.circom";
include "@zk-email/circuits/utils/email_addr_commit.circom";
include "@zk-email/circuits/utils/hash_sign.circom";
include "@zk-email/circuits/utils/email_nullifier.circom";
include "./utils/bytes2ints.circom";
include "./utils/digit2int.circom";
include "@zk-email/zk-regex-circom/circuits/common/from_addr_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/email_addr_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/email_domain_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/subject_all_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/timestamp_regex.circom";

// Verify email from user (sender) and extract subject, timestmap, recipient email (commitment), etc.
// * n - the number of bits in each chunk of the RSA public key (modulust)
// * k - the number of chunks in the RSA public key (n * k > 2048)
// * max_header_bytes - max number of bytes in the email header
// * max_subject_bytes - max number of bytes in the email subject
template EmailSender(n, k, max_header_bytes, max_subject_bytes) {
    signal input in_padded[max_header_bytes]; // email data (only header part)
    signal input pubkey[k]; // RSA pubkey (modulus), k parts of n bits each.
    signal input signature[k]; // RSA signature, k parts of n bits each.
    signal input in_padded_len; // length of in email data including the padding
    signal input sender_email_idx; // Index of the from email address (= sender email address) in the email header
    signal input subject_idx; // Index of the subject in the header
    signal input domain_idx; // Index of the domain name in the from email address
    signal input timestamp_idx; // Index of the timestamp in the header

    var email_max_bytes = email_max_bytes_const();
    var email_max_len = compute_ints_size(email_max_bytes);
    
    var subject_field_len = compute_ints_size(max_subject_bytes);
    
    var domain_len = domain_len_const();
    var domain_filed_len = compute_ints_size(domain_len);

    var k2_chunked_size = k >> 1;
    if(k % 2 == 1) {
        k2_chunked_size += 1;
    }
    var timestamp_len = timestamp_len_const();

    signal output masked_subject_str[subject_field_len];
    signal output domain_name[domain_filed_len];
    signal output hfrom[email_max_len];
    signal output hsubject[subject_field_len];
    signal output pubkey_hash;
    signal output email_nullifier;
    signal output sender_pointer;
    signal output timestamp;
    
    // Verify Email Signature
    component email_verifier = EmailVerifier(max_header_bytes, 0, n, k, 1);
    email_verifier.in_padded <== in_padded;
    email_verifier.pubkey <== pubkey;
    email_verifier.signature <== signature;
    email_verifier.in_len_padded_bytes <== in_padded_len;
    signal header_hash[256] <== email_verifier.sha;
    pubkey_hash <== email_verifier.pubkey_hash;

    // FROM HEADER REGEX
    signal from_regex_out, from_regex_reveal[max_header_bytes];
    (from_regex_out, from_regex_reveal) <== FromAddrRegex(max_header_bytes)(in_padded);
    from_regex_out === 1;
    signal sender_email_addr[email_max_bytes];
    sender_email_addr <== VarShiftMaskedStr(max_header_bytes, email_max_bytes)(from_regex_reveal, sender_email_idx);
    hfrom <== Bytes2Ints(email_max_bytes)(sender_email_addr);

    // SUBJECT HEADER REGEX
    signal subject_regex_out, subject_regex_reveal[max_header_bytes];
    (subject_regex_out, subject_regex_reveal) <== SubjectAllRegex(max_header_bytes)(in_padded);
    subject_regex_out === 1;
    signal subject_all[max_subject_bytes];
    subject_all <== VarShiftMaskedStr(max_header_bytes, max_subject_bytes)(subject_regex_reveal, subject_idx);
    hsubject <== Bytes2Ints(max_subject_bytes)(subject_all);

    // DOMAIN NAME HEADER REGEX
    signal domain_regex_out, domain_regex_reveal[email_max_bytes];
    (domain_regex_out, domain_regex_reveal) <== EmailDomainRegex(email_max_bytes)(sender_email_addr);
    domain_regex_out === 1;
    signal domain_name_bytes[domain_len];
    domain_name_bytes <== VarShiftMaskedStr(email_max_bytes, domain_len)(domain_regex_reveal, domain_idx);
    domain_name <== Bytes2Ints(domain_len)(domain_name_bytes);
    

    // Email address pointer 
    /*
    var num_email_addr_ints = compute_ints_size(email_max_bytes);
    signal sender_email_addr_ints[num_email_addr_ints] <== Bytes2Ints(email_max_bytes)(sender_email_addr);
    sender_pointer <== EmailAddrPointer(num_email_addr_ints)(sender_relayer_rand, sender_email_addr_ints);
*/
   
    // Email address commitment
    /*signal cm_rand_input[k2_chunked_size+1];
    for(var i=0; i<k2_chunked_size;i++){
        cm_rand_input[i] <== sign_ints[i];
    }
    cm_rand_input[k2_chunked_size] <== 1;
    signal cm_rand <== Poseidon(k2_chunked_size+1)(cm_rand_input);
    signal recipient_email_addr_ints[num_email_addr_ints] <== Bytes2Ints(email_max_bytes)(recipient_email_addr);
    signal recipient_email_addr_commit_raw;
    recipient_email_addr_commit_raw <== EmailAddrCommit(num_email_addr_ints)(cm_rand, recipient_email_addr_ints);
    recipient_email_addr_commit <== has_email_recipient * recipient_email_addr_commit_raw;
*/

    // Timestamp regex + convert to decimal format
    signal timestamp_regex_out, timestamp_regex_reveal[max_header_bytes];
    (timestamp_regex_out, timestamp_regex_reveal) <== TimestampRegex(max_header_bytes)(in_padded);
    timestamp_regex_out === 1;
    signal timestamp_str[timestamp_len];
    timestamp_str <== VarShiftMaskedStr(max_header_bytes, timestamp_len)(timestamp_regex_reveal, timestamp_idx);
    timestamp <== Digit2Int(timestamp_len)(timestamp_str);
}

// Args:
// * n = 121 is the number of bits in each chunk of the modulus (RSA parameter)
// * k = 17 is the number of chunks in the modulus (RSA parameter)
// * max_header_bytes = 1024 is the max number of bytes in the header
// * max_subject_bytes = 512 is the max number of bytes in the body after precomputed slice
component main  = EmailSender(121, 17, 1024, 512);
