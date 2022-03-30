pragma circom 2.0.3;

include "../merkle.circom";
include "../group_sig.circom";

template RSAVerifySignerModulusMain(n, k) {
    signal input modulus[k];
    signal input base_message[k];
    signal input signature[k];

    signal input signerIdOpening;

    component verifier = RSAVerifySignerModulus(n, k);
    for (var i = 0; i < k; i++) {
        verifier.modulus[i] <== modulus[i];
        verifier.base_message[i] <== base_message[i];
        verifier.signature[i] <== signature[i];
    }
    verifier.signerIdOpening <== signerIdOpening;

    signal output hash_of_all_public;
    component all_public_hasher;
    all_public_hasher = Poseidon(2);
    component base_message_hasher;
    base_message_hasher = PoseidonK(k);
    for (var i = 0; i < k; i++) {
        base_message_hasher.inputs[i] <== base_message[i];
    }
    all_public_hasher.inputs[0] <== base_message_hasher.out;
    all_public_hasher.inputs[1] <== verifier.signerId;
    hash_of_all_public <== all_public_hasher.out;
}

component main = RSAVerifySignerModulusMain(121, 34);
