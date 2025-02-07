pragma circom 2.1.6;

include "../../utils/bytes.circom";

// Pack 10 bits into 3-bit chunks
component main = PackBits(10, 3);