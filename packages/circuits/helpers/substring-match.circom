pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";
include "../utils/hash.circom";

/// @title SubstringMatch
/// @notice This template verifies if a given substring exists within a larger string at a specified index
/// @dev Uses a Random Linear Combination (RLC) approach to efficiently compare substrings
/// @param maxLength The maximum length of the input string
/// @param maxSubstringLength The maximum length of the substring to be matched
/// @input in An array of ASCII values representing the input string
/// @input startIndex The starting index of the substring in the input string
/// @input revealedString An array of ASCII values representing the substring to be matched
/// @input r A random value used for the RLC calculation
/// @output isValid A signal that is 1 if the substring matches at the given index, 0 otherwise
template SubstringMatch(maxLength, maxSubstringLength) {
    signal input in[maxLength];
    signal input revealedString[maxSubstringLength];
    signal input startIndex;

    // Derive r from the inputs
    signal r;
    component rHasher;
    rHasher = PoseidonModular(maxLength + maxSubstringLength + 1);
    rHasher.in[0] <== startIndex;
    for (var i = 0; i < maxSubstringLength; i++) {
        rHasher.in[i + 1] <== revealedString[i];
    }
    for (var i = 0; i < maxLength; i++) {
        rHasher.in[i + maxSubstringLength + 1] <== in[i];
    }
    r <== rHasher.out;

    // Check if each character in the revealed string is non-zero
    signal isNonZero[maxSubstringLength];
    signal isZero[maxSubstringLength];
    for (var i = 0; i < maxSubstringLength; i++) {
        isZero[i] <== IsEqual()([revealedString[i], 0]);
        isNonZero[i] <== 1 - isZero[i];
    }

    // Calculate the running length of non-zero characters
    signal runningLength[maxSubstringLength];
    runningLength[0] <== isNonZero[0];
    for (var i = 1; i < maxSubstringLength; i++) {
        runningLength[i] <== runningLength[i-1] + isNonZero[i];
    }

    // The total revealed length is the last value in the runningLength array
    signal revealedLength;
    revealedLength <== runningLength[maxSubstringLength - 1];

    // Calculate the end index by adding the revealed length to the start index
    signal endIndex;
    endIndex <== startIndex + revealedLength;

    // Create startMask
    signal startMask[maxLength];
    signal startMaskEq[maxLength];
    startMaskEq[0] <== IsEqual()([0, startIndex]);
    startMask[0] <== startMaskEq[0];
    for (var i = 1; i < maxLength; i++) {
        startMaskEq[i] <== IsEqual()([i, startIndex]);
        startMask[i] <== startMask[i-1] + startMaskEq[i];
    }

    // Create endMask
    signal endMask[maxLength];
    signal endMaskEq[maxLength];
    endMaskEq[0] <== IsEqual()([0, endIndex]);
    endMask[0] <== 1 - endMaskEq[0]; // This will always be 1; 
    for (var i = 1; i < maxLength; i++) {
        endMaskEq[i] <== IsEqual()([i, endIndex]);
        endMask[i] <== endMask[i-1] * (1 - endMaskEq[i]);
    }

    // Combine masks
    signal mask[maxLength];
    for (var i = 0; i < maxLength; i++) {
        mask[i] <== startMask[i] * endMask[i];
    }

    // Apply the mask to the input
    signal maskedIn[maxLength];
    for (var i = 0; i < maxLength; i++) {
        maskedIn[i] <== in[i] * mask[i];
    }

    // Calculate powers of r for maskedIn
    signal rMaskedIn[maxLength];
    component muxMaskedIn[maxLength];

    // Handle the first element separately
    muxMaskedIn[0] = Mux1();
    muxMaskedIn[0].c[0] <== r;
    muxMaskedIn[0].c[1] <== 1;
    muxMaskedIn[0].s <== 1 - mask[0];
    rMaskedIn[0] <== muxMaskedIn[0].out;

    // Handle the rest of the elements
    for (var i = 1; i < maxLength; i++) {
        muxMaskedIn[i] = Mux1();
        muxMaskedIn[i].c[0] <== rMaskedIn[i - 1] * r;
        muxMaskedIn[i].c[1] <== rMaskedIn[i - 1];
        muxMaskedIn[i].s <== 1 - mask[i];
        rMaskedIn[i] <== muxMaskedIn[i].out;
    }

    // Calculate powers of r for revealedString
    signal rRevealed[maxSubstringLength];
    rRevealed[0] <== r;
    for (var i = 1; i < maxSubstringLength; i++) {
        rRevealed[i] <== rRevealed[i - 1] * r;
    }

    // Calculate RLC for maskedIn
    signal sumMaskedIn[maxLength];
    sumMaskedIn[0] <== rMaskedIn[0] * maskedIn[0];
    for (var i = 1; i < maxLength; i++) {
        sumMaskedIn[i] <== sumMaskedIn[i - 1] + rMaskedIn[i] * maskedIn[i];
    }

    // Calculate RLC for revealedString
    signal sumRevealed[maxSubstringLength];
    sumRevealed[0] <== rRevealed[0] * revealedString[0];
    for (var i = 1; i < maxSubstringLength; i++) {
        sumRevealed[i] <== sumRevealed[i - 1] + rRevealed[i] * revealedString[i];
    }

    // Check if RLC for maskedIn is equal to adjusted RLC for revealedString
    signal output isValid;
    isValid <== IsEqual()([sumMaskedIn[maxLength - 1], sumRevealed[maxSubstringLength - 1]]);
}