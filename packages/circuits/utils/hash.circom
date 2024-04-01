pragma circom 2.1.6;


/// @title PoseidonLarge
/// @notice Circuit to calculate Poseidon hash of inputs more than 16
/// @notice Merges two consecutive chunks to bring size < 16 assuming ints are chunks of a large number (a + bytesPerChunk * b)
/// @notice Assumes merging of two ints fit in field
/// @notice Can be made more generic by taking hash with any size inputs with nesting
/// @param bytesPerChunk Number of bits in each chunk
/// @param chunkSize Number of chunks in input
/// @input in: Array of chunkSize elements
/// @output out: Poseidon hash of input where consecutive elements are merged
template PoseidonLarge(bytesPerChunk, chunkSize) {
    assert(chunkSize > 16); // Can use regular Poseidon for smaller chunks
    assert(chunkSize <= 32); // We only support up to 32 chunks. i.e half should be less than 16
    assert(bytesPerChunk * 2 < 251);
  
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
            poseidonInput[i] <== in[2 * i] + (1 << bytesPerChunk) * in[2 * i + 1];
        }
    }

    out <== Poseidon(halfChunkSize)(poseidonInput);
}

