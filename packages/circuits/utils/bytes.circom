pragma circom 2.1.5;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "./array.circom";
include "./constants.circom";

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
                intSums[i][j] <== bytes[idx];
            }
            // Every other item is 256^j * byte
            else {
                intSums[i][j] <== intSums[i][j-1] + (1 << (8*j)) * bytes[idx];
            }
        }
    }
    
    // Last item of each chunk is the final sum
    for (var i = 0; i < maxInts; i++) {
        ints[i] <== intSums[i][packSize-1];
    }
}



/// @title ByteSubArrayToInts
/// @notice Select sub array from a byte array and pack to a 31-byte integer array
/// @param maxBytes: the maximum number of bytes in the input array
/// @input in: the input byte array
/// @output out: the output integer array
template ByteSubArrayToInts(maxArrayLen, maxSubArrayLen) {
    var maxInts = computeIntChunkLength(maxSubArrayLen);
    
    signal input in[maxArrayLen, maxSubArrayLen];
    signal input startIndex;
    signal input length;

    signal output out[maxSubArrayLen];

    component slicer = SubarraySelector(maxArrayLen, maxSubArrayLen);
    slicer.in <== in;
    slicer.startIndex <== startIndex;
    slicer.length <== length;

    component packer = BytesToInts(maxSubArrayLen);
    packer.in <== slicer.out;
    packer.out <== out;
}
