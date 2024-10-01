pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "../utils/array.circom";

/// @title RevealSubstring
/// @notice This circuit reveals a substring from an input array and verifies its uniqueness
/// @dev Ensures the revealed substring occurs exactly once in the input
/// @dev Note: This circuit assumes that the consuming circuit handles input validation
///      (e.g., checking that substringStartIndex and substringLength are within valid ranges)
/// @param maxLength The maximum length of the input array
/// @param maxSubstringLength The maximum length of the substring to be revealed
template RevealSubstring(maxLength, maxSubstringLength, shouldCheckUniqueness) {
    assert(maxSubstringLength < maxLength);

    signal input in[maxLength];
    signal input substringStartIndex;
    signal input substringLength;

    signal output substring[maxSubstringLength];

    // Substring start index should be less than maxLength
    signal isSubstringStartIndexValid <== LessThan(log2Ceil(maxLength))([substringStartIndex, maxLength]);
    isSubstringStartIndexValid === 1;

    // Substring length should be less than maxSubstringLength + 1
    signal isSubstringLengthValid <== LessThan(log2Ceil(maxSubstringLength + 1))([substringLength, maxSubstringLength + 1]);
    isSubstringLengthValid === 1;

    // substring index + substring length should be less than maxLength + 1
    signal sum <== substringStartIndex + substringLength;
    signal isSumValid <== LessThan(log2Ceil(maxLength + 1))([sum, maxLength + 1]);
    isSumValid === 1;

    // Extract the substring
    component selectSubArray = SelectSubArray(maxLength, maxSubstringLength);
    selectSubArray.in <== in;
    selectSubArray.startIndex <== substringStartIndex;
    selectSubArray.length <== substringLength;

    if (shouldCheckUniqueness) {
        // Check if the substring occurs exactly once in the input
        component countSubstringOccurrences = CountSubstringOccurrences(maxLength, maxSubstringLength);
        countSubstringOccurrences.in <== in;
        countSubstringOccurrences.substring <== selectSubArray.out;
        countSubstringOccurrences.count === 1;
    }

    substring <== selectSubArray.out;
}