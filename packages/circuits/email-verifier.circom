pragma circom 2.1.6;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";
include "@zk-email/zk-regex-circom/circuits/common/body_hash_regex.circom";
include "./lib/base64.circom";
include "./lib/rsa.circom";
include "./lib/sha.circom";
include "./utils/array.circom";
include "./utils/regex.circom";
include "./utils/hash.circom";
include "./utils/bytes.circom";
include "./helpers/remove-soft-line-breaks.circom";


/// @title EmailVerifier
/// @notice Circuit to verify email signature as per DKIM standard.
/// @notice Verifies the signature is valid for the given header and pubkey, and the hash of the body matches the hash in the header.
/// @notice This cicuit only verifies signature as per `rsa-sha256` algorithm.
/// @param maxHeadersLength Maximum length for the email header.
/// @param maxBodyLength Maximum length for the email body.
/// @param n Number of bits per chunk the RSA key is split into. Recommended to be 121.
/// @param k Number of chunks the RSA key is split into. Recommended to be 17.
/// @param ignoreBodyHashCheck Set 1 to skip body hash check in case data to prove/extract is only in the headers.
/// @param enableHeaderMasking Set 1 to turn on header masking.
/// @param enableBodyMasking Set 1 to turn on body masking.
/// @param removeSoftLineBreaks Set 1 to remove soft line breaks from the email body.
/// @input emailHeader[maxHeadersLength] Email headers that are signed (ones in `DKIM-Signature` header) as ASCII int[], padded as per SHA-256 block size.
/// @input emailHeaderLength Length of the email header including the SHA-256 padding.
/// @input pubkey[k] RSA public key split into k chunks of n bits each.
/// @input signature[k] RSA signature split into k chunks of n bits each.
/// @input emailBody[maxBodyLength] Email body after the precomputed SHA as ASCII int[], padded as per SHA-256 block size.
/// @input emailBodyLength Length of the email body including the SHA-256 padding.
/// @input bodyHashIndex Index of the body hash `bh` in the emailHeader.
/// @input precomputedSHA[32] Precomputed SHA-256 hash of the email body till the bodyHashIndex.
/// @input decodedEmailBodyIn[maxBodyLength] Decoded email body without soft line breaks.
/// @input mask[maxBodyLength] Mask for the email body.
/// @output pubkeyHash Poseidon hash of the pubkey - Poseidon(n/2)(n/2 chunks of pubkey with k*2 bits per chunk).
/// @output decodedEmailBodyOut[maxBodyLength] Decoded email body with soft line breaks removed.
/// @output maskedHeader[maxHeadersLength] Masked email header.
/// @output maskedBody[maxBodyLength] Masked email body.
template EmailVerifier(maxHeadersLength, maxBodyLength, n, k, ignoreBodyHashCheck, enableHeaderMasking, enableBodyMasking, removeSoftLineBreaks) {
    assert(maxHeadersLength % 64 == 0);
    assert(maxBodyLength % 64 == 0);
    assert(n * k > 2048); // to support 2048 bit RSA
    assert(n < (255 \ 2)); // for multiplication to fit in the field (255 bits)


    signal input emailHeader[maxHeadersLength];
    signal input emailHeaderLength;
    signal input pubkey[k];
    signal input signature[k];

    signal output pubkeyHash;


    // Assert `emailHeaderLength` fits in `ceil(log2(maxHeadersLength))`
    component n2bHeaderLength = Num2Bits(log2Ceil(maxHeadersLength));
    n2bHeaderLength.in <== emailHeaderLength;


    // Assert `emailHeader` data after `emailHeaderLength` are zeros
    AssertZeroPadding(maxHeadersLength)(emailHeader, emailHeaderLength);
    

    // Calculate SHA256 hash of the `emailHeader` - 506,670 constraints
    signal output sha[256] <== Sha256Bytes(maxHeadersLength)(emailHeader, emailHeaderLength);


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
    component rsaVerifier = RSAVerifier65537(n, k);
    for (var i = 0; i < rsaMessageSize; i++) {
        rsaVerifier.message[i] <== rsaMessage[i].out;
    }
    for (var i = rsaMessageSize; i < k; i++) {
        rsaVerifier.message[i] <== 0;
    }
    rsaVerifier.modulus <== pubkey;
    rsaVerifier.signature <== signature;

    if (enableHeaderMasking == 1) {
        signal input headerMask[maxHeadersLength];
        signal output maskedHeader[maxHeadersLength];
        component byteMask = ByteMask(maxHeadersLength);
        
        byteMask.in <== emailHeader;
        byteMask.mask <== headerMask;
        maskedHeader <== byteMask.out;
    }

    // Calculate the SHA256 hash of the body and verify it matches the hash in the header
    if (ignoreBodyHashCheck != 1) {
        signal input bodyHashIndex;
        signal input precomputedSHA[32];
        signal input emailBody[maxBodyLength];
        signal input emailBodyLength;


        // Assert `emailBodyLength` fits in `ceil(log2(maxBodyLength))`
        component n2bBodyLength = Num2Bits(log2Ceil(maxBodyLength));
        n2bBodyLength.in <== emailBodyLength;


        // Assert data after the body (`maxBodyLength - emailBody.length`) is all zeroes
        AssertZeroPadding(maxBodyLength)(emailBody, emailBodyLength);


        // Body hash regex - 617,597 constraints
        // Extract the body hash from the header (i.e. the part after bh= within the DKIM-signature section)
        signal (bhRegexMatch, bhReveal[maxHeadersLength]) <== BodyHashRegex(maxHeadersLength)(emailHeader);
        bhRegexMatch === 1;

        var shaB64Length = 44; // Length of SHA-256 hash when base64 encoded - ceil(32 / 3) * 4
        signal bhBase64[shaB64Length] <== SelectRegexReveal(maxHeadersLength, shaB64Length)(bhReveal, bodyHashIndex);
        signal headerBodyHash[32] <== Base64Decode(32)(bhBase64);

        // Compute SHA256 of email body : 760,142 constraints (for maxBodyLength = 1536)
        // We are using a technique to save constraints by precomputing the SHA hash of the body till the area we want to extract
        // It doesn't have an impact on security since a user must have known the pre-image of a signed message to be able to fake it
        signal computedBodyHash[256] <== Sha256BytesPartial(maxBodyLength)(emailBody, emailBodyLength, precomputedSHA);

        // Ensure the bodyHash from the header matches the calculated body hash
        component computedBodyHashInts[32];
        for (var i = 0; i < 32; i++) {
            computedBodyHashInts[i] = Bits2Num(8);
            for (var j = 0; j < 8; j++) {
                computedBodyHashInts[i].in[7 - j] <== computedBodyHash[i * 8 + j];
            }
            computedBodyHashInts[i].out === headerBodyHash[i];
        }

        if (removeSoftLineBreaks == 1) {
            signal input decodedEmailBodyIn[maxBodyLength];
            component qpEncodingChecker = RemoveSoftLineBreaks(maxBodyLength);

            qpEncodingChecker.encoded <== emailBody;
            qpEncodingChecker.decoded <== decodedEmailBodyIn;

            qpEncodingChecker.isValid === 1;
        }

        if (enableBodyMasking == 1) {
            signal input bodyMask[maxBodyLength];
            signal output maskedBody[maxBodyLength];
            component byteMask = ByteMask(maxBodyLength);
            
            byteMask.in <== emailBody;
            byteMask.mask <== bodyMask;
            maskedBody <== byteMask.out;
        }
    }

    // Calculate the Poseidon hash of DKIM public key as output
    // This can be used to verify (by verifier/contract) the pubkey used in the proof without needing the full key
    // Since PoseidonLarge concatenates nearby values its important to use same n/k (recommended 121*17) to produce uniform hashes
    // https://zkrepl.dev/?gist=43ce7dce2466c63812f6efec5b13aa73 - This can be used to calculate the pubkey hash separately
    pubkeyHash <== PoseidonLarge(n, k)(pubkey);
}
