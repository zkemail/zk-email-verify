pragma circom 2.1.5;


/// @title PoseidonLarge
/// @notice Circuit to calculate Poseidon hash of inputs more than 16
/// @notice This circuit is not very generic. It merges two consecutive chunks to bring size < 16
/// @notice Assumes input is packed ints (a + 256 * i * b)
/// @notice Also assumes that merging two elements would fit in the field
/// @param bitesPerChunk Number of bits in each chunk
/// @param chunkSize Number of chunks in input
/// @input in: Array of chunkSize elements
/// @output out: Poseidon hash of input where consecutive elements are merged
template PoseidonLarge(bitesPerChunk, chunkSize) {
    assert(chunkSize > 16); // Can use regular Poseidon for smaller chunks
    assert(chunkSize <= 32); // We only support up to 32 chunks. i.e half should be less than 16
  
    var halfChunkSize = chunkSize >> 1;
    if (chunkSize % 2 == 1) {
        halfChunkSize += 1;
    }

    signal input in[chunkSize];
    signal output out;

    signal poseidonInput[halfChunkSize];

    for(var i = 0; i < halfChunkSize; i++) {
        if (i == halfChunkSize - 1 && halfChunkSize % 2 == 1) {
            poseidonInput[i] <== in[2 * i];
        } else {
            poseidonInput[i] <== in[2 * i] + (1 << bitesPerChunk) * in[2 * i + 1];
        }
    }

    out <== Poseidon(halfChunkSize)(poseidonInput);
}

