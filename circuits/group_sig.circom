pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "./rsa.circom";
include "./merkle.circom";

template RSAGroupSigVerify(n, k, levels) {
    component verifier = RSAVerify65537(n, k);
    signal input signature[k];
    signal input modulus[k];
    signal input base_message[k];
    signal input payload;
    signal payloadSquared;
    payloadSquared <== payload * payload;

    for (var i = 0; i < k; i++) {
        verifier.signature[i] <== signature[i];
        verifier.modulus[i] <== modulus[i];
        verifier.base_message[i] <== base_message[i];
    }

    component merkleChecker = MerkleTreeChecker(levels);
    signal leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // connect the two components; modulus (n x k bigint representation) must hash to leaf
    component leafPoseidonK = PoseidonK(k);
    for (var i = 0; i < k; i++) {
        leafPoseidonK.inputs[i] <== modulus[i];
    }
    leaf <== leafPoseidonK.out;
    merkleChecker.leaf <== leaf;
    merkleChecker.root <== root;
    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== pathElements[i];
        merkleChecker.pathIndices[i] <== pathIndices[i];
    }

    signal input enableSignerId;
    signal input signerNamespace;
    enableSignerId * (enableSignerId - 1) === 0;
    signerNamespace * (1 - enableSignerId) === 0;

    signal signerIdOpening;
    component privPoseidonK = PoseidonK(k);
    for (var i = 0; i < k; i++) {
        privPoseidonK.inputs[i] <== signature[i];
    }
    component nullifierOpeningPoseidon = Poseidon(2);
    nullifierOpeningPoseidon.inputs[0] <== privPoseidonK.out;
    nullifierOpeningPoseidon.inputs[1] <== signerNamespace;
    signerIdOpening <== nullifierOpeningPoseidon.out;
    log(signerIdOpening);

    signal output signerId;
    component signerIdPoseidon = Poseidon(2);
    signerIdPoseidon.inputs[0] <== leaf;
    signerIdPoseidon.inputs[1] <== signerIdOpening;
    signerId <== signerIdPoseidon.out * enableSignerId;
    log(signerId);
}

template RSAVerifySignerModulus(n, k) {
    signal input modulus[k];
    signal input base_message[k];
    signal input signature[k];
    signal input signerIdOpening;

    component verifier = RSAVerify65537(n, k);
    for (var i = 0; i < k; i++) {
        verifier.signature[i] <== signature[i];
        verifier.modulus[i] <== modulus[i];
        verifier.base_message[i] <== base_message[i];
    }

    component modulusPoseidonK = PoseidonK(k);
    for (var i = 0; i < k; i++) {
        modulusPoseidonK.inputs[i] <== modulus[i];
    }

    signal output signerId;
    component signerIdPoseidon = Poseidon(2);
    signerIdPoseidon.inputs[0] <== modulusPoseidonK.out;
    signerIdPoseidon.inputs[1] <== signerIdOpening;
    signerId <== signerIdPoseidon.out;
}
