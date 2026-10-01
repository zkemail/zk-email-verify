pragma circom 2.1.6;

include "../../email-verifier.circom";

// NOTE: 576 is deliberately not a power of two (see email-verifier-body-hash-index.test.ts).
component main { public [ pubkey ] } = EmailVerifier(576, 768, 121, 17, 0, 0, 0, 0);
