pragma circom 2.1.6;

include "../../utils/bytes.circom";

// Test circuit for 256 -> 2x128
component main = PackBits(256, 128);