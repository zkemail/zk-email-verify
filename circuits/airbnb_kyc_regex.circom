pragma circom 2.0.3;

include "./regex_helpers.circom";

template AirbnbKYCRegex (msg_bytes) {
    signal input msg[msg_bytes];
    signal output out;
    
    var num_bytes = msg_bytes;
    signal in[num_bytes];
    for (var i = 0; i < msg_bytes; i++) {
            in[i] <== msg[i];
    }

	component eq[36][num_bytes];
	component and[36][num_bytes];
	signal states[num_bytes+1][37];

	for (var i = 0; i < num_bytes; i++) {
        states[i][0] <== 1;
	}
	for (var i = 1; i < 37; i++) {
        states[0][i] <== 0;
	}

	for (var i = 0; i < num_bytes; i++) {
        eq[0][i] = IsEqual();
        eq[0][i].in[0] <== in[i];
        eq[0][i].in[1] <== 118;
        and[0][i] = AND();
        and[0][i].a <== states[i][36];
        and[0][i].b <== eq[0][i].out;
        states[i+1][1] <== and[0][i].out;
        eq[1][i] = IsEqual();
        eq[1][i].in[0] <== in[i];
        eq[1][i].in[1] <== 101;
        and[1][i] = AND();
        and[1][i].a <== states[i][1];
        and[1][i].b <== eq[1][i].out;
        states[i+1][2] <== and[1][i].out;
        eq[2][i] = IsEqual();
        eq[2][i].in[0] <== in[i];
        eq[2][i].in[1] <== 114;
        and[2][i] = AND();
        and[2][i].a <== states[i][2];
        and[2][i].b <== eq[2][i].out;
        states[i+1][3] <== and[2][i].out;
        eq[3][i] = IsEqual();
        eq[3][i].in[0] <== in[i];
        eq[3][i].in[1] <== 110;
        and[3][i] = AND();
        and[3][i].a <== states[i][3];
        and[3][i].b <== eq[3][i].out;
        states[i+1][4] <== and[3][i].out;
        eq[4][i] = IsEqual();
        eq[4][i].in[0] <== in[i];
        eq[4][i].in[1] <== 109;
        and[4][i] = AND();
        and[4][i].a <== states[i][4];
        and[4][i].b <== eq[4][i].out;
        states[i+1][5] <== and[4][i].out;
        eq[5][i] = IsEqual();
        eq[5][i].in[0] <== in[i];
        eq[5][i].in[1] <== 101;
        and[5][i] = AND();
        and[5][i].a <== states[i][5];
        and[5][i].b <== eq[5][i].out;
        states[i+1][6] <== and[5][i].out;
        eq[6][i] = IsEqual();
        eq[6][i].in[0] <== in[i];
        eq[6][i].in[1] <== 110;
        and[6][i] = AND();
        and[6][i].a <== states[i][6];
        and[6][i].b <== eq[6][i].out;
        states[i+1][7] <== and[6][i].out;
        eq[7][i] = IsEqual();
        eq[7][i].in[0] <== in[i];
        eq[7][i].in[1] <== 116;
        and[7][i] = AND();
        and[7][i].a <== states[i][7];
        and[7][i].b <== eq[7][i].out;
        states[i+1][8] <== and[7][i].out;
        eq[8][i] = IsEqual();
        eq[8][i].in[0] <== in[i];
        eq[8][i].in[1] <== 32;
        and[8][i] = AND();
        and[8][i].a <== states[i][8];
        and[8][i].b <== eq[8][i].out;
        states[i+1][9] <== and[8][i].out;
        eq[9][i] = IsEqual();
        eq[9][i].in[0] <== in[i];
        eq[9][i].in[1] <== 73;
        and[9][i] = AND();
        and[9][i].a <== states[i][9];
        and[9][i].b <== eq[9][i].out;
        states[i+1][10] <== and[9][i].out;
        eq[10][i] = IsEqual();
        eq[10][i].in[0] <== in[i];
        eq[10][i].in[1] <== 68;
        and[10][i] = AND();
        and[10][i].a <== states[i][10];
        and[10][i].b <== eq[10][i].out;
        states[i+1][11] <== and[10][i].out;
        eq[11][i] = IsEqual();
        eq[11][i].in[0] <== in[i];
        eq[11][i].in[1] <== 84;
        and[11][i] = AND();
        and[11][i].a <== states[i][0];
        and[11][i].b <== eq[11][i].out;
        states[i+1][12] <== and[11][i].out;
        eq[12][i] = IsEqual();
        eq[12][i].in[0] <== in[i];
        eq[12][i].in[1] <== 104;
        and[12][i] = AND();
        and[12][i].a <== states[i][12];
        and[12][i].b <== eq[12][i].out;
        states[i+1][13] <== and[12][i].out;
        eq[13][i] = IsEqual();
        eq[13][i].in[0] <== in[i];
        eq[13][i].in[1] <== 97;
        and[13][i] = AND();
        and[13][i].a <== states[i][13];
        and[13][i].b <== eq[13][i].out;
        states[i+1][14] <== and[13][i].out;
        eq[14][i] = IsEqual();
        eq[14][i].in[0] <== in[i];
        eq[14][i].in[1] <== 110;
        and[14][i] = AND();
        and[14][i].a <== states[i][14];
        and[14][i].b <== eq[14][i].out;
        states[i+1][15] <== and[14][i].out;
        eq[15][i] = IsEqual();
        eq[15][i].in[0] <== in[i];
        eq[15][i].in[1] <== 107;
        and[15][i] = AND();
        and[15][i].a <== states[i][15];
        and[15][i].b <== eq[15][i].out;
        states[i+1][16] <== and[15][i].out;
        eq[16][i] = IsEqual();
        eq[16][i].in[0] <== in[i];
        eq[16][i].in[1] <== 115;
        and[16][i] = AND();
        and[16][i].a <== states[i][16];
        and[16][i].b <== eq[16][i].out;
        states[i+1][17] <== and[16][i].out;
        eq[17][i] = IsEqual();
        eq[17][i].in[0] <== in[i];
        eq[17][i].in[1] <== 32;
        and[17][i] = AND();
        and[17][i].a <== states[i][17];
        and[17][i].b <== eq[17][i].out;
        states[i+1][18] <== and[17][i].out;
        eq[18][i] = IsEqual();
        eq[18][i].in[0] <== in[i];
        eq[18][i].in[1] <== 102;
        and[18][i] = AND();
        and[18][i].a <== states[i][18];
        and[18][i].b <== eq[18][i].out;
        states[i+1][19] <== and[18][i].out;
        eq[19][i] = IsEqual();
        eq[19][i].in[0] <== in[i];
        eq[19][i].in[1] <== 111;
        and[19][i] = AND();
        and[19][i].a <== states[i][19];
        and[19][i].b <== eq[19][i].out;
        states[i+1][20] <== and[19][i].out;
        eq[20][i] = IsEqual();
        eq[20][i].in[0] <== in[i];
        eq[20][i].in[1] <== 114;
        and[20][i] = AND();
        and[20][i].a <== states[i][20];
        and[20][i].b <== eq[20][i].out;
        states[i+1][21] <== and[20][i].out;
        eq[21][i] = IsEqual();
        eq[21][i].in[0] <== in[i];
        eq[21][i].in[1] <== 32;
        and[21][i] = AND();
        and[21][i].a <== states[i][21];
        and[21][i].b <== eq[21][i].out;
        states[i+1][22] <== and[21][i].out;
        eq[22][i] = IsEqual();
        eq[22][i].in[0] <== in[i];
        eq[22][i].in[1] <== 112;
        and[22][i] = AND();
        and[22][i].a <== states[i][22];
        and[22][i].b <== eq[22][i].out;
        states[i+1][23] <== and[22][i].out;
        eq[23][i] = IsEqual();
        eq[23][i].in[0] <== in[i];
        eq[23][i].in[1] <== 114;
        and[23][i] = AND();
        and[23][i].a <== states[i][23];
        and[23][i].b <== eq[23][i].out;
        states[i+1][24] <== and[23][i].out;
        eq[24][i] = IsEqual();
        eq[24][i].in[0] <== in[i];
        eq[24][i].in[1] <== 111;
        and[24][i] = AND();
        and[24][i].a <== states[i][24];
        and[24][i].b <== eq[24][i].out;
        states[i+1][25] <== and[24][i].out;
        eq[25][i] = IsEqual();
        eq[25][i].in[0] <== in[i];
        eq[25][i].in[1] <== 118;
        and[25][i] = AND();
        and[25][i].a <== states[i][25];
        and[25][i].b <== eq[25][i].out;
        states[i+1][26] <== and[25][i].out;
        eq[26][i] = IsEqual();
        eq[26][i].in[0] <== in[i];
        eq[26][i].in[1] <== 105;
        and[26][i] = AND();
        and[26][i].a <== states[i][26];
        and[26][i].b <== eq[26][i].out;
        states[i+1][27] <== and[26][i].out;
        eq[27][i] = IsEqual();
        eq[27][i].in[0] <== in[i];
        eq[27][i].in[1] <== 100;
        and[27][i] = AND();
        and[27][i].a <== states[i][27];
        and[27][i].b <== eq[27][i].out;
        states[i+1][28] <== and[27][i].out;
        eq[28][i] = IsEqual();
        eq[28][i].in[0] <== in[i];
        eq[28][i].in[1] <== 105;
        and[28][i] = AND();
        and[28][i].a <== states[i][28];
        and[28][i].b <== eq[28][i].out;
        states[i+1][29] <== and[28][i].out;
        eq[29][i] = IsEqual();
        eq[29][i].in[0] <== in[i];
        eq[29][i].in[1] <== 110;
        and[29][i] = AND();
        and[29][i].a <== states[i][29];
        and[29][i].b <== eq[29][i].out;
        states[i+1][30] <== and[29][i].out;
        eq[30][i] = IsEqual();
        eq[30][i].in[0] <== in[i];
        eq[30][i].in[1] <== 103;
        and[30][i] = AND();
        and[30][i].a <== states[i][30];
        and[30][i].b <== eq[30][i].out;
        states[i+1][31] <== and[30][i].out;
        eq[31][i] = IsEqual();
        eq[31][i].in[0] <== in[i];
        eq[31][i].in[1] <== 32;
        and[31][i] = AND();
        and[31][i].a <== states[i][31];
        and[31][i].b <== eq[31][i].out;
        states[i+1][32] <== and[31][i].out;
        eq[32][i] = IsEqual();
        eq[32][i].in[0] <== in[i];
        eq[32][i].in[1] <== 97;
        and[32][i] = AND();
        and[32][i].a <== states[i][32];
        and[32][i].b <== eq[32][i].out;
        states[i+1][33] <== and[32][i].out;
        eq[33][i] = IsEqual();
        eq[33][i].in[0] <== in[i];
        eq[33][i].in[1] <== 32;
        and[33][i] = AND();
        and[33][i].a <== states[i][33];
        and[33][i].b <== eq[33][i].out;
        states[i+1][34] <== and[33][i].out;
        eq[34][i] = IsEqual();
        eq[34][i].in[0] <== in[i];
        eq[34][i].in[1] <== 103;
        and[34][i] = AND();
        and[34][i].a <== states[i][34];
        and[34][i].b <== eq[34][i].out;
        states[i+1][35] <== and[34][i].out;
        eq[35][i] = IsEqual();
        eq[35][i].in[0] <== in[i];
        eq[35][i].in[1] <== 111;
        and[35][i] = AND();
        and[35][i].a <== states[i][35];
        and[35][i].b <== eq[35][i].out;
        states[i+1][36] <== and[35][i].out;
	}

	signal final_state_sum[num_bytes+1];
	final_state_sum[0] <== states[0][11];
	for (var i = 1; i <= num_bytes; i++) {
        final_state_sum[i] <== final_state_sum[i-1] + states[i][11];
	}
	out <== final_state_sum[num_bytes];
}