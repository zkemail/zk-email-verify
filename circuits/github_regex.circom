pragma circom 2.0.3;


include "./regex_helpers.circom";
template StrCmp(size) {
  signal input a[size];
  signal input b[size];
  signal output res;

  component m = MultiAND(size);
  for (var i = 0; i < size; i++) {
    // if a[i] == b[i] then input 1
    m.in[i] <== 1 - (a[i] - b[i]);
  }

  // if all a == b then input 1
  res <== m.out;
}


template SubStrFixed(str_size, substr_size) {
  signal input str[str_size];
  signal input substr[substr_size];
  signal output res;

  var N = str_size - substr_size;

  component m = MultiAND(N);
  component cmps[N];
  for (var i = 0; i < N; i++) {
    cmps[i] = StrCmp(substr_size);
    for (var j = 0; j < substr_size; j++) {
      cmps[i].a[j] <== str[i + j];
      cmps[i].b[j] <== substr[j];
    }
    // if substr != str[i:i+j] then output 1
    m.in[i] <== 1 - cmps[i].res;
  }

  // if substr not in str at all, then output 0
  res <== 1 - m.out;
}
//str = all those body_padded, substr = >&lt  , index shows the 
// starting index of plaintext. Hence match regex for 
template RegexWithPlain(msg_bytes, reveal_bytes, substr_bytes) {
  signal input msg[msg_bytes];
  signal input substr[substr_bytes];


// check plaintext
  component cmps = StrCmp(substr_bytes);
  for (var i = 0; i < substr_bytes; i++) {
      cmps.a[i] <== msg[i];
      cmps.b[i] <== substr[i];
    }
    cmps.res === 1;

// check regex and reveal
    // signal output start_idx;
    // signal output start_idx0;
    // signal output group_match_count;
    signal output entire_count;

    signal output reveal_shifted_intermediate[reveal_bytes][msg_bytes];
    signal output reveal_shifted[reveal_bytes];

    var num_bytes = msg_bytes-4;
    signal in[num_bytes];
    for (var i = 0; i < num_bytes; i++) {
        in[i] <== msg[i+4];
    }

    component eq[6][num_bytes];
    component lt[24][num_bytes];
    component and[18][num_bytes];
    component multi_or[6][num_bytes];
    signal states[num_bytes+1][5];
    
    for (var i = 0; i < num_bytes; i++) {
        states[i][0] <== 1;
    }
    for (var i = 1; i < 5; i++) {
        states[0][i] <== 0;
    }
    
    var match_group_indexes[2] = [1, 4];
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
        and[7][i].a <== states[i][2];
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
        //;
        eq[2][i] = IsEqual();
        eq[2][i].in[0] <== in[i];
        eq[2][i].in[1] <== 59;
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
        //UPPERCASE
        lt[12][i] = LessThan(8);
        lt[12][i].in[0] <== 64;
        lt[12][i].in[1] <== in[i];
        lt[13][i] = LessThan(8);
        lt[13][i].in[0] <== in[i];
        lt[13][i].in[1] <== 91;
        and[10][i] = AND();
        and[10][i].a <== lt[12][i].out;
        and[10][i].b <== lt[13][i].out;
        //lowercase
        lt[14][i] = LessThan(8);
        lt[14][i].in[0] <== 96;
        lt[14][i].in[1] <== in[i];
        lt[15][i] = LessThan(8);
        lt[15][i].in[0] <== in[i];
        lt[15][i].in[1] <== 123;
        and[11][i] = AND();
        and[11][i].a <== lt[14][i].out;
        and[11][i].b <== lt[15][i].out;
        //digits
        lt[16][i] = LessThan(8);
        lt[16][i].in[0] <== 47;
        lt[16][i].in[1] <== in[i];
        lt[17][i] = LessThan(8);
        lt[17][i].in[0] <== in[i];
        lt[17][i].in[1] <== 58;
        and[12][i] = AND();
        and[12][i].a <== lt[16][i].out;
        and[12][i].b <== lt[17][i].out;
        //_
        eq[4][i] = IsEqual();
        eq[4][i].in[0] <== in[i];
        eq[4][i].in[1] <== 95;
        and[13][i] = AND();
        and[13][i].a <== states[i][3];
        multi_or[3][i] = MultiOR(4);
        multi_or[3][i].in[0] <== and[10][i].out;
        multi_or[3][i].in[1] <== and[11][i].out;
        multi_or[3][i].in[2] <== and[12][i].out;
        multi_or[3][i].in[3] <== eq[4][i].out;
        and[13][i].b <== multi_or[3][i].out;
        //UPPERCASE
        lt[18][i] = LessThan(8);
        lt[18][i].in[0] <== 64;
        lt[18][i].in[1] <== in[i];
        lt[19][i] = LessThan(8);
        lt[19][i].in[0] <== in[i];
        lt[19][i].in[1] <== 91;
        and[14][i] = AND();
        and[14][i].a <== lt[18][i].out;
        and[14][i].b <== lt[19][i].out;
        //lowercase
        lt[20][i] = LessThan(8);
        lt[20][i].in[0] <== 96;
        lt[20][i].in[1] <== in[i];
        lt[21][i] = LessThan(8);
        lt[21][i].in[0] <== in[i];
        lt[21][i].in[1] <== 123;
        and[15][i] = AND();
        and[15][i].a <== lt[20][i].out;
        and[15][i].b <== lt[21][i].out;
        //digits
        lt[22][i] = LessThan(8);
        lt[22][i].in[0] <== 47;
        lt[22][i].in[1] <== in[i];
        lt[23][i] = LessThan(8);
        lt[23][i].in[0] <== in[i];
        lt[23][i].in[1] <== 58;
        and[16][i] = AND();
        and[16][i].a <== lt[22][i].out;
        and[16][i].b <== lt[23][i].out;
        //_
        eq[5][i] = IsEqual();
        eq[5][i].in[0] <== in[i];
        eq[5][i].in[1] <== 95;
        and[17][i] = AND();
        and[17][i].a <== states[i][4];
        multi_or[4][i] = MultiOR(4);
        multi_or[4][i].in[0] <== and[14][i].out;
        multi_or[4][i].in[1] <== and[15][i].out;
        multi_or[4][i].in[2] <== and[16][i].out;
        multi_or[4][i].in[3] <== eq[5][i].out;
        and[17][i].b <== multi_or[4][i].out;
        multi_or[5][i] = MultiOR(2);
        multi_or[5][i].in[0] <== and[13][i].out;
        multi_or[5][i].in[1] <== and[17][i].out;
        states[i+1][4] <== multi_or[5][i].out;
    }
    signal final_state_sum[num_bytes+1];
    final_state_sum[0] <== states[0][4];
    for (var i = 1; i <= num_bytes; i++) {
        final_state_sum[i] <== final_state_sum[i-1] + states[i][4];
    }
    entire_count <== final_state_sum[num_bytes];
    signal output reveal[num_bytes];
    for (var i = 0; i < num_bytes; i++) {
        reveal[i] <== in[i] * (states[i+1][match_group_indexes[0]]+states[i+1][3]+states[i+1][match_group_indexes[1]]);
        // log("in ",i, " is ", in[i]);
        // log("reveal ",i, " is ", reveal[i]);
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

    component matched_idx_eq[num_bytes];
    //use 0th group too
    component matched_idx_eq0[num_bytes];
    component matched_idx_eq0_5[num_bytes];

    for (var i = 0; i < num_bytes; i++) {
        if (i == 0) {
            count += states[1][match_group_indexes[1]];
            // use 0th group too
            count0+= states[1][match_group_indexes[0]];
            count0_5+= states[1][3];
        }
        else {
            check_start[i] = AND();
            check_start[i].a <== states[i + 1][match_group_indexes[1]];
            check_start[i].b <== 1 - states[i][match_group_indexes[1]];
            // use 0th group too 
            check_start0[i] = AND();
            check_start0[i].a <== states[i + 1][match_group_indexes[0]];
            check_start0[i].b <== 1 - states[i][match_group_indexes[0]];

            check_start0_5[i] = AND();
            check_start0_5[i].a <== states[i + 1][3];
            check_start0_5[i].b <== 1 - states[i][3];

            count += check_start[i].out;
            //use 0th group too
            count0 +=check_start0[i].out;
            count0_5 +=check_start0_5[i].out;

            check_match[i] = IsEqual();
            check_match[i].in[0] <== count;
            check_match[i].in[1] <==  1;
            //use 0th group too
            check_match0[i] = IsEqual();
            check_match0[i].in[0] <== count0;
            check_match0[i].in[1] <==  1;
            check_match0_5[i] = IsEqual();
            check_match0_5[i].in[0] <== count0_5;
            check_match0_5[i].in[1] <== 1;


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
        matched_idx_eq[i].in[0] <== states[i + 1][match_group_indexes[1]] * count;
        matched_idx_eq[i].in[1] <== 1;
        //use 0th group too
        matched_idx_eq0[i] = IsEqual();
        matched_idx_eq0[i].in[0] <== states[i + 1][match_group_indexes[0]] * count0;
        matched_idx_eq0[i].in[1] <== 1;
        matched_idx_eq0_5[i] = IsEqual();
        matched_idx_eq0_5[i].in[0] <== states[i + 1][3] * count0_5;
        matched_idx_eq0_5[i].in[1] <== 1;
    }

    // component match_start_idx[msg_bytes];
    // for (var i = 0; i < msg_bytes; i++) {
    //     match_start_idx[i] = IsEqual();
    //     match_start_idx[i].in[0] <== i;
    //     match_start_idx[i].in[1] <== start_index;
    // }

    //use 0th group too
    component match_start_idx0[num_bytes];
    for (var i = 0; i < num_bytes; i++) {
        match_start_idx0[i] = IsEqual();
        match_start_idx0[i].in[0] <== i;
        match_start_idx0[i].in[1] <== start_index0;
    }
    // component match_start_idx0_5[msg_bytes];
    // for (var i = 0; i < msg_bytes; i++) {
    //     match_start_idx0_5[i] = IsEqual();
    //     match_start_idx0_5[i].in[0] <== i;
    //     match_start_idx0_5[i].in[1] <== start_index0_5;
    // }

    signal reveal_match[num_bytes];
    for (var i = 0; i < num_bytes; i++) {
        reveal_match[i] <== (matched_idx_eq[i].out+matched_idx_eq0[i].out+matched_idx_eq0_5[i].out) * reveal[i];
        // log("rev match ",i," is ",reveal_match[i]);
    }

    for (var j = 0; j < reveal_bytes; j++) {
        reveal_shifted_intermediate[j][j] <== 0;
        for (var i = j + 1; i < num_bytes; i++) {
            // This shifts matched string back to the beginning. 
            reveal_shifted_intermediate[j][i] <== reveal_shifted_intermediate[j][i - 1] + match_start_idx0[i-j].out * reveal_match[i];
        }
        reveal_shifted[j] <== reveal_shifted_intermediate[j][num_bytes - 1];
        // log("rev shifted ",j, " is ",reveal_shifted[j]);
    }

}
