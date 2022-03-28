pragma circom 2.0.3;

include "circomlib/poseidon.circom";
include "https://github.com/0xPARC/circom-secp256k1/blob/master/circuits/bigint.circom";

template RSAVerify(n, k) { // bignum: each word is n-bit, k words
    signal input signature[k];
    signal input modulus[k];
    signal input message[k];
    component doublers[16];
    component adder = BigMultModP(n, k);

    // message = signature^e mod modulus
    // e = 65537
    for (var i = 0; i < 16; i++) {
        doublers[i] = BigMultModP(n, k);
    }

    for (var j = 0; j < k; j++) {
        adder.p[j] <== modulus[j];
        for (var i = 0; i < 16; i++) {
            doublers[i].p[j] <== modulus[j];
        }
    }
    for (var j = 0; j < k; j++) {
        log(doublers[0].p[j]);
    }
    for (var j = 0; j < k; j++) {
        doublers[0].a[j] <== signature[j];
        doublers[0].b[j] <== signature[j];
    }
    for (var j = 0; j < k; j++) {
        log(doublers[0].out[j]);
    }
    for (var i = 0; i + 1 < 16; i++) {
        for (var j = 0; j < k; j++) {
            doublers[i + 1].a[j] <== doublers[i].out[j];
            doublers[i + 1].b[j] <== doublers[i].out[j];
        }
    }
    for (var j = 0; j < k; j++) {
        adder.a[j] <== signature[j];
        adder.b[j] <== doublers[15].out[j];
    }
    for (var j = 0; j < k; j++) {
        message[j] === adder.out[j];
    }
}

template RSAVerifyPadded(n, k) {
    component verifier = RSAVerify(n, k);
    signal input signature[k];
    signal input modulus[k];
    signal input base_message[k];
    signal input padded_message[k];

    // Check that in little endian bytes, for some pad_len,
    //   padded message === base_message[:base_len] + [0xff] * pad_len + [0x01]
    var base_len = 672;

    component base_message_n2b[k];
    component padded_message_n2b[k];
    signal base_message_bits[n*k];
    signal padded_message_bits[n*k];
    for (var i = 0; i < k; i++) {
        base_message_n2b[i] = Num2Bits(n);
        base_message_n2b[i].in <== base_message[i];
        for (var j = 0; j < n; j++) {
            base_message_bits[i*n+j] <== base_message_n2b[i].out[j];
        }
        padded_message_n2b[i] = Num2Bits(n);
        padded_message_n2b[i].in <== padded_message[i];
        for (var j = 0; j < n; j++) {
            padded_message_bits[i*n+j] <== padded_message_n2b[i].out[j];
        }
    }

    for (var i = 0; i < base_len; i++) {
        base_message_bits[i] === padded_message_bits[i];
    }
    for (var i = base_len; i < n*k; i++) {
        base_message_bits[i] === 0;
        if (i > base_len) {
            if (i % 8 == 1) {
                padded_message_bits[i] * (padded_message_bits[i-1] - 1) === 0;
            } else {
                padded_message_bits[i] === padded_message_bits[i-1];
            }
        } else {
            padded_message_bits[i] === 1;
        }
    }

    for (var i = 0; i < k; i++) {
        verifier.signature[i] <== signature[i];
        verifier.modulus[i] <== modulus[i];
        verifier.message[i] <== padded_message[i];
    }
}

// if s == 0 returns [in[0], in[1]]
// if s == 1 returns [in[1], in[0]]
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0])*s + in[0];
    out[1] <== (in[0] - in[1])*s + in[1];
}

// Verifies that merkle proof is correct for given merkle root and a leaf
// pathIndices input is an array of 0/1 selectors telling whether given pathElement is on the left or right side of merkle path
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component selectors[levels];
    component hashers[levels];
    signal zeroCheckers[levels];

    for (var i = 0; i < levels; i++) {
        selectors[i] = DualMux();
        selectors[i].in[0] <== i == 0 ? leaf : hashers[i - 1].out;
        selectors[i].in[1] <== pathElements[i];
        selectors[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];
        if (i > 0) {
            zeroCheckers[i] <== zeroCheckers[i - 1] * (hashers[i].out - root);
        } else {
            zeroCheckers[i] <== hashers[i].out - root;
        }
    }

    zeroCheckers[levels - 1] === 0;
}

template RSAGroupSigVerify(n, k, levels) {
    component verifier = RSAVerifyPadded(n, k);
    signal input signature[k];
    signal input modulus[k];
    signal input base_message[k];
    signal input padded_message[k];

    for (var i = 0; i < k; i++) {
        verifier.signature[i] <== signature[i];
        verifier.modulus[i] <== modulus[i];
        verifier.base_message[i] <== base_message[i];
        verifier.padded_message[i] <== padded_message[i];
    }

    component merkleChecker = MerkleTreeChecker(levels);
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    merkleChecker.leaf <== leaf;
    merkleChecker.root <== root;
    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== pathElements[i];
        merkleChecker.pathIndices[i] <== pathIndices[i];
    }

    // connect the two components; modulus (n x k bigint representation) must hash to leaf
    component modulusHasher = Poseidon(k);
    for (var i = 0; i < k; i++) {
        modulusHasher.inputs[i] <== modulus[i];
    }
    modulusHasher.out === leaf;
}
// const MAGIC_DOUBLE_BLIND_REGEX = /^1(ff)+003051300d0609608648016503040203050004403710c692cc2c46207b0c6f9369e709afe9fcdbe1f7097370c1fc7a55aeef8dd0aa9d0a084526dbe59eb24eee4a5320c1f053def2e404c5b45ade44f9b56143e9$/;

// before optimization: 12.6nk constraints per BigMultModP; n,k = 121, 17 => 440895 non-linear constraints


component main { public [ modulus, base_message ] } = RSAVerifyPadded(121, 17); // as long as this to be true it's ok: n * 2 + log k < 254
//component main { public [ root, message ] } = RSAGroupSigVerify(121, 17, 30);

/* INPUT =
*/
