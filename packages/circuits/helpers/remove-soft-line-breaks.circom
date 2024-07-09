pragma circom 2.1.6;

include "circomlib/comparators.circom";
include "circomlib/mux1.circom";

template QuinSelector(array_length) {
    signal input array[array_length];
    signal input index;
    signal output value;

    component is_equal[array_length];
    component mux[array_length];

    signal selected[array_length + 1];
    selected[0] <== 0;

    for (var i = 0; i < array_length; i++) {
        is_equal[i] = IsEqual();
        is_equal[i].in[0] <== index;
        is_equal[i].in[1] <== i;

        mux[i] = Mux1();
        mux[i].c[0] <== selected[i];
        mux[i].c[1] <== array[i];
        mux[i].s <== is_equal[i].out;

        selected[i + 1] <== mux[i].out;
    }

    value <== selected[array_length];
}

template RemoveSoftLineBreaks(encoded_length, decoded_length) {
    signal input encoded[encoded_length];
    signal input decoded[decoded_length];
    signal input r;
    signal output is_valid;

    // Helper signals
    signal processed[encoded_length];
    signal is_equals[encoded_length];
    signal is_cr[encoded_length];
    signal is_lf[encoded_length];
    signal temp_soft_break[encoded_length - 2];
    signal is_soft_break[encoded_length];
    signal should_zero[encoded_length];
    signal is_valid_char[encoded_length];
    signal r_enc[encoded_length];
    signal sum_enc[encoded_length];
    signal r_dec[decoded_length];
    signal sum_dec[decoded_length];

    r_enc[0] <== 1;
    r_dec[0] <== 1;

    // Helper components
    component mux_enc[encoded_length];

    // Check for '=' (61 in ASCII)
    for (var i = 0; i < encoded_length; i++) {
        is_equals[i] <== IsEqual()([encoded[i], 61]);
    }

    // Check for '\r' (13 in ASCII)
    for (var i = 0; i < encoded_length - 1; i++) {
        is_cr[i] <== IsEqual()([encoded[i + 1], 13]);
    }
    is_cr[encoded_length - 1] <== 0;

    // Check for '\n' (10 in ASCII)
    for (var i = 0; i < encoded_length - 2; i++) {
        is_lf[i] <== IsEqual()([encoded[i + 2], 10]);
    }
    is_lf[encoded_length - 2] <== 0;
    is_lf[encoded_length - 1] <== 0;

    // Identify soft line breaks
    for (var i = 0; i < encoded_length - 2; i++) {
        temp_soft_break[i] <== is_equals[i] * is_cr[i];
        is_soft_break[i] <== temp_soft_break[i] * is_lf[i];
    }
    // Handle the last two characters
    is_soft_break[encoded_length - 2] <== is_equals[encoded_length - 2] * is_cr[encoded_length - 2];
    is_soft_break[encoded_length - 1] <== 0;

    // Determine which characters should be zeroed
    for (var i = 0; i < encoded_length; i++) {
        if (i == 0) {
            should_zero[i] <== is_soft_break[i];
        } else if (i == 1) {
            should_zero[i] <== is_soft_break[i] + is_soft_break[i-1];
        } else if (i == encoded_length - 1) {
            should_zero[i] <== is_soft_break[i-1] + is_soft_break[i-2];
        } else {
            should_zero[i] <== is_soft_break[i] + is_soft_break[i-1] + is_soft_break[i-2];
        }
    }

    // Process the encoded input
    for (var i = 0; i < encoded_length; i++) {
        processed[i] <== (1 - should_zero[i]) * encoded[i];
    }

    // Calculate powers of r for encoded
    for (var i = 1; i < encoded_length; i++) {
        mux_enc[i] = Mux1();
        mux_enc[i].c[0] <== r_enc[i - 1] * r;
        mux_enc[i].c[1] <== r_enc[i - 1];
        mux_enc[i].s <== should_zero[i];
        r_enc[i] <== mux_enc[i].out;
    }

    // Calculate powers of r for decoded
    for (var i = 1; i < decoded_length; i++) {
        r_dec[i] <== r_dec[i - 1] * r;
    }

    // Calculate rlc for processed
    sum_enc[0] <== processed[0];
    for (var i = 1; i < encoded_length; i++) {
        sum_enc[i] <== sum_enc[i - 1] + r_enc[i] * processed[i];
    }

    // Calculate rlc for decoded
    sum_dec[0] <== decoded[0];
    for (var i = 1; i < decoded_length; i++) {
        sum_dec[i] <== sum_dec[i - 1] + r_dec[i] * decoded[i];
    }

    // Check if rlc for decoded is equal to rlc for encoded
    is_valid <== IsEqual()([ sum_enc[encoded_length - 1], sum_dec[decoded_length - 1]]);
}

component main = RemoveSoftLineBreaks(17, 11);

/* INPUT = {
    "encoded": [115, 101, 115, 58, 61, 13, 10, 45, 32, 83, 114, 101, 97, 107, 61, 13, 10],
    "decoded": [115, 101, 115, 58, 45, 32, 83, 114, 101, 97, 107],
    "r": 69
} */