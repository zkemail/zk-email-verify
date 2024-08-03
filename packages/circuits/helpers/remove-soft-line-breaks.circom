pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";
include "../utils/hash.circom";

/// @title RemoveSoftLineBreaks
/// @notice This template verifies the removal of soft line breaks from an encoded input string
/// @dev Soft line breaks are defined as "=\r\n" sequences in the encoded input
/// @param maxLength The maximum length of the input strings
/// @input encoded An array of ASCII values representing the input string with potential soft line breaks
/// @input decoded An array of ASCII values representing the expected output after removing soft line breaks
/// @output isValid A signal that is 1 if the decoded input correctly represents the encoded input with soft line breaks removed, 0 otherwise
template RemoveSoftLineBreaks(maxLength) {
    signal input encoded[maxLength];
    signal input decoded[maxLength];
    signal output isValid;

    // Helper signals
    signal r;
    signal processed[maxLength];
    signal isEquals[maxLength];
    signal isCr[maxLength];
    signal isLf[maxLength];
    signal tempSoftBreak[maxLength - 2];
    signal isSoftBreak[maxLength];
    signal shouldZero[maxLength];
    signal rEnc[maxLength];
    signal sumEnc[maxLength];
    signal rDec[maxLength];
    signal sumDec[maxLength];

    // Helper components
    component muxEnc[maxLength];

    // Deriving r from Poseidon hash
    component rHasher = PoseidonModular(2 * maxLength);
    for (var i = 0; i < maxLength; i++) {
        rHasher.in[i] <== encoded[i];
    }
    for (var i = 0; i < maxLength; i++) {
        rHasher.in[maxLength + i] <== decoded[i];
    }
    r <== rHasher.out;

    // Check for '=' (61 in ASCII)
    for (var i = 0; i < maxLength; i++) {
        isEquals[i] <== IsEqual()([encoded[i], 61]);
    }

    // Check for '\r' (13 in ASCII)
    for (var i = 0; i < maxLength - 1; i++) {
        isCr[i] <== IsEqual()([encoded[i + 1], 13]);
    }
    isCr[maxLength - 1] <== 0;

    // Check for '\n' (10 in ASCII)
    for (var i = 0; i < maxLength - 2; i++) {
        isLf[i] <== IsEqual()([encoded[i + 2], 10]);
    }
    isLf[maxLength - 2] <== 0;
    isLf[maxLength - 1] <== 0;

    // Identify soft line breaks
    for (var i = 0; i < maxLength - 2; i++) {
        tempSoftBreak[i] <== isEquals[i] * isCr[i];
        isSoftBreak[i] <== tempSoftBreak[i] * isLf[i];
    }
    // Handle the last two characters
    isSoftBreak[maxLength - 2] <== 0;
    isSoftBreak[maxLength - 1] <== 0;

    // Determine which characters should be zeroed
    for (var i = 0; i < maxLength; i++) {
        if (i == 0) {
            shouldZero[i] <== isSoftBreak[i];
        } else if (i == 1) {
            shouldZero[i] <== isSoftBreak[i] + isSoftBreak[i-1];
        } else if (i == maxLength - 1) {
            shouldZero[i] <== isSoftBreak[i-1] + isSoftBreak[i-2];
        } else {
            shouldZero[i] <== isSoftBreak[i] + isSoftBreak[i-1] + isSoftBreak[i-2];
        }
    }

    // Process the encoded input
    for (var i = 0; i < maxLength; i++) {
        processed[i] <== (1 - shouldZero[i]) * encoded[i];
    }

    // Calculate powers of r for encoded
    muxEnc[0] = Mux1();
    muxEnc[0].c[0] <== r;
    muxEnc[0].c[1] <== 1;
    muxEnc[0].s <== shouldZero[0];
    rEnc[0] <== muxEnc[0].out;

    for (var i = 1; i < maxLength; i++) {
        muxEnc[i] = Mux1();
        muxEnc[i].c[0] <== rEnc[i - 1] * r;
        muxEnc[i].c[1] <== rEnc[i - 1];
        muxEnc[i].s <== shouldZero[i];
        rEnc[i] <== muxEnc[i].out;
    }

    // Calculate powers of r for decoded
    rDec[0] <== r;
    for (var i = 1; i < maxLength; i++) {
        rDec[i] <== rDec[i - 1] * r;
    }

    // Calculate rlc for processed
    sumEnc[0] <== rEnc[0] * processed[0];
    for (var i = 1; i < maxLength; i++) {
        sumEnc[i] <== sumEnc[i - 1] + rEnc[i] * processed[i];
    }

    // Calculate rlc for decoded
    sumDec[0] <== rDec[0] * decoded[0];
    for (var i = 1; i < maxLength; i++) {
        sumDec[i] <== sumDec[i - 1] + rDec[i] * decoded[i];
    }

    // Check if rlc for decoded is equal to rlc for encoded
    isValid <== IsEqual()([sumEnc[maxLength - 1], sumDec[maxLength - 1]]);
}