pragma circom 2.1.5;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "./constants.circom";


/// @title PackBytesToInts
/// @notice Converts a byte array into a 31-byte integer array (packing)
/// @param maxBytes: the maximum number of bytes in the input array
/// @input in: the input byte array
/// @output out: the output integer array
template PackBytesToInts(maxBytes) {
    var packSize = MAX_BYTES_IN_FIELD();

    // Calculate number of int chunks based in maxBytes
    var remain = maxBytes % packSize;
    var maxInts = (maxBytes - remain) / packSize;
    if (remain > 0) {
        maxInts += 1;
    }

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
