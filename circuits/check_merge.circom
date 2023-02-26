include "./regex_helpers.circom";

pragma circom 2.0.3;

include "./gates.circom";

template StrCmp(size) {
  signal input a[size];
  signal input b[size];
  signal output res;

  component m = MultiAND(size);
  for (var i = 0; i < size; i++) {
    // a[i] \ 256 === 0;
    // b[i] \ 256 === 0;
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

component main { public [ str, substr ] } = SubStrFixed(32, 5);
template MergeRegex (msg_bytes) {
    signal input msg[msg_bytes];
    signal input match_idx;
    signal output start_idx;
    signal output start_idx0;
    signal output group_match_count;
    signal output entire_count;