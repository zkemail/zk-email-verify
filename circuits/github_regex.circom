pragma circom 2.0.3;

include "./regex_helpers.circom";

template GithubRegex (msg_bytes, reveal_bytes, group_idx) {
    signal input msg[msg_bytes];
    signal input match_idx;
    signal output start_idx;
    signal output start_idx0;
    signal output group_match_count;
    signal output entire_count;

    signal output reveal_shifted_intermediate[reveal_bytes][msg_bytes];
    signal output reveal_shifted[reveal_bytes];

    var num_bytes = msg_bytes;
    signal in[num_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        in[i] <== msg[i];
    }

    component eq[12][num_bytes];
    component lt[24][num_bytes];
    component and[24][num_bytes];
    component multi_or[6][num_bytes];
    signal states[num_bytes+1][11];
    
    for (var i = 0; i < num_bytes; i++) {
        states[i][0] <== 1;
    }
    for (var i = 1; i < 11; i++) {
        states[0][i] <== 0;
    }
    
    var match_group_indexes[2] = [1, 7];
    for (var i = 0; i < num_bytes; i++) {
        //UPPERCASE
        lt[0][i] = LessThan(8);
        lt[0][i].in[0] <== 64;
        lt[0][i].in[1] <== in[i];
        lt[1][i] = LessThan(8);
        lt[1][i].in[0] <== in[i];
        lt[1][i].in[1] <== 91;
        and[0][i] = AND();
        and[0][i].a <== lt[0][i].out;
        and[0][i].b <== lt[1][i].out;
        //lowercase
        lt[2][i] = LessThan(8);
        lt[2][i].in[0] <== 96;
        lt[2][i].in[1] <== in[i];
        lt[3][i] = LessThan(8);
        lt[3][i].in[0] <== in[i];
        lt[3][i].in[1] <== 123;
        and[1][i] = AND();
        and[1][i].a <== lt[2][i].out;
        and[1][i].b <== lt[3][i].out;
        //digits
        lt[4][i] = LessThan(8);
        lt[4][i].in[0] <== 47;
        lt[4][i].in[1] <== in[i];
        lt[5][i] = LessThan(8);
        lt[5][i].in[0] <== in[i];
        lt[5][i].in[1] <== 58;
        and[2][i] = AND();
        and[2][i].a <== lt[4][i].out;
        and[2][i].b <== lt[5][i].out;
        //_
        eq[0][i] = IsEqual();
        eq[0][i].in[0] <== in[i];
        eq[0][i].in[1] <== 95;
        and[3][i] = AND();
        and[3][i].a <== states[i][1];
        multi_or[0][i] = MultiOR(4);
        multi_or[0][i].in[0] <== and[0][i].out;
        multi_or[0][i].in[1] <== and[1][i].out;
        multi_or[0][i].in[2] <== and[2][i].out;
        multi_or[0][i].in[3] <== eq[0][i].out;
        and[3][i].b <== multi_or[0][i].out;
        //UPPERCASE
        lt[6][i] = LessThan(8);
        lt[6][i].in[0] <== 64;
        lt[6][i].in[1] <== in[i];
        lt[7][i] = LessThan(8);
        lt[7][i].in[0] <== in[i];
        lt[7][i].in[1] <== 91;
        and[4][i] = AND();
        and[4][i].a <== lt[6][i].out;
        and[4][i].b <== lt[7][i].out;
        //lowercase
        lt[8][i] = LessThan(8);
        lt[8][i].in[0] <== 96;
        lt[8][i].in[1] <== in[i];
        lt[9][i] = LessThan(8);
        lt[9][i].in[0] <== in[i];
        lt[9][i].in[1] <== 123;
        and[5][i] = AND();
        and[5][i].a <== lt[8][i].out;
        and[5][i].b <== lt[9][i].out;
        //digits
        lt[10][i] = LessThan(8);
        lt[10][i].in[0] <== 47;
        lt[10][i].in[1] <== in[i];
        lt[11][i] = LessThan(8);
        lt[11][i].in[0] <== in[i];
        lt[11][i].in[1] <== 58;
        and[6][i] = AND();
        and[6][i].a <== lt[10][i].out;
        and[6][i].b <== lt[11][i].out;
        //_
        eq[1][i] = IsEqual();
        eq[1][i].in[0] <== in[i];
        eq[1][i].in[1] <== 95;
        and[7][i] = AND();
        and[7][i].a <== states[i][10];
        multi_or[1][i] = MultiOR(4);
        multi_or[1][i].in[0] <== and[4][i].out;
        multi_or[1][i].in[1] <== and[5][i].out;
        multi_or[1][i].in[2] <== and[6][i].out;
        multi_or[1][i].in[3] <== eq[1][i].out;
        and[7][i].b <== multi_or[1][i].out;
        multi_or[2][i] = MultiOR(2);
        multi_or[2][i].in[0] <== and[3][i].out;
        multi_or[2][i].in[1] <== and[7][i].out;
        states[i+1][1] <== multi_or[2][i].out;
        //a
        eq[2][i] = IsEqual();
        eq[2][i].in[0] <== in[i];
        eq[2][i].in[1] <== 97;
        and[8][i] = AND();
        and[8][i].a <== states[i][0];
        and[8][i].b <== eq[2][i].out;
        states[i+1][2] <== and[8][i].out;
        ///
        eq[3][i] = IsEqual();
        eq[3][i].in[0] <== in[i];
        eq[3][i].in[1] <== 47;
        and[9][i] = AND();
        and[9][i].a <== states[i][1];
        and[9][i].b <== eq[3][i].out;
        states[i+1][3] <== and[9][i].out;
        //n
        eq[4][i] = IsEqual();
        eq[4][i].in[0] <== in[i];
        eq[4][i].in[1] <== 110;
        and[10][i] = AND();
        and[10][i].a <== states[i][2];
        and[10][i].b <== eq[4][i].out;
        states[i+1][4] <== and[10][i].out;
        //>
        eq[5][i] = IsEqual();
        eq[5][i].in[0] <== in[i];
        eq[5][i].in[1] <== 62;
        and[11][i] = AND();
        and[11][i].a <== states[i][4];
        and[11][i].b <== eq[5][i].out;
        states[i+1][5] <== and[11][i].out;
        //&
        eq[6][i] = IsEqual();
        eq[6][i].in[0] <== in[i];
        eq[6][i].in[1] <== 38;
        and[12][i] = AND();
        and[12][i].a <== states[i][5];
        and[12][i].b <== eq[6][i].out;
        states[i+1][6] <== and[12][i].out;
        //UPPERCASE
        lt[12][i] = LessThan(8);
        lt[12][i].in[0] <== 64;
        lt[12][i].in[1] <== in[i];
        lt[13][i] = LessThan(8);
        lt[13][i].in[0] <== in[i];
        lt[13][i].in[1] <== 91;
        and[13][i] = AND();
        and[13][i].a <== lt[12][i].out;
        and[13][i].b <== lt[13][i].out;
        //lowercase
        lt[14][i] = LessThan(8);
        lt[14][i].in[0] <== 96;
        lt[14][i].in[1] <== in[i];
        lt[15][i] = LessThan(8);
        lt[15][i].in[0] <== in[i];
        lt[15][i].in[1] <== 123;
        and[14][i] = AND();
        and[14][i].a <== lt[14][i].out;
        and[14][i].b <== lt[15][i].out;
        //digits
        lt[16][i] = LessThan(8);
        lt[16][i].in[0] <== 47;
        lt[16][i].in[1] <== in[i];
        lt[17][i] = LessThan(8);
        lt[17][i].in[0] <== in[i];
        lt[17][i].in[1] <== 58;
        and[15][i] = AND();
        and[15][i].a <== lt[16][i].out;
        and[15][i].b <== lt[17][i].out;
        //_
        eq[7][i] = IsEqual();
        eq[7][i].in[0] <== in[i];
        eq[7][i].in[1] <== 95;
        and[16][i] = AND();
        and[16][i].a <== states[i][3];
        multi_or[3][i] = MultiOR(4);
        multi_or[3][i].in[0] <== and[13][i].out;
        multi_or[3][i].in[1] <== and[14][i].out;
        multi_or[3][i].in[2] <== and[15][i].out;
        multi_or[3][i].in[3] <== eq[7][i].out;
        and[16][i].b <== multi_or[3][i].out;
        //UPPERCASE
        lt[18][i] = LessThan(8);
        lt[18][i].in[0] <== 64;
        lt[18][i].in[1] <== in[i];
        lt[19][i] = LessThan(8);
        lt[19][i].in[0] <== in[i];
        lt[19][i].in[1] <== 91;
        and[17][i] = AND();
        and[17][i].a <== lt[18][i].out;
        and[17][i].b <== lt[19][i].out;
        //lowercase
        lt[20][i] = LessThan(8);
        lt[20][i].in[0] <== 96;
        lt[20][i].in[1] <== in[i];
        lt[21][i] = LessThan(8);
        lt[21][i].in[0] <== in[i];
        lt[21][i].in[1] <== 123;
        and[18][i] = AND();
        and[18][i].a <== lt[20][i].out;
        and[18][i].b <== lt[21][i].out;
        //digits
        lt[22][i] = LessThan(8);
        lt[22][i].in[0] <== 47;
        lt[22][i].in[1] <== in[i];
        lt[23][i] = LessThan(8);
        lt[23][i].in[0] <== in[i];
        lt[23][i].in[1] <== 58;
        and[19][i] = AND();
        and[19][i].a <== lt[22][i].out;
        and[19][i].b <== lt[23][i].out;
        //_
        eq[8][i] = IsEqual();
        eq[8][i].in[0] <== in[i];
        eq[8][i].in[1] <== 95;
        and[20][i] = AND();
        and[20][i].a <== states[i][7];
        multi_or[4][i] = MultiOR(4);
        multi_or[4][i].in[0] <== and[17][i].out;
        multi_or[4][i].in[1] <== and[18][i].out;
        multi_or[4][i].in[2] <== and[19][i].out;
        multi_or[4][i].in[3] <== eq[8][i].out;
        and[20][i].b <== multi_or[4][i].out;
        multi_or[5][i] = MultiOR(2);
        multi_or[5][i].in[0] <== and[16][i].out;
        multi_or[5][i].in[1] <== and[20][i].out;
        states[i+1][7] <== multi_or[5][i].out;
        //l
        eq[9][i] = IsEqual();
        eq[9][i].in[0] <== in[i];
        eq[9][i].in[1] <== 108;
        and[21][i] = AND();
        and[21][i].a <== states[i][6];
        and[21][i].b <== eq[9][i].out;
        states[i+1][8] <== and[21][i].out;
        //t
        eq[10][i] = IsEqual();
        eq[10][i].in[0] <== in[i];
        eq[10][i].in[1] <== 116;
        and[22][i] = AND();
        and[22][i].a <== states[i][8];
        and[22][i].b <== eq[10][i].out;
        states[i+1][9] <== and[22][i].out;
        //;
        eq[11][i] = IsEqual();
        eq[11][i].in[0] <== in[i];
        eq[11][i].in[1] <== 59;
        and[23][i] = AND();
        and[23][i].a <== states[i][9];
        and[23][i].b <== eq[11][i].out;
        states[i+1][10] <== and[23][i].out;
    }
    signal final_state_sum[num_bytes+1];
    final_state_sum[0] <== states[0][10];
    for (var i = 1; i <= num_bytes; i++) {
        final_state_sum[i] <== final_state_sum[i-1] + states[i][10];
    }
    entire_count <== final_state_sum[num_bytes];
    signal output reveal[num_bytes];
    for (var i = 0; i < num_bytes; i++) {
        // use 0th group too, when using group index 1
        reveal[i] <== in[i] * (states[i+1][match_group_indexes[group_idx-1]]+states[i+1][3]+states[i+1][match_group_indexes[group_idx]]);
    }
    

    // a flag to indicate the start position of the match
    var start_index = 0;
    // use 0th group too
    var start_index0=0;
    var start_index0_5=0;
    // for counting the number of matches
    var count = 0;
    // use 0th group too
    var count0=0;
    var count0_5=0;

    // lengths to be consistent with states signal
    component check_start[num_bytes + 1];
    //use 0th group too
    component check_start0[num_bytes+1];
    component check_start0_5[num_bytes+1];
    component check_match[num_bytes + 1];
    //use 0th group too
    component check_match0[num_bytes+1];
    component check_match0_5[num_bytes+1];
    component check_matched_start[num_bytes + 1];
    //use 0th group too
    component check_matched_start0[num_bytes+1];
    component check_matched_start0_5[num_bytes+1];
    component matched_idx_eq[msg_bytes];
    //use 0th group too
    component matched_idx_eq0[msg_bytes];
    component matched_idx_eq0_5[msg_bytes];

    for (var i = 0; i < num_bytes; i++) {
        if (i == 0) {
            // use 0th group too
            count += states[1][match_group_indexes[group_idx]];
            // use 0th group too
            count0+= states[1][match_group_indexes[group_idx-1]];
            count0_5+= states[1][3];
        }
        else {
            check_start[i] = AND();
            check_start[i].a <== states[i + 1][match_group_indexes[group_idx]];
            check_start[i].b <== 1 - states[i][match_group_indexes[group_idx]];

            check_start0[i] = AND();
            check_start0[i].a <== states[i + 1][match_group_indexes[group_idx-1]];
            check_start0[i].b <== 1 - states[i][match_group_indexes[group_idx-1]];

            check_start0_5[i] = AND();
            check_start0_5[i].a <== states[i + 1][3];
            check_start0_5[i].b <== 1 - states[i][3];

            count += check_start[i].out;
            //use 0th group too
            count0 +=check_start0[i].out;
            count0_5 +=check_start0_5[i].out;

            check_match[i] = IsEqual();
            check_match[i].in[0] <== count;
            check_match[i].in[1] <== match_idx + 1;

            //use 0th group too
            check_match0[i] = IsEqual();
            check_match0[i].in[0] <== count0;
            check_match0[i].in[1] <== match_idx + 1;
            check_match0_5[i] = IsEqual();
            check_match0_5[i].in[0] <== count0_5;
            check_match0_5[i].in[1] <== match_idx + 1;

            check_matched_start[i] = AND();
            check_matched_start[i].a <== check_match[i].out;
            check_matched_start[i].b <== check_start[i].out;
            start_index += check_matched_start[i].out * i;
            
            //use 0th group too
            check_matched_start0[i] = AND();
            check_matched_start0[i].a <== check_match0[i].out;
            check_matched_start0[i].b <== check_start0[i].out;
            start_index0 += check_matched_start0[i].out * i;
            check_matched_start0_5[i] = AND();
            check_matched_start0_5[i].a <== check_match0_5[i].out;
            check_matched_start0_5[i].b <== check_start0_5[i].out;
            start_index0_5 += check_matched_start0_5[i].out * i;
        }

        matched_idx_eq[i] = IsEqual();
        matched_idx_eq[i].in[0] <== states[i + 1][match_group_indexes[group_idx]] * count;
        matched_idx_eq[i].in[1] <== match_idx + 1;

        //use 0th group too
        matched_idx_eq0[i] = IsEqual();
        matched_idx_eq0[i].in[0] <== states[i + 1][match_group_indexes[group_idx-1]] * count0;
        matched_idx_eq0[i].in[1] <== match_idx + 1;
        matched_idx_eq0_5[i] = IsEqual();
        matched_idx_eq0_5[i].in[0] <== states[i + 1][3] * count0_5;
        matched_idx_eq0_5[i].in[1] <== match_idx + 1;
    }

    component match_start_idx[msg_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        match_start_idx[i] = IsEqual();
        match_start_idx[i].in[0] <== i;
        match_start_idx[i].in[1] <== start_index;
    }
    //use 0th group too
    component match_start_idx0[msg_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        match_start_idx0[i] = IsEqual();
        match_start_idx0[i].in[0] <== i;
        match_start_idx0[i].in[1] <== start_index0;
    }
    component match_start_idx0_5[msg_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        match_start_idx0_5[i] = IsEqual();
        match_start_idx0_5[i].in[0] <== i;
        match_start_idx0_5[i].in[1] <== start_index0_5;
    }

    signal reveal_match[msg_bytes];
    for (var i = 0; i < msg_bytes; i++) {
        reveal_match[i] <== (matched_idx_eq[i].out+matched_idx_eq0[i].out+matched_idx_eq0_5[i].out) * reveal[i];
    }

    for (var j = 0; j < reveal_bytes; j++) {
        reveal_shifted_intermediate[j][j] <== 0;
        for (var i = j + 1; i < msg_bytes; i++) {
            // This shifts matched string back to the beginning. 
            reveal_shifted_intermediate[j][i] <== reveal_shifted_intermediate[j][i - 1] + match_start_idx0[i-j].out * reveal_match[i];
        }
        reveal_shifted[j] <== reveal_shifted_intermediate[j][msg_bytes - 1];
    }

    group_match_count <== count;
    start_idx <== start_index;
    start_idx0 <== start_index0;
}
