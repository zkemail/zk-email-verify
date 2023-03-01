pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

template MultiOROld(n) {
    signal input in[n];
    signal output out;
    component or1;
    component or2;
    component ors[2];
    if (n==1) {
        out <== in[0];
    } else if (n==2) {
        or1 = OR();
        or1.a <== in[0];
        or1.b <== in[1];
        out <== or1.out;
    } else {
        or2 = OR();
        var n1 = n\2;
        var n2 = n-n\2;
        ors[0] = MultiOR(n1);
        ors[1] = MultiOR(n2);
        var i;
        for (i=0; i<n1; i++) ors[0].in[i] <== in[i];
        for (i=0; i<n2; i++) ors[1].in[i] <== in[n1+i];
        or2.a <== ors[0].out;
        or2.b <== ors[1].out;
        out <== or2.out;
    }
}

template MultiOR(n) {
    signal input in[n];
    signal output out;

    signal sums[n];
    sums[0] <== in[0];
    for (var i = 1; i < n; i++) {
        sums[i] <== sums[i-1] + in[i];
    }

    component is_zero = IsZero();
    is_zero.in <== sums[n-1];
    out <== 1 - is_zero.out;
}


// template XOR() {
//     signal input a;
//     signal input b;
//     signal output out;

//     out <== a + b - 2*a*b;
// }

// template AND() {
//     signal input a;
//     signal input b;
//     signal output out;

//     out <== a*b;
// }

// template OR() {
//     signal input a;
//     signal input b;
//     signal output out;

//     out <== a + b - a*b;
// }

// template NOT() {
//     signal input in;
//     signal output out;

//     out <== 1 + in - 2*in;
// }

// template NAND() {
//     signal input a;
//     signal input b;
//     signal output out;

//     out <== 1 - a*b;
// }

// template NOR() {
//     signal input a;
//     signal input b;
//     signal output out;

//     out <== a*b + 1 - a - b;
// }

// template MultiAND(n) {
//     signal input in[n];
//     signal output out;
//     component and1;
//     component and2;
//     component ands[2];
//     if (n==1) {
//         out <== in[0];
//     } else if (n==2) {
//         and1 = AND();
//         and1.a <== in[0];
//         and1.b <== in[1];
//         out <== and1.out;
//     } else {
//         and2 = AND();
//         var n1 = n\2;
//         var n2 = n-n\2;
//         ands[0] = MultiAND(n1);
//         ands[1] = MultiAND(n2);
//         var i;
//         for (i=0; i<n1; i++) ands[0].in[i] <== in[i];
//         for (i=0; i<n2; i++) ands[1].in[i] <== in[n1+i];
//         and2.a <== ands[0].out;
//         and2.b <== ands[1].out;
//         out <== and2.out;
//     }
// }





