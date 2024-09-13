pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "../utils/array.circom";

/// @title RevealSubstring
/// @notice This circuit reveals a substring from an input array and verifies its uniqueness
/// @dev Ensures the revealed substring occurs exactly once in the input
/// @param maxLength The maximum length of the input array
/// @param maxSubstringLength The maximum length of the substring to be revealed
template RevealSubstring(maxLength, maxSubstringLength) {
    assert(maxSubstringLength < maxLength);

    signal input in[maxLength];
    signal input substringStartIndex;
    signal input substringLength;

    signal output substring[maxSubstringLength];

    // substringStartIndex should be less than maxLength
    signal startIndexCheck;
    startIndexCheck <== LessThan(log2Ceil(maxLength))([substringStartIndex, maxLength]);
    startIndexCheck === 1;

    // substringLength should be less than maxSubstringLength
    signal lengthCheck;
    lengthCheck <== LessThan(log2Ceil(maxSubstringLength))([substringLength, maxSubstringLength + 1]);
    lengthCheck === 1;

    // substringStartIndex + substringLength should be less than maxLength
    signal startIndexPlusLengthCheck;
    startIndexPlusLengthCheck <== LessThan(log2Ceil(maxLength))([substringStartIndex + substringLength, maxLength + 1]);
    startIndexPlusLengthCheck === 1;

    // Extract the substring
    component selectSubArray = SelectSubArray(maxLength, maxSubstringLength);
    selectSubArray.in <== in;
    selectSubArray.startIndex <== substringStartIndex;
    selectSubArray.length <== substringLength;

    // Check if the substring occurs exactly once in the input
    component countSubstringOccurrences = CountSubstringOccurrences(maxLength, maxSubstringLength);
    countSubstringOccurrences.in <== in;
    countSubstringOccurrences.substring <== selectSubArray.out;
    countSubstringOccurrences.count === 1;

    substring <== selectSubArray.out;
}