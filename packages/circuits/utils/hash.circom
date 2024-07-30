pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "./array.circom";

/// @title PoseidonLarge
/// @notice Circuit to calculate Poseidon hash of inputs more than 16
/// @notice Merges two consecutive chunks to bring size < 16 assuming ints are chunks of a large number (a + bitsPerChunk * b)
/// @notice Assumes merging of two ints fit in field
/// @notice Can be made more generic by taking hash with any size inputs with nesting
/// @param bitsPerChunk Number of bits in each chunk
/// @param chunkSize Number of chunks in input
/// @input in: Array of chunkSize elements; assumes elements to fit in `bitsPerChunk` bits
/// @output out: Poseidon hash of input where consecutive elements are merged
template PoseidonLarge(bitsPerChunk, chunkSize) {
    assert(chunkSize > 16); // Can use regular Poseidon for smaller chunks
    assert(chunkSize <= 32); // We only support up to 32 chunks. i.e half should be less than 16
    assert(bitsPerChunk * 2 < 251);
  
    var halfChunkSize = chunkSize >> 1;
    if (chunkSize % 2 == 1) {
        halfChunkSize += 1;
    }

    signal input in[chunkSize];
    signal output out;

    signal poseidonInput[halfChunkSize];

    for(var i = 0; i < halfChunkSize; i++) {
        if (i == halfChunkSize - 1 && chunkSize % 2 == 1) {
            poseidonInput[i] <== in[2 * i];
        } else {
            poseidonInput[i] <== in[2 * i] + (1 << bitsPerChunk) * in[2 * i + 1];
        }
    }

    out <== Poseidon(halfChunkSize)(poseidonInput);
}

/// @title PoseidonModular
/// @notice Circuit to calculate Poseidon hash of an arbitrary number of inputs
/// @notice Splits input into chunks of 16 elements (or less for the last chunk) and hashes them separately
/// @notice Then combines the chunk hashes using a binary tree structure
/// @notice This is a modified version from: https://github.com/burnt-labs/email-wallet/blob/b6601fed6fc1bf119739dce6a49e69d69144c5fa/circuits/utils/commit.circom#L24
/// @param numElements Number of elements in the input array
/// @input in: Array of numElements to be hashed
/// @output out: Poseidon hash of the input array
template PoseidonModular(numElements) {
    signal input in[numElements];
    signal output out; 

    var chunks = numElements \ 16;
    var last_chunk_size = numElements % 16;
    if (last_chunk_size != 0) {
        chunks += 1;
    }

    var _out;
    
    for (var i = 0; i < chunks; i++) {
        var start = i * 16;
        var end = start + 16;
        var chunk_hash;

        if (end > numElements) { // last chunk
            end = numElements;
            var last_chunk[last_chunk_size] = Slice(numElements, start, end)(in);
            chunk_hash = Poseidon(last_chunk_size)(last_chunk);
        } else {
            var chunk[16] = Slice(numElements, start, end)(in);
            chunk_hash = Poseidon(16)(chunk);
        }

        if (i == 0) {
            _out = chunk_hash;
        } else {
            _out = Poseidon(2)([_out, chunk_hash]);
        }
    }

    out <== _out;
}