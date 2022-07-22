pragma circom 2.0.2;

include "../circuits/dizkus.circom";

component main {public [root, msghash]} = Dizkus(64, 4, 30);