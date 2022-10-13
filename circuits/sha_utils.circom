pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./fp.circom";

// returns ceil(log2(a+1))
function log2_ceil(a) {
    var n = a+1;
    var r = 0;
    while (n>0) {
        r++;
        n \= 2;
    }
    return r;
}

// Lifted from MACI https://github.com/privacy-scaling-explorations/maci/blob/v1/circuits/circom/trees/incrementalQuinTree.circom#L29
// Bits is ceil(log2 choices)
template QuinSelector(choices, bits) {
    signal input in[choices];
    signal input index;
    signal output out;

    // Ensure that index < choices
    component lessThan = LessThan(bits);
    lessThan.in[0] <== index;
    lessThan.in[1] <== choices;
    lessThan.out === 1;

    component calcTotal = CalculateTotal(choices);
    component eqs[choices];

    // For each item, check whether its index equals the input index.
    for (var i = 0; i < choices; i ++) {
        eqs[i] = IsEqual();
        eqs[i].in[0] <== i;
        eqs[i].in[1] <== index;

        // eqs[i].out is 1 if the index matches. As such, at most one input to
        // calcTotal is not 0.
        calcTotal.nums[i] <== eqs[i].out * in[i];
    }

    // Returns 0 + 0 + ... + item
    out <== calcTotal.sum;
}

template CalculateTotal(n) {
    signal input nums[n];
    signal output sum;

    signal sums[n];
    sums[0] <== nums[0];

    for (var i=1; i < n; i++) {
        sums[i] <== sums[i - 1] + nums[i];
    }

    sum <== sums[n - 1];
}

// Modulo lifted from https://sourcegraph.com/github.com/darkforest-eth/circuits/-/blob/perlin/perlin.circom and https://sourcegraph.com/github.com/zk-ml/demo/-/blob/circuits/math/circuit.circom
// input: dividend and divisor field elements in [0, sqrt(p))
// output: remainder and quotient field elements in [0, p-1] and [0, sqrt(p)
// Haven't thought about negative divisor yet. Not needed.
// -8 % 5 = 2. [-8 -> 8. 8 % 5 -> 3. 5 - 3 -> 2.]
// (-8 - 2) // 5 = -2
// -8 + 2 * 5 = 2
// check: 2 - 2 * 5 = -8
template Modulo(divisor_bits) {
    signal input dividend; // -8
    signal input divisor; // 5
    signal output remainder; // 2
    signal output quotient; // -2

    component is_neg = IsNegative();
    is_neg.in <== dividend;

    signal output is_dividend_negative;
    is_dividend_negative <== is_neg.out;

    signal output dividend_adjustment;
    dividend_adjustment <== 1 + is_dividend_negative * -2; // 1 or -1

    signal output abs_dividend;
    abs_dividend <== dividend * dividend_adjustment; // 8

    signal output raw_remainder;
    raw_remainder <-- abs_dividend % divisor;

    signal output neg_remainder;
    neg_remainder <-- divisor - raw_remainder;

    if (is_dividend_negative == 1 && raw_remainder != 0) {
        remainder <-- neg_remainder;
    } else {
        remainder <-- raw_remainder;
    }

    quotient <-- (dividend - remainder) / divisor; // (-8 - 2) / 5 = -2.

    dividend === divisor * quotient + remainder; // -8 = 5 * -2 + 2.

    component rp = MultiRangeProof(3, 128);
    rp.in[0] <== divisor;
    rp.in[1] <== quotient;
    rp.in[2] <== dividend;
    //rp.max_abs_value <== SQRT_P;

    // check that 0 <= remainder < divisor
    component remainderUpper = LessThan(divisor_bits);
    remainderUpper.in[0] <== remainder;
    remainderUpper.in[1] <== divisor;
    remainderUpper.out === 1;
}

// Written by us
// n bytes per signal, n = 31 usually
template Packed2Bytes(n){
    signal input in; // < 2 ^ (8 * 31)
    signal output out[n]; // each out is < 64
    // Rangecheck in and out?

    // Constrain bits
    component nbytes = Num2Bits(8 * n);
    nbytes.in <== in;
    component bytes[n];

    for (var k = 0; k < n; k++){
        // Witness gen out
        out[k] <-- (in >> (k * 8)) % 256;

        // Constrain bits to match
        bytes[k] = Num2Bits(8);
        bytes[k].in <== out[k];
        for (var j = 0; j < 8; j++) {
            nbytes.out[k * 8 + j] === bytes[k].out[j];
        }
    }
}

// Written by us
// n bytes per signal, n = 31 usually
template Bytes2Packed(n){
    signal input in[n]; // each in is < 64
    signal pow2[n+1]; // [k] is 2^k
    signal in_prefix_sum[n+1]; // each [k] is in[0] + 2^8 in[1]... 2^{8k-8} in[k-1]. cont.
    // [0] is 0. [1] is in[0]. [n+1] is out.
    signal output out; // < 2 ^ (8 * 31)
    // Rangecheck in and out?

    // Witness gen out
    in_prefix_sum[0] <-- 0;
    for (var k = 0; k < n; k++){
        in_prefix_sum[k+1] <-- in_prefix_sum[k] + in[k] * (2 ** (k * 8));
    }
    out <-- in_prefix_sum[n];

    // Constrain out bits
    component nbytes = Num2Bits(8 * n);
    nbytes.in <== out; // I think this auto-rangechecks out to be < 8*n bits.
    component bytes[n];

    for (var k = 0; k < n; k++){
        bytes[k] = Num2Bits(8);
        bytes[k].in <== in[k];
        for (var j = 0; j < 8; j++) {
            nbytes.out[k * 8 + j] === bytes[k].out[j];
        }
    }
}
