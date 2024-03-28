pragma circom 2.1.5;

include "../../lib/sha.circom";

component main { public [paddedIn, paddedInLength] } = Sha256Bytes(640);
