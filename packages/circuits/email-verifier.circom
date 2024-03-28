pragma circom 2.1.5;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";
include "@zk-email/zk-regex-circom/circuits/common/body_hash_regex.circom";
include "./lib/base64.circom";
include "./helpers/sha.circom";
include "./helpers/rsa.circom";
include "./helpers/extract.circom";
include "./helpers/utils.circom";


/// @title EmailVerifier
/// @notice Circuit to verify email signature as per DKIM standard.
/// @notice Verifies the signature is valid for the given header and pubkey, and the hash of the body matches the hash in the header.
/// @dev This cicuit only verifies signature as per `rsa-sha256` algorithm.
/// @param maxHeaderLength Maximum length for the email header.
/// @param maxBodyLength Maximum length for the email body.
/// @param n Number of bits per chunk the RSA key is split into. Recommended to be 121.
/// @param k Number of chunks the RSA key is split into. Recommended to be 17.
/// @param ignoreBodyHashCheck Set 1 to skip body hash check in case data to prove/extract is only in the headers.
/// @input emailHeader Email headers that are signed (ones in `DKIM-Signature` header) as ASCII int[], padded as per SHA-256 block size.
/// @input emailHeaderLength Length of the email header including the SHA-256 padding.
/// @input pubkey RSA public key split into k chunks of n bits each.
/// @input signature RSA signature split into k chunks of n bits each.
/// @input emailBody Email body after the precomputed SHA as ASCII int[], padded as per SHA-256 block size.
/// @input emailBodyLength Length of the email body including the SHA-256 padding.
/// @input bodyHashIndex Index of the body hash `bh` in the emailHeader.
/// @input precomputedSHA Precomputed SHA-256 hash of the email body till the bodyHashIndex.
/// @output pubkeyHash Poseidon hash of the pubkey - Poseidon(n/2)(n/2 chunks of pubkey with k*2 bits per chunk).
template EmailVerifier(maxHeaderLength, maxBodyLength, n, k, ignoreBodyHashCheck) {
    assert(maxHeaderLength % 64 == 0);
    assert(maxBodyLength % 64 == 0);
    assert(n * k > 2048); // to support 2048 bit RSA
    assert(n < (255 \ 2)); // for multiplication to fit in the field (255 bits)


    signal input emailHeader[maxHeaderLength];
    signal input emailHeaderLength;
    signal input pubkey[k];
    signal input signature[k];

    signal output pubkeyHash;


    // Assert emailHeader only contain data till given emailHeaderLength - i.e any bytes are 0
    // This is to prevent attack by adding fake headers in the remaining (unsigned) area and use that for extraction
    AssertZeroes(maxHeaderLength)(emailHeader, emailHeaderLength + 1);
    

    // Calculate SHA256 hash of the `emailHeader` - 506,670 constraints
    signal output sha[256] <== Sha256Bytes(maxHeaderLength)(emailHeader, emailHeaderLength);


    // Pack SHA output bytes to int[] for RSA input message
    var rsaMessageSize = (256 + n) \ n;
    component rsaMessage[rsaMessageSize];
    for (var i = 0; i < rsaMessageSize; i++) {
        rsaMessage[i] = Bits2Num(n);
    }
    for (var i = 0; i < 256; i++) {
        rsaMessage[i \ n].in[i % n] <== sha[255 - i];
    }
    for (var i = 256; i < n * rsaMessageSize; i++) {
        rsaMessage[i \ n].in[i % n] <== 0;
    }

    // Verify RSA signature - 149,251 constraints
    component rsaVerifier = RSAVerify65537(n, k);
    for (var i = 0; i < rsaMessageSize; i++) {
        rsaVerifier.base_message[i] <== rsaMessage[i].out;
    }
    for (var i = rsaMessageSize; i < k; i++) {
        rsaVerifier.base_message[i] <== 0;
    }
    rsaVerifier.modulus <== pubkey;
    rsaVerifier.signature <== signature;


    // Calculate the SHA256 hash of the body and verify it matches the hash in the header
    if (ignoreBodyHashCheck != 1) {
        signal input bodyHashIndex;
        signal input precomputedSHA[32];
        signal input emailBody[maxBodyLength];
        signal input emailBodyLength;

        // Assert data after the body (maxBodyLength - emailBody.length) is all zeroes
        AssertZeroes(maxBodyLength)(emailBody, emailBodyLength + 1);

        // Body hash regex - 617,597 constraints
        // Extract the body hash from the header (i.e. the part after bh= within the DKIM-signature section)
        signal (bhRegexMatch, bhReveal[maxHeaderLength]) <== BodyHashRegex(maxHeaderLength)(emailHeader);
        bhRegexMatch === 1;

        var shaB64Length = 44; // Length of SHA-256 hash when base64 encoded - ceil(32 / 3) * 4
        signal bhBase64[shaB64Length] <== VarShiftMaskedStr(maxHeaderLength, shaB64Length)(bhReveal, bodyHashIndex);
        signal headerBodyHash[32] <== Base64Decode(32)(bhBase64);


        // Compute SHA256 of email body : 760,142 constraints
        // We are using a technique to save constraints by precomputing the SHA hash of the body till the area we want to extract
        // It doesn't have an impact on security since a user must have known the pre-image of a signed message to be able to fake it
        signal calculatedBodyHash[256] <== Sha256BytesPartial(maxBodyLength)(emailBody, emailBodyLength, precomputedSHA);

        // Ensure the bodyHash from the header matches the calculated body hash
        component calculatedBodyHashNum[32];
        for (var i = 0; i < 32; i++) {
            calculatedBodyHashNum[i] = Bits2Num(8);
            for (var j = 0; j < 8; j++) {
                calculatedBodyHashNum[i].in[7 - j] <== calculatedBodyHash[i * 8 + j];
            }
            calculatedBodyHashNum[i].out === headerBodyHash[i];
        }
    }


    // Calculate the Poseidon hash of DKIM public key and produce as an output
    // This can be used to check (by verifier/contract) the pubkey used in the proof without needing the full key
    // We are converting pubkey (modulus) in to k/2 chunks of n*2 bits each
    // This is because Posiedon circuit only support array of 16 elements. We are assuming k > 16 and k/2 is <= 16
    var chunkSize = k >> 1;
    if(k % 2 == 1) {
        chunkSize += 1;
    }
    signal pubkeyChunks[chunkSize];
    for(var i = 0; i < chunkSize; i++) {
        if(i==chunkSize-1 && chunkSize % 2 == 1) {
            pubkeyChunks[i] <== pubkey[2*i];
        } else {
            pubkeyChunks[i] <== pubkey[2*i] + (1<<n) * pubkey[2*i+1];
        }
    }
    pubkeyHash <== Poseidon(chunkSize)(pubkeyChunks);
}
