pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";
include "./bytes.circom";

/// @title ExtractRegexReveal
/// @dev Extracts reveal part from a regex match
/// @param maxArrayLen Maximum length of the input array
/// @param maxRevealLen Maximum length of the reveal part
/// @input in Input array
/// @input startIndex Index of the start of the reveal part
/// @output out Revealed data array
template ExtractRegexReveal(maxArrayLen, maxRevealLen) {
    var bitLength = log2Ceil(maxArrayLen);

    signal input in[maxArrayLen];
    signal input startIndex;

    signal output out[maxRevealLen];
    
    signal isStartIndex[maxArrayLen];
    signal isZero[maxArrayLen];
    signal isPreviousZero[maxArrayLen];
    signal isAboveMaxRevealLen[maxArrayLen];

    isPreviousZero[0] <== 1;
    for(var i = 0; i < maxArrayLen; i++) {
        isStartIndex[i] <== IsEqual()([i, startIndex]);
        isZero[i] <== IsZero()(in[i]);
        if(i > 0) {
            isPreviousZero[i] <== IsZero()(in[i - 1]);
        }
        isAboveMaxRevealLen[i] <== GreaterThan(bitLength)([i, startIndex + maxRevealLen - 1]);

        // Assert startIndex is not zero
        isStartIndex[i] * isZero[i] === 0;

        // Assert value before startIndex is zero
        // ZK-Regex circuit contstrains that every byte before the reveal part is zero
        // This is assuming matched data doesn't contain 0 (null) byte
        isStartIndex[i] * (1 - isPreviousZero[i]) === 0;

        // Assert all values after startIndex + maxRevealLen are zero (for extra safety)
        isAboveMaxRevealLen[i] * (1 - isZero[i]) === 0;
    }

    out <== ArrayShiftLeft(maxArrayLen, maxRevealLen)(in, startIndex);
}


/// @title PackRegexReveal
/// @dev Packs reveal data from a regex match into int[]
/// @param maxArrayLen Maximum length of the input array
/// @param maxRevealLen Maximum length of the reveal part
/// @input in Input array
/// @input startIndex Index of the start of the reveal part
/// @output out Packed int array
template PackRegexReveal(maxArrayLen, maxRevealLen) {
    var chunkSize = computeIntChunkLength(maxRevealLen);

    signal input in[maxArrayLen];
    signal input startIndex;
    
    signal output out[chunkSize];

    component extractor = ExtractRegexReveal(maxArrayLen, maxRevealLen);
    extractor.in <== in;
    extractor.startIndex <== startIndex;

    component packer = BytesToInts(maxRevealLen);
    packer.in <== extractor.out;
    out <== packer.out;
}
