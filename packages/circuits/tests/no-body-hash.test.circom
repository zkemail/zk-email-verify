pragma circom 2.1.5;

include "../email-verifier.circom";

component main { public [ pubkey ] } = EmailVerifier(640, 768, 121, 17, 1);