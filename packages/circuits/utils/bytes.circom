pragma circom 2.1.6;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "./array.circom";
include "./constants.circom";
include "./functions.circom";


function computeIntChunkLength(byteLength) {
    var packSize = MAX_BYTES_IN_FIELD();

    var remain = byteLength % packSize;
    var numChunks = (byteLength - remain) / packSize;
    if (remain > 0) {
        numChunks += 1;
    }

    return numChunks;
}


/// @title PackBytes
/// @notice Pack an array of bytes to numbers that fit in the field
/// @param maxBytes: the maximum number of bytes in the input array
/// @input in: the input byte array
/// @output out: the output integer array
template PackBytes(maxBytes) {
    var packSize = MAX_BYTES_IN_FIELD();
    var maxInts = computeIntChunkLength(maxBytes);

    signal input in[maxBytes];
    signal output out[maxInts];

    signal intSums[maxInts][packSize];

    for (var i = 0; i < maxInts; i++) {
        for(var j=0; j < packSize; j++) {
            var idx = packSize * i + j;

            // Copy the previous value if we are out of bounds - we take last item as final result
            if(idx >= maxBytes) {
                intSums[i][j] <== intSums[i][j-1];
            } 
            // First item of each chunk is the byte itself
            else if (j == 0){
                intSums[i][j] <== in[idx];
            }
            // Every other item is 256^j * byte
            else {
                intSums[i][j] <== intSums[i][j-1] + (1 << (8*j)) * in[idx];
            }
        }
    }
    
    // Last item of each chunk is the final sum
    for (var i = 0; i < maxInts; i++) {
        out[i] <== intSums[i][packSize-1];
    }
}


/// @title PackByteSubArray
/// @notice Select sub array from the input array and pack it to numbers that fit in the field
/// @notice This is not used in ZK-Email circuits anywhere
/// @param maxArrayLen: the maximum number of elements in the input array
/// @param maxSubArrayLen: the maximum number of elements in the sub array
/// @input in: the input byte array
/// @input startIndex: the start index of the sub array
/// @input length: the length of the sub array
/// @output out: the output integer array
template PackByteSubArray(maxArrayLen, maxSubArrayLen) {
    assert(maxSubArrayLen < maxArrayLen);
    var chunkLength = computeIntChunkLength(maxSubArrayLen);

    signal input in[maxArrayLen];
    signal input startIndex;
    signal input length;

    signal output out[chunkLength];

    assert(length <= maxSubArrayLen);

    component SelectSubArray = SelectSubArray(maxArrayLen, maxSubArrayLen);
    SelectSubArray.in <== in;
    SelectSubArray.startIndex <== startIndex;
    SelectSubArray.length <== length;

    component packer = PackBytes(maxSubArrayLen);
    packer.in <== SelectSubArray.out;

    out <== packer.out;
}


/// @title DigitBytesToInt
/// @notice Converts a byte array representing digits to an integer
/// @notice Assumes the output number fits in the field
/// @param n: the number of bytes in the input array
/// @input in: the input byte array - big-endtian digit string of `out`
/// @output out: the output integer
template DigitBytesToInt(n) {
    signal input in[n];

    signal output out;

    signal sums[n+1];
    sums[0] <== 0;

    // TODO: Should we constrain the input ASCII to be between 48 and 57?

    for(var i = 0; i < n; i++) {
        sums[i + 1] <== 10 * sums[i] + (in[i] - 48);
    }

    out <== sums[n];
}
