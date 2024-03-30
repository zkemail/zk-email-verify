pragma circom 2.1.5;

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


/// @title BytesToInts
/// @notice Converts a byte array into a 31-byte integer array (packing)
/// @param maxBytes: the maximum number of bytes in the input array
/// @input in: the input byte array
/// @output out: the output integer array
template BytesToInts(maxBytes) {
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


/// @title ByteSubArrayToInts
/// @notice Select sub array from a byte array and pack to a 31-byte integer array
/// @notice This is not used in the main circuits
/// @param maxBytes: the maximum number of bytes in the input array
/// @input in: the input byte array
/// @output out: the output integer array
template ByteSubArrayToInts(maxArrayLen, maxSubArrayLen) {
    assert(maxSubArrayLen < maxArrayLen);
    var chunkLength = computeIntChunkLength(maxSubArrayLen);

    signal input in[maxArrayLen];
    signal input startIndex;
    signal input length;

    signal output out[chunkLength];

    assert(length < maxSubArrayLen);

    component shifter = ArrayShiftLeft(maxArrayLen, maxSubArrayLen);
    shifter.in <== in;
    shifter.shift <== startIndex;

    component packer = BytesToInts(maxSubArrayLen);

    // Set value after length to zero
    component gts[maxSubArrayLen];
    for (var i = 0; i < maxSubArrayLen; i++) {
        gts[i] = GreaterThan(log2Ceil(maxSubArrayLen));
        gts[i].in[0] <== length;
        gts[i].in[1] <== i;

        packer.in[i] <== gts[i].out * shifter.out[i];
    }


    out <== packer.out;
}


/// @title DigitBytesToInt
/// @notice Converts a byte array representing digits to an integer
/// @notice Assumes the input fit in the field
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
