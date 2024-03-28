pragma circom 2.1.5;

include "../helpers/sha.circom";

component main { public [in_padded, in_len_padded_bytes] } = Sha256Bytes(640);