pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";
include "../utils/hash.circom";

template RemoveSoftLineBreaks(maxLength) {
    signal input encoded[maxLength];
    signal input decoded[maxLength];
    signal output is_valid;

    // Helper signals
    signal r;
    signal processed[maxLength];
    signal is_equals[maxLength];
    signal is_cr[maxLength];
    signal is_lf[maxLength];
    signal temp_soft_break[maxLength - 2];
    signal is_soft_break[maxLength];
    signal should_zero[maxLength];
    signal is_valid_char[maxLength];
    signal r_enc[maxLength];
    signal sum_enc[maxLength];
    signal r_dec[maxLength];
    signal sum_dec[maxLength];

    // Helper components
    component mux_enc[maxLength];

    // Deriving r from Poseidon hash
    component r_hasher = PoseidonModular(2 * maxLength);
    for (var i = 0; i < maxLength; i++) {
        r_hasher.in[i] <== encoded[i];
    }
    for (var i = 0; i < maxLength; i++) {
        r_hasher.in[maxLength + i] <== decoded[i];
    }
    r <== r_hasher.out;

    // Check for '=' (61 in ASCII)
    for (var i = 0; i < maxLength; i++) {
        is_equals[i] <== IsEqual()([encoded[i], 61]);
    }

    // Check for '\r' (13 in ASCII)
    for (var i = 0; i < maxLength - 1; i++) {
        is_cr[i] <== IsEqual()([encoded[i + 1], 13]);
    }
    is_cr[maxLength - 1] <== 0;

    // Check for '\n' (10 in ASCII)
    for (var i = 0; i < maxLength - 2; i++) {
        is_lf[i] <== IsEqual()([encoded[i + 2], 10]);
    }
    is_lf[maxLength - 2] <== 0;
    is_lf[maxLength - 1] <== 0;

    // Identify soft line breaks
    for (var i = 0; i < maxLength - 2; i++) {
        temp_soft_break[i] <== is_equals[i] * is_cr[i];
        is_soft_break[i] <== temp_soft_break[i] * is_lf[i];
    }
    // Handle the last two characters
    is_soft_break[maxLength - 2] <== is_equals[maxLength - 2] * is_cr[maxLength - 2];
    is_soft_break[maxLength - 1] <== 0;

    // Determine which characters should be zeroed
    for (var i = 0; i < maxLength; i++) {
        if (i == 0) {
            should_zero[i] <== is_soft_break[i];
        } else if (i == 1) {
            should_zero[i] <== is_soft_break[i] + is_soft_break[i-1];
        } else if (i == maxLength - 1) {
            should_zero[i] <== is_soft_break[i-1] + is_soft_break[i-2];
        } else {
            should_zero[i] <== is_soft_break[i] + is_soft_break[i-1] + is_soft_break[i-2];
        }
    }

    // Process the encoded input
    for (var i = 0; i < maxLength; i++) {
        processed[i] <== (1 - should_zero[i]) * encoded[i];
    }

    // Calculate powers of r for encoded
    r_enc[0] <== 1;
    for (var i = 1; i < maxLength; i++) {
        mux_enc[i] = Mux1();
        mux_enc[i].c[0] <== r_enc[i - 1] * r;
        mux_enc[i].c[1] <== r_enc[i - 1];
        mux_enc[i].s <== should_zero[i];
        r_enc[i] <== mux_enc[i].out;
    }

    // Calculate powers of r for decoded
    r_dec[0] <== 1;
    for (var i = 1; i < maxLength; i++) {
        r_dec[i] <== r_dec[i - 1] * r;
    }

    // Calculate rlc for processed
    sum_enc[0] <== processed[0];
    for (var i = 1; i < maxLength; i++) {
        sum_enc[i] <== sum_enc[i - 1] + r_enc[i] * processed[i];
    }

    // Calculate rlc for decoded
    sum_dec[0] <== decoded[0];
    for (var i = 1; i < maxLength; i++) {
        sum_dec[i] <== sum_dec[i - 1] + r_dec[i] * decoded[i];
    }

    // Check if rlc for decoded is equal to rlc for encoded
    is_valid <== IsEqual()([sum_enc[maxLength - 1], sum_dec[maxLength - 1]]);
}