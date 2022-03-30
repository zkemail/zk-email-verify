pragma circom 2.0.3;

include "../merkle.circom";
include "../group_sig.circom";

template RSAGroupSigVerifyMain(n, k, levels) {
    signal input signature[k];
    signal input modulus[k];
    signal input base_message[k];
    signal input payload;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input enableSignerId;
    signal input signerNamespace;

    component verifier = RSAGroupSigVerify(n, k, levels);
    for (var i = 0; i < k; i++) {
        verifier.signature[i] <== signature[i];
        verifier.modulus[i] <== modulus[i];
        verifier.base_message[i] <== base_message[i];
    }
    verifier.payload <== payload;
    verifier.root <== root;
    for (var i = 0; i < levels; i++) {
        verifier.pathElements[i] <== pathElements[i];
        verifier.pathIndices[i] <== pathIndices[i];
    }
    verifier.enableSignerId <== enableSignerId;
    verifier.signerNamespace <== signerNamespace;

    signal output hash_of_all_public;
    component all_public_hasher;
    all_public_hasher = Poseidon(6);
    component base_message_hasher;
    base_message_hasher = PoseidonK(k);
    for (var i = 0; i < k; i++) {
        base_message_hasher.inputs[i] <== base_message[i];
    }
    all_public_hasher.inputs[0] <== base_message_hasher.out;
    all_public_hasher.inputs[1] <== verifier.signerId;
    all_public_hasher.inputs[2] <== signerNamespace;
    all_public_hasher.inputs[3] <== payload;
    all_public_hasher.inputs[4] <== root;
    all_public_hasher.inputs[5] <== enableSignerId;
    hash_of_all_public <== all_public_hasher.out;
}

component main = RSAGroupSigVerifyMain(121, 34, 30);
