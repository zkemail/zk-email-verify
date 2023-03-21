pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/comparators.circom";

// http://0x80.pl/notesen/2016-01-17-sse-base64-decoding.html#vector-lookup-base
template Base64Lookup() {
    signal input in;
    signal output out;

    // ['A', 'Z']
    component le_Z = LessThan(8);
    le_Z.in[0] <== in;
    le_Z.in[1] <== 90+1;

    component ge_A = GreaterThan(8);
    ge_A.in[0] <== in;
    ge_A.in[1] <== 65-1;

    signal range_AZ <== ge_A.out * le_Z.out;
    signal sum_AZ <== range_AZ * (in - 65);

    // ['a', 'z']
    component le_z = LessThan(8);
    le_z.in[0] <== in;
    le_z.in[1] <== 122+1;

    component ge_a = GreaterThan(8);
    ge_a.in[0] <== in;
    ge_a.in[1] <== 97-1;

    signal range_az <== ge_a.out * le_z.out;
    signal sum_az <== sum_AZ + range_az * (in - 71);

    // ['0', '9']
    component le_9 = LessThan(8);
    le_9.in[0] <== in;
    le_9.in[1] <== 57+1;

    component ge_0 = GreaterThan(8);
    ge_0.in[0] <== in;
    ge_0.in[1] <== 48-1;

    signal range_09 <== ge_0.out * le_9.out;
    signal sum_09 <== sum_az + range_09 * (in + 4);

    // '+'
    component equal_plus = IsZero();
    equal_plus.in <== in - 43;
    signal sum_plus <== sum_09 + equal_plus.out * (in + 19);

    // '/'
    component equal_slash = IsZero();
    equal_slash.in <== in - 47;
    signal sum_slash <== sum_plus + equal_slash.out * (in + 16);

    out <== sum_slash;
}

template Base64Decode(N) {
    var M = 4*((N+2)\3);
    signal input in[M];
    signal output out[N];

    component bits_in[M\4][4];
    component bits_out[M\4][3];
    component translate[M\4][4];

    var idx = 0;
    for (var i = 0; i < M; i += 4) {
        for (var j = 0; j < 3; j++) {
            bits_out[i\4][j] = Bits2Num(8);
        }

        for (var j = 0; j < 4; j++) {
            bits_in[i\4][j] = Num2Bits(6);
            translate[i\4][j] = Base64Lookup();
            translate[i\4][j].in <== in[i+j];
            translate[i\4][j].out ==> bits_in[i\4][j].in;
        }

        // Do the re-packing from four 6-bit words to three 8-bit words.
        for (var j = 0; j < 6; j++) {
            bits_out[i\4][0].in[j+2] <== bits_in[i\4][0].out[j];
        }
        bits_out[i\4][0].in[0] <== bits_in[i\4][1].out[4];
        bits_out[i\4][0].in[1] <== bits_in[i\4][1].out[5];

        for (var j = 0; j < 4; j++) {
            bits_out[i\4][1].in[j+4] <== bits_in[i\4][1].out[j];
        }
        for (var j = 0; j < 4; j++) {
            bits_out[i\4][1].in[j] <== bits_in[i\4][2].out[j+2];
        }

        bits_out[i\4][2].in[6] <== bits_in[i\4][2].out[0];
        bits_out[i\4][2].in[7] <== bits_in[i\4][2].out[1];
        for (var j = 0; j < 6; j++) {
            bits_out[i\4][2].in[j] <== bits_in[i\4][3].out[j];
        }

        for (var j = 0; j < 3; j++) {
            if (idx+j < N) {
                out[idx+j] <== bits_out[i\4][j].out;
            }
        }
        idx += 3;
    }
}
