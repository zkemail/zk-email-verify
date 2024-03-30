pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

function log2Ceil(a) {
    var n = a+1;
    var r = 0;
    while (n>0) {
        r++;
        n \= 2;
    }
    return r;
}


/// @title ArrayShiftLeft
/// @notice Shift input array by shift indices to the left
/// @notice Can optionally get a sub-array by setting `maxSubArrayLen` 
/// @notice Based on https://demo.hedgedoc.org/s/Le0R3xUhB
/// @param maxArrayLen The maximum length of the input array
/// @param maxSubArrayLen The maximum length of the output array
/// @input in The input array
/// @input shift The number of indices to shift the array to the left
/// @output out hifted subarray
template ArrayShiftLeft(maxArrayLen, maxSubArrayLen) {
    var bitLength = log2Ceil(maxArrayLen);
    assert(maxArrayLen <= (1 << bitLength));
    assert(maxSubArrayLen <= maxArrayLen);

    signal input in[maxArrayLen];
    signal input shift;

    signal output out[maxSubArrayLen];

    component n2b = Num2Bits(bitLength);
    n2b.in <== shift;

    signal tmp[bitLength][maxArrayLen];
    for (var j = 0; j < bitLength; j++) {
        for (var i = 0; i < maxArrayLen; i++) {
            var offset = (i + (1 << j)) % maxArrayLen;
            // Shift left by 2^j indices if bit is 1
            if (j == 0) {
                tmp[j][i] <== n2b.out[j] * (in[offset] - in[i]) + in[i];
            } else {
                tmp[j][i] <== n2b.out[j] * (tmp[j-1][offset] - tmp[j-1][i]) + tmp[j-1][i];
            }
        }
    }

    // Return last row
    for (var i = 0; i < maxSubArrayLen; i++) {
        out[i] <== tmp[bitLength - 1][i];
    }
}


/// @title ArraySelector
/// @notice Select an element from an array based on index
/// @notice This is QuinSelector from MACI https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/trees/incrementalQuinTree.circom
/// @param maxLength The number of elements in the array
/// @input in The input array
/// @input index The index of the element to select
/// @output out The selected element
template ArraySelector(maxLength) {
    var bitLength = log2Ceil(maxArrayLen);

    signal input in[maxLength];
    signal input index;
    signal output out;

    // Ensure that index < maxLength
    component lessThan = LessThan(bitLength);
    lessThan.in[0] <== index;
    lessThan.in[1] <== maxLength;
    lessThan.out === 1;

    component calcTotal = CalculateTotal(maxLength);
    component eqs[maxLength];

    // For each item, check whether its index equals the input index.
    for (var i = 0; i < maxLength; i ++) {
        eqs[i] = IsEqual();
        eqs[i].in[0] <== i;
        eqs[i].in[1] <== index;

        // eqs[i].out is 1 if the index matches. As such, at most one input to
        // calcTotal is not 0.
        calcTotal.nums[i] <== eqs[i].out * in[i];
    }

    // Returns 0 + 0 + ... + item
    out <== calcTotal.sum;
}


/// @title CalculateTotal
/// @notice Calculate the sum of an array
/// @param n The number of elements in the array
/// @input nums The input array
/// @output sum The sum of the input array
template CalculateTotal(n) {
    signal input nums[n];
    signal output sum;

    signal sums[n];
    sums[0] <== nums[0];

    for (var i=1; i < n; i++) {
        sums[i] <== sums[i - 1] + nums[i];
    }

    sum <== sums[n - 1];
}
