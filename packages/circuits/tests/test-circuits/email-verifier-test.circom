pragma circom 2.1.6;

include "../../email-verifier.circom";

component main { public [ pubkey ] } = EmailVerifier(640, 768, 121, 17, 1, 0, 0, 0);
