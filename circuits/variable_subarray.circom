pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template VarShiftLeft(n, nBits) {
    signal input in[n]; // x
    signal input shift; // k
    
    signal output out[n]; // y

    component n2b = Num2Bits(nBits);
    n2b.in <== shift;

    signal tmp[nBits][n];
    for (var j = 0; j < nBits; j++) {
        for (var i = 0; i < n; i++) {
            var offset = (i + (1 << j)) % n;
            // Shift left by 2^j indices if bit is 1
            if (j == 0) {
                tmp[j][i] <== n2b.out[j] * (in[offset] - in[i]) + in[i];
            } else {
                tmp[j][i] <== n2b.out[j] * (tmp[j-1][offset] - tmp[j-1][i]) + tmp[j-1][i];
            }
        }
    }
    
    // Return last row
    for (var i = 0; i < n; i++) {
        out[i] <== tmp[nBits - 1][i];
    }
}

template VarSubarrayFromZeroIndex(n, nBits) {
    signal input in[n]; // x
    signal input end; // k
    
    signal output out[n]; // y

    component lt[n];
    for (var i = 0; i < n; i++) {
        lt[i] = LessThan(nBits);
        lt[i].in[0] <== i;
        lt[i].in[1] <== end;
        
        // y[i] = (i < k) * x[i]
        out[i] <== lt[i].out * in[i];
    }  
}

// l, h lie in [0, n)
// the first values of out are the values at indices [l, h) of in
// the remainder of out is 0-padded
// nBits = floor(log n) + 1
template VarSubarray(n, nBits) {
    signal input in[n]; // x
    signal input start; // l
    signal input end; // h
    
    signal output out[n];

    // Check that l < h
    component lt = LessThan(nBits);
    lt.in[0] <== start;
    lt.in[1] <== end;
    lt.out === 1;

    // Shift left by l indices
    component shiftLeft = VarShiftLeft(n, nBits);
    shiftLeft.in <== in;
    shiftLeft.shift <== start;

    // Take first (h - l) indices
    component subarrayFromZeroIndex = VarSubarrayFromZeroIndex(n, nBits);
    subarrayFromZeroIndex.in <== shiftLeft.out;
    subarrayFromZeroIndex.end <== end - start;

    out <== subarrayFromZeroIndex.out;
}