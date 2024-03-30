pragma circom 2.1.6;

include "../../lib/rsa.circom";

component main { public [modulus] } = RSAVerifier65537(121, 17);