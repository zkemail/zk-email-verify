
pragma circom 2.1.5;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "./constants.circom";


// `in` is a big-endtian digit string of `out`.
template Digit2Int(n) {
    signal input in[n];
    signal output out;

    component digit2int[n];
    signal sums[n+1];
    sums[0] <== 0;
    for(var i = 0; i < n; i++) {
        digit2int[i] = Digit2Int1();
        digit2int[i].in <== in[i];
        sums[i+1] <== 10 * sums[i] + digit2int[i].out;
    }
    out <== sums[n];
}

template Digit2Int1() {
    signal input in;
    signal output out;
    out <== in - 48;
}