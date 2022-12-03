pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/sha256/constants.circom";
include "../node_modules/circomlib/circuits/sha256/sha256compression.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./utils.circom";

// A modified version of the SHA256 circuit that allows specified length messages up to a max to all work via array indexing on the SHA256 compression circuit.
template Sha256General(maxBitsPadded) {
    // maxBitsPadded must be a multiple of 512, and the bit circuits in this file are limited to 15 so must be raised if the message is longer.
    assert(maxBitsPadded % 512 == 0);
    var maxBitsPaddedBits = log2_ceil(maxBitsPadded);
    assert(2 ** maxBitsPaddedBits > maxBitsPadded);

    // Note that maxBitsPadded = maxBits + 64
    signal input paddedIn[maxBitsPadded];
    signal output out[256];
    signal input in_len_padded_bits; // This is the padded length of the message pre-hash.
    signal inBlockIndex;

    var i;
    var k;
    var j;
    var maxBlocks;
    var bitsLastBlock;
    maxBlocks = (maxBitsPadded\512);
    var maxBlocksBits = log2_ceil(maxBlocks);
    assert(2 ** maxBlocksBits > maxBlocks);

    inBlockIndex <-- (in_len_padded_bits >> 9);
    in_len_padded_bits === inBlockIndex * 512;

    // These verify the unconstrained floor calculation is the uniquely correct integer that represents the floor
    // component floorVerifierUnder = LessEqThan(maxBitsPaddedBits); // todo verify the length passed in is less than nbits. note that maxBitsPaddedBits can likely be lowered or made it a fn of maxbits
    // floorVerifierUnder.in[0] <== (inBlockIndex)*512;
    // floorVerifierUnder.in[1] <== in_len_padded_bits;
    // floorVerifierUnder.out === 1;

    // component floorVerifierOver = GreaterThan(maxBitsPaddedBits);
    // floorVerifierOver.in[0] <== (inBlockIndex+1)*512;
    // floorVerifierOver.in[1] <== in_len_padded_bits;
    // floorVerifierOver.out === 1;

    // These verify we pass in a valid number of bits to the SHA256 compression circuit.
    component bitLengthVerifier = LessEqThan(maxBitsPaddedBits); // todo verify the length passed in is less than nbits. note that maxBitsPaddedBits can likely be lowered or made it a fn of maxbits
    bitLengthVerifier.in[0] <== in_len_padded_bits;
    bitLengthVerifier.in[1] <== maxBitsPadded;
    bitLengthVerifier.out === 1;

    // Note that we can no longer do padded verification efficiently inside the SHA because it requires non deterministic array indexing.
    // We can do it if we add a constraint, but since guessing a valid SHA2 preimage is hard anyways, we'll just do it outside the circuit.

    // signal paddedIn[maxBlocks*512];
    // for (k=0; k<maxBits; k++) {
    //     paddedIn[k] <== in[k];
    // }
    // paddedIn[maxBits] <== 1;
    // for (k=maxBits+1; k<maxBlocks*512-64; k++) {
    //     paddedIn[k] <== 0;
    // }
    // for (k = 0; k< 64; k++) {
    //     paddedIn[maxBlocks*512 - k -1] <== (maxBits >> k)&1;
    // }

    component ha0 = H(0);
    component hb0 = H(1);
    component hc0 = H(2);
    component hd0 = H(3);
    component he0 = H(4);
    component hf0 = H(5);
    component hg0 = H(6);
    component hh0 = H(7);

    component sha256compression[maxBlocks];

    for (i=0; i<maxBlocks; i++) {

        sha256compression[i] = Sha256compression() ;

        if (i==0) {
            for (k=0; k<32; k++ ) {
                sha256compression[i].hin[0*32+k] <== ha0.out[k];
                sha256compression[i].hin[1*32+k] <== hb0.out[k];
                sha256compression[i].hin[2*32+k] <== hc0.out[k];
                sha256compression[i].hin[3*32+k] <== hd0.out[k];
                sha256compression[i].hin[4*32+k] <== he0.out[k];
                sha256compression[i].hin[5*32+k] <== hf0.out[k];
                sha256compression[i].hin[6*32+k] <== hg0.out[k];
                sha256compression[i].hin[7*32+k] <== hh0.out[k];
            }
        } else {
            for (k=0; k<32; k++ ) {
                sha256compression[i].hin[32*0+k] <== sha256compression[i-1].out[32*0+31-k];
                sha256compression[i].hin[32*1+k] <== sha256compression[i-1].out[32*1+31-k];
                sha256compression[i].hin[32*2+k] <== sha256compression[i-1].out[32*2+31-k];
                sha256compression[i].hin[32*3+k] <== sha256compression[i-1].out[32*3+31-k];
                sha256compression[i].hin[32*4+k] <== sha256compression[i-1].out[32*4+31-k];
                sha256compression[i].hin[32*5+k] <== sha256compression[i-1].out[32*5+31-k];
                sha256compression[i].hin[32*6+k] <== sha256compression[i-1].out[32*6+31-k];
                sha256compression[i].hin[32*7+k] <== sha256compression[i-1].out[32*7+31-k];
            }
        }

        for (k=0; k<512; k++) {
            sha256compression[i].inp[k] <== paddedIn[i*512+k];
        }
    }

    // Select the correct compression output for the given length, instead of just the last one.
    component arraySelectors[256];
    for (k=0; k<256; k++) {
        arraySelectors[k] = QuinSelector(maxBlocks, maxBlocksBits);
        for (j=0; j<maxBlocks; j++) {
            arraySelectors[k].in[j] <== sha256compression[j].out[k];
        }
        arraySelectors[k].index <== inBlockIndex - 1; // The index is 0 indexed and the block numbers are 1 indexed.
        out[k] <== arraySelectors[k].out;
    }

    // for (k=0; k<256; k++) {
    //     out[k] <== sha256compression[maxBlocks-1].out[k];
    // }
}
