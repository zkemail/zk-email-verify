pragma circom 2.1.5;

include "./regex_helpers.circom";

// `   href=3D\"https://venmo.com/code\\?user_id=3D(0|1|2|3|4|5|6|7|8|9|\r|\n|=)+`
template VenmoSendId (msg_bytes) {
    signal input msg[msg_bytes];
    signal output out;

    var num_bytes = msg_bytes;
    signal in[num_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        in[i] <== msg[i];
    }

    component eq[50][num_bytes];
    component lt[4][num_bytes];
    component and[48][num_bytes];
    component multi_or[3][num_bytes];
    signal states[num_bytes+1][46];

    for (var i = 0; i < num_bytes; i++) {
        states[i][0] <== 1;
    }
    for (var i = 1; i < 46; i++) {
        states[0][i] <== 0;
    }

    for (var i = 0; i < num_bytes; i++) {
        lt[0][i] = LessThan(8);
        lt[0][i].in[0] <== 47;
        lt[0][i].in[1] <== in[i];
        
        lt[1][i] = LessThan(8);
        lt[1][i].in[0] <== in[i];
        lt[1][i].in[1] <== 58;
        
        and[0][i] = AND();
        and[0][i].a <== lt[0][i].out;
        and[0][i].b <== lt[1][i].out;
        
        eq[0][i] = IsEqual();
        eq[0][i].in[0] <== in[i];
        eq[0][i].in[1] <== 61;
        
        eq[1][i] = IsEqual();
        eq[1][i].in[0] <== in[i];
        eq[1][i].in[1] <== 13;
        
        eq[2][i] = IsEqual();
        eq[2][i].in[0] <== in[i];
        eq[2][i].in[1] <== 10;
        
        and[1][i] = AND();
        and[1][i].a <== states[i][1];
        multi_or[0][i] = MultiOR(4);
        multi_or[0][i].in[0] <== and[0][i].out;
        multi_or[0][i].in[1] <== eq[0][i].out;
        multi_or[0][i].in[2] <== eq[1][i].out;
        multi_or[0][i].in[3] <== eq[2][i].out;
        and[1][i].b <== multi_or[0][i].out;
        
        lt[2][i] = LessThan(8);
        lt[2][i].in[0] <== 47;
        lt[2][i].in[1] <== in[i];
        
        lt[3][i] = LessThan(8);
        lt[3][i].in[0] <== in[i];
        lt[3][i].in[1] <== 58;
        
        and[2][i] = AND();
        and[2][i].a <== lt[2][i].out;
        and[2][i].b <== lt[3][i].out;
        
        eq[3][i] = IsEqual();
        eq[3][i].in[0] <== in[i];
        eq[3][i].in[1] <== 61;
        
        eq[4][i] = IsEqual();
        eq[4][i].in[0] <== in[i];
        eq[4][i].in[1] <== 13;
        
        eq[5][i] = IsEqual();
        eq[5][i].in[0] <== in[i];
        eq[5][i].in[1] <== 10;
        
        and[3][i] = AND();
        and[3][i].a <== states[i][45];
        multi_or[1][i] = MultiOR(4);
        multi_or[1][i].in[0] <== and[2][i].out;
        multi_or[1][i].in[1] <== eq[3][i].out;
        multi_or[1][i].in[2] <== eq[4][i].out;
        multi_or[1][i].in[3] <== eq[5][i].out;
        and[3][i].b <== multi_or[1][i].out;
        
        multi_or[2][i] = MultiOR(2);
        multi_or[2][i].in[0] <== and[1][i].out;
        multi_or[2][i].in[1] <== and[3][i].out;
        states[i+1][1] <== multi_or[2][i].out;
        // space
        eq[6][i] = IsEqual();
        eq[6][i].in[0] <== in[i];
        eq[6][i].in[1] <== 32;
        and[4][i] = AND();
        and[4][i].a <== states[i][0];
        and[4][i].b <== eq[6][i].out;
        states[i+1][2] <== and[4][i].out;
        // space
        eq[7][i] = IsEqual();
        eq[7][i].in[0] <== in[i];
        eq[7][i].in[1] <== 32;
        and[5][i] = AND();
        and[5][i].a <== states[i][2];
        and[5][i].b <== eq[7][i].out;
        states[i+1][3] <== and[5][i].out;
        // space
        eq[8][i] = IsEqual();
        eq[8][i].in[0] <== in[i];
        eq[8][i].in[1] <== 32;
        and[6][i] = AND();
        and[6][i].a <== states[i][3];
        and[6][i].b <== eq[8][i].out;
        states[i+1][4] <== and[6][i].out;
        // h
        eq[9][i] = IsEqual();
        eq[9][i].in[0] <== in[i];
        eq[9][i].in[1] <== 104;
        and[7][i] = AND();
        and[7][i].a <== states[i][4];
        and[7][i].b <== eq[9][i].out;
        states[i+1][5] <== and[7][i].out;
        // r
        eq[10][i] = IsEqual();
        eq[10][i].in[0] <== in[i];
        eq[10][i].in[1] <== 114;
        and[8][i] = AND();
        and[8][i].a <== states[i][5];
        and[8][i].b <== eq[10][i].out;
        states[i+1][6] <== and[8][i].out;
        // e
        eq[11][i] = IsEqual();
        eq[11][i].in[0] <== in[i];
        eq[11][i].in[1] <== 101;
        and[9][i] = AND();
        and[9][i].a <== states[i][6];
        and[9][i].b <== eq[11][i].out;
        states[i+1][7] <== and[9][i].out;
        // f
        eq[12][i] = IsEqual();
        eq[12][i].in[0] <== in[i];
        eq[12][i].in[1] <== 102;
        and[10][i] = AND();
        and[10][i].a <== states[i][7];
        and[10][i].b <== eq[12][i].out;
        states[i+1][8] <== and[10][i].out;
        // =
        eq[13][i] = IsEqual();
        eq[13][i].in[0] <== in[i];
        eq[13][i].in[1] <== 61;
        and[11][i] = AND();
        and[11][i].a <== states[i][8];
        and[11][i].b <== eq[13][i].out;
        states[i+1][9] <== and[11][i].out;
        // 3
        eq[14][i] = IsEqual();
        eq[14][i].in[0] <== in[i];
        eq[14][i].in[1] <== 51;
        and[12][i] = AND();
        and[12][i].a <== states[i][9];
        and[12][i].b <== eq[14][i].out;
        states[i+1][10] <== and[12][i].out;
        // D
        eq[15][i] = IsEqual();
        eq[15][i].in[0] <== in[i];
        eq[15][i].in[1] <== 68;
        and[13][i] = AND();
        and[13][i].a <== states[i][10];
        and[13][i].b <== eq[15][i].out;
        states[i+1][11] <== and[13][i].out;
        // '"'
        eq[16][i] = IsEqual();
        eq[16][i].in[0] <== in[i];
        eq[16][i].in[1] <== 34;
        and[14][i] = AND();
        and[14][i].a <== states[i][11];
        and[14][i].b <== eq[16][i].out;
        states[i+1][12] <== and[14][i].out;
        // h
        eq[17][i] = IsEqual();
        eq[17][i].in[0] <== in[i];
        eq[17][i].in[1] <== 104;
        and[15][i] = AND();
        and[15][i].a <== states[i][12];
        and[15][i].b <== eq[17][i].out;
        states[i+1][13] <== and[15][i].out;
        // t
        eq[18][i] = IsEqual();
        eq[18][i].in[0] <== in[i];
        eq[18][i].in[1] <== 116;
        and[16][i] = AND();
        and[16][i].a <== states[i][13];
        and[16][i].b <== eq[18][i].out;
        states[i+1][14] <== and[16][i].out;
        // t
        eq[19][i] = IsEqual();
        eq[19][i].in[0] <== in[i];
        eq[19][i].in[1] <== 116;
        and[17][i] = AND();
        and[17][i].a <== states[i][14];
        and[17][i].b <== eq[19][i].out;
        states[i+1][15] <== and[17][i].out;
        // p
        eq[20][i] = IsEqual();
        eq[20][i].in[0] <== in[i];
        eq[20][i].in[1] <== 112;
        and[18][i] = AND();
        and[18][i].a <== states[i][15];
        and[18][i].b <== eq[20][i].out;
        states[i+1][16] <== and[18][i].out;
        // s
        eq[21][i] = IsEqual();
        eq[21][i].in[0] <== in[i];
        eq[21][i].in[1] <== 115;
        and[19][i] = AND();
        and[19][i].a <== states[i][16];
        and[19][i].b <== eq[21][i].out;
        states[i+1][17] <== and[19][i].out;
        // :
        eq[22][i] = IsEqual();
        eq[22][i].in[0] <== in[i];
        eq[22][i].in[1] <== 58;
        and[20][i] = AND();
        and[20][i].a <== states[i][17];
        and[20][i].b <== eq[22][i].out;
        states[i+1][18] <== and[20][i].out;
        // .
        eq[23][i] = IsEqual();
        eq[23][i].in[0] <== in[i];
        eq[23][i].in[1] <== 47;
        and[21][i] = AND();
        and[21][i].a <== states[i][18];
        and[21][i].b <== eq[23][i].out;
        states[i+1][19] <== and[21][i].out;
        // /
        eq[24][i] = IsEqual();
        eq[24][i].in[0] <== in[i];
        eq[24][i].in[1] <== 47;
        and[22][i] = AND();
        and[22][i].a <== states[i][19];
        and[22][i].b <== eq[24][i].out;
        states[i+1][20] <== and[22][i].out;
        // v
        eq[25][i] = IsEqual();
        eq[25][i].in[0] <== in[i];
        eq[25][i].in[1] <== 118;
        and[23][i] = AND();
        and[23][i].a <== states[i][20];
        and[23][i].b <== eq[25][i].out;
        states[i+1][21] <== and[23][i].out;
        // e
        eq[26][i] = IsEqual();
        eq[26][i].in[0] <== in[i];
        eq[26][i].in[1] <== 101;
        and[24][i] = AND();
        and[24][i].a <== states[i][21];
        and[24][i].b <== eq[26][i].out;
        states[i+1][22] <== and[24][i].out;
        // n
        eq[27][i] = IsEqual();
        eq[27][i].in[0] <== in[i];
        eq[27][i].in[1] <== 110;
        and[25][i] = AND();
        and[25][i].a <== states[i][22];
        and[25][i].b <== eq[27][i].out;
        states[i+1][23] <== and[25][i].out;
        // m
        eq[28][i] = IsEqual();
        eq[28][i].in[0] <== in[i];
        eq[28][i].in[1] <== 109;
        and[26][i] = AND();
        and[26][i].a <== states[i][23];
        and[26][i].b <== eq[28][i].out;
        states[i+1][24] <== and[26][i].out;
        // o
        eq[29][i] = IsEqual();
        eq[29][i].in[0] <== in[i];
        eq[29][i].in[1] <== 111;
        and[27][i] = AND();
        and[27][i].a <== states[i][24];
        and[27][i].b <== eq[29][i].out;
        states[i+1][25] <== and[27][i].out;
        // .
        eq[30][i] = IsEqual();
        eq[30][i].in[0] <== in[i];
        eq[30][i].in[1] <== 46;
        and[28][i] = AND();
        and[28][i].a <== states[i][25];
        and[28][i].b <== eq[30][i].out;
        states[i+1][26] <== and[28][i].out;
        // c
        eq[31][i] = IsEqual();
        eq[31][i].in[0] <== in[i];
        eq[31][i].in[1] <== 99;
        and[29][i] = AND();
        and[29][i].a <== states[i][26];
        and[29][i].b <== eq[31][i].out;
        states[i+1][27] <== and[29][i].out;
        // o
        eq[32][i] = IsEqual();
        eq[32][i].in[0] <== in[i];
        eq[32][i].in[1] <== 111;
        and[30][i] = AND();
        and[30][i].a <== states[i][27];
        and[30][i].b <== eq[32][i].out;
        states[i+1][28] <== and[30][i].out;
        // m
        eq[33][i] = IsEqual();
        eq[33][i].in[0] <== in[i];
        eq[33][i].in[1] <== 109;
        and[31][i] = AND();
        and[31][i].a <== states[i][28];
        and[31][i].b <== eq[33][i].out;
        states[i+1][29] <== and[31][i].out;
        // /
        eq[34][i] = IsEqual();
        eq[34][i].in[0] <== in[i];
        eq[34][i].in[1] <== 47;
        and[32][i] = AND();
        and[32][i].a <== states[i][29];
        and[32][i].b <== eq[34][i].out;
        states[i+1][30] <== and[32][i].out;
        // c
        eq[35][i] = IsEqual();
        eq[35][i].in[0] <== in[i];
        eq[35][i].in[1] <== 99;
        and[33][i] = AND();
        and[33][i].a <== states[i][30];
        and[33][i].b <== eq[35][i].out;
        states[i+1][31] <== and[33][i].out;
        // o
        eq[36][i] = IsEqual();
        eq[36][i].in[0] <== in[i];
        eq[36][i].in[1] <== 111;
        and[34][i] = AND();
        and[34][i].a <== states[i][31];
        and[34][i].b <== eq[36][i].out;
        states[i+1][32] <== and[34][i].out;
        // d
        eq[37][i] = IsEqual();
        eq[37][i].in[0] <== in[i];
        eq[37][i].in[1] <== 100;
        and[35][i] = AND();
        and[35][i].a <== states[i][32];
        and[35][i].b <== eq[37][i].out;
        states[i+1][33] <== and[35][i].out;
        // e
        eq[38][i] = IsEqual();
        eq[38][i].in[0] <== in[i];
        eq[38][i].in[1] <== 101;
        and[36][i] = AND();
        and[36][i].a <== states[i][33];
        and[36][i].b <== eq[38][i].out;
        states[i+1][34] <== and[36][i].out;
        // ?
        eq[39][i] = IsEqual();
        eq[39][i].in[0] <== in[i];
        eq[39][i].in[1] <== 63;
        and[37][i] = AND();
        and[37][i].a <== states[i][34];
        and[37][i].b <== eq[39][i].out;
        states[i+1][35] <== and[37][i].out;
        // u
        eq[40][i] = IsEqual();
        eq[40][i].in[0] <== in[i];
        eq[40][i].in[1] <== 117;
        and[38][i] = AND();
        and[38][i].a <== states[i][35];
        and[38][i].b <== eq[40][i].out;
        states[i+1][36] <== and[38][i].out;
        // s
        eq[41][i] = IsEqual();
        eq[41][i].in[0] <== in[i];
        eq[41][i].in[1] <== 115;
        and[39][i] = AND();
        and[39][i].a <== states[i][36];
        and[39][i].b <== eq[41][i].out;
        states[i+1][37] <== and[39][i].out;
        // e
        eq[42][i] = IsEqual();
        eq[42][i].in[0] <== in[i];
        eq[42][i].in[1] <== 101;
        and[40][i] = AND();
        and[40][i].a <== states[i][37];
        and[40][i].b <== eq[42][i].out;
        states[i+1][38] <== and[40][i].out;
        // r
        eq[43][i] = IsEqual();
        eq[43][i].in[0] <== in[i];
        eq[43][i].in[1] <== 114;
        and[41][i] = AND();
        and[41][i].a <== states[i][38];
        and[41][i].b <== eq[43][i].out;
        states[i+1][39] <== and[41][i].out;
        // _
        eq[44][i] = IsEqual();
        eq[44][i].in[0] <== in[i];
        eq[44][i].in[1] <== 95;
        and[42][i] = AND();
        and[42][i].a <== states[i][39];
        and[42][i].b <== eq[44][i].out;
        states[i+1][40] <== and[42][i].out;
        // i
        eq[45][i] = IsEqual();
        eq[45][i].in[0] <== in[i];
        eq[45][i].in[1] <== 105;
        and[43][i] = AND();
        and[43][i].a <== states[i][40];
        and[43][i].b <== eq[45][i].out;
        states[i+1][41] <== and[43][i].out;
        // d
        eq[46][i] = IsEqual();
        eq[46][i].in[0] <== in[i];
        eq[46][i].in[1] <== 100;
        and[44][i] = AND();
        and[44][i].a <== states[i][41];
        and[44][i].b <== eq[46][i].out;
        states[i+1][42] <== and[44][i].out;
        // =
        eq[47][i] = IsEqual();
        eq[47][i].in[0] <== in[i];
        eq[47][i].in[1] <== 61;
        and[45][i] = AND();
        and[45][i].a <== states[i][42];
        and[45][i].b <== eq[47][i].out;
        states[i+1][43] <== and[45][i].out;
        // 3
        eq[48][i] = IsEqual();
        eq[48][i].in[0] <== in[i];
        eq[48][i].in[1] <== 51;
        and[46][i] = AND();
        and[46][i].a <== states[i][43];
        and[46][i].b <== eq[48][i].out;
        states[i+1][44] <== and[46][i].out;
        // D
        eq[49][i] = IsEqual();
        eq[49][i].in[0] <== in[i];
        eq[49][i].in[1] <== 68;
        and[47][i] = AND();
        and[47][i].a <== states[i][44];
        and[47][i].b <== eq[49][i].out;
        states[i+1][45] <== and[47][i].out;
    }

    signal final_state_sum[num_bytes+1];
    final_state_sum[0] <== states[0][1];
    for (var i = 1; i <= num_bytes; i++) {
        final_state_sum[i] <== final_state_sum[i-1] + states[i][1];
    }
    out <== final_state_sum[num_bytes];

    signal output reveal[num_bytes];
    for (var i = 0; i < num_bytes; i++) {
        reveal[i] <== in[i] * states[i+1][1];
    }
}
