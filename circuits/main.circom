pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "./fp.circom";

// Computes base^65537 mod modulus
// Does not necessarily reduce fully mod modulus (the answer could be
// too big by a multiple of modulus)
template FpPow65537Mod(n, k) {
    signal input base[k];
    // Exponent is hardcoded at 65537
    signal input modulus[k];
    signal output out[k];

    component doublers[16];
    component adder = FpMul(n, k);
    for (var i = 0; i < 16; i++) {
        doublers[i] = FpMul(n, k);
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
        doublers[0].a[j] <== base[j];
        doublers[0].b[j] <== base[j];
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
        adder.a[j] <== base[j];
        adder.b[j] <== doublers[15].out[j];
    }
    for (var j = 0; j < k; j++) {
        out[j] <== adder.out[j];
    }
}

// Pad a message for RSA signing, given the modulus.
// This computes:
//   padded message === base_message[:base_len] + [0x00] + [0xff] * pad_len + [0x01]
// See RFC 8017 Section 9.2 (https://datatracker.ietf.org/doc/html/rfc8017#section-9.2).
// Base length is hardcoded at 664, which corresponds to the RSA-SHA-512 digest variant.
template RSAPad(n, k) {
    signal input modulus[k];
    signal input base_message[k];
    signal output padded_message[k];

    var base_len = 664;

    signal padded_message_bits[n*k];

    component modulus_n2b[k];
    component base_message_n2b[k];
    signal modulus_bits[n*k];
    signal base_message_bits[n*k];
    for (var i = 0; i < k; i++) {
        base_message_n2b[i] = Num2Bits(n);
        base_message_n2b[i].in <== base_message[i];
        for (var j = 0; j < n; j++) {
            base_message_bits[i*n+j] <== base_message_n2b[i].out[j];
        }
        modulus_n2b[i] = Num2Bits(n);
        modulus_n2b[i].in <== modulus[i];
        for (var j = 0; j < n; j++) {
            modulus_bits[i*n+j] <== modulus_n2b[i].out[j];
        }
    }

    for (var i = base_len; i < n*k; i++) {
        base_message_bits[i] === 0;
    }

    for (var i = 0; i < base_len + 8; i++) {
        padded_message_bits[i] <== base_message_bits[i];
    }
    component modulus_zero[(n*k + 7 - (base_len + 8))\8];
    {
        var modulus_prefix = 0;
        for (var i = n*k - 1; i >= base_len + 8; i--) {
            if (i+8 < n*k) {
                modulus_prefix += modulus_bits[i+8];
                if (i % 8 == 0) {
                    var idx = (i - (base_len + 8)) / 8;
                    modulus_zero[idx] = IsZero();
                    modulus_zero[idx].in <== modulus_prefix;
                    padded_message_bits[i] <== 1-modulus_zero[idx].out;
                } else {
                    padded_message_bits[i] <== padded_message_bits[i+1];
                }
            } else {
                padded_message_bits[i] <== 0;
            }
        }
    }
    // The RFC guarantees at least 8 octets of 0xff padding.
    assert(base_len + 8 + 65 <= n*k);
    for (var i = base_len + 8; i < base_len + 8 + 65; i++) {
        padded_message_bits[i] === 1;
    }

    component padded_message_b2n[k];
    for (var i = 0; i < k; i++) {
        padded_message_b2n[i] = Bits2Num(n);
        for (var j = 0; j < n; j++) {
            padded_message_b2n[i].in[j] <== padded_message_bits[i*n+j];
        }
        padded_message[i] <== padded_message_b2n[i].out;
    }
}

// Verify an SSH signature, assuming the public exponent is 65537.
// Base message is the DER-encoded hashed message.
// Assumes the modulus and base_message are well-formed and range-checked (or
// otherwise trustworthy).
template RSAVerify65537(n, k) {
    signal input signature[k];
    signal input modulus[k];
    signal input base_message[k];

    component padder = RSAPad(n, k);
    for (var i = 0; i < k; i++) {
        padder.modulus[i] <== modulus[i];
        padder.base_message[i] <== base_message[i];
    }

    // Check that the signature is in proper form and reduced mod modulus.
    component signatureRangeCheck[k];
    component bigLessThan = BigLessThan(n, k);
    for (var i = 0; i < k; i++) {
        signatureRangeCheck[i] = Num2Bits(n);
        signatureRangeCheck[i].in <== signature[i];
        bigLessThan.a[i] <== signature[i];
        bigLessThan.b[i] <== modulus[i];
    }
    bigLessThan.out === 1;

    component bigPow = FpPow65537Mod(n, k);
    for (var i = 0; i < k; i++) {
        bigPow.base[i] <== signature[i];
        bigPow.modulus[i] <== modulus[i];
    }
    // By construction of the padding, the padded message is necessarily
    // smaller than the modulus. Thus, we don't have to check that bigPow is fully reduced.
    for (var i = 0; i < k; i++) {
        bigPow.out[i] === padder.padded_message[i];
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

// hashes k inputs; use this if k > 16
// layout: 16 in first row, 15 in the rest
// connect i-th hasher's output to i+1-th hasher's 0-th input
// 
// precisely:
// input[0] -> hashes[0].inputs[0]
// input[i] -> hashes[(i-1)/15].inputs[(i-1)%15]
// 0 -> hashes[last].inputs[unset]
// hashes[last].out -> out
//
// javascript:
// const poseidonHasher = await buildPoseidon();
// const poseidon = arr => poseidonHasher.F.toString(poseidonHasher(arr));
// const poseidonK = (ar) => {
//   let cur = [];
//   for (const elt of ar) {
//     cur.push(elt);
//     if (cur.length === 16) {
//       cur = [poseidon(cur)];
//     }
//   }
//   if (cur.length === 1) return cur[0];
//   while (cur.length < 16) cur.push(0);
//   return poseidon(cur);
// }
template PoseidonK(k) {
    signal input inputs[k];
    signal output out;
    var nHashers = (k + 13) \ 15;
    component hashes[nHashers];
    for (var i = 0; i < nHashers; i++) {
        hashes[i] = Poseidon(16);
    }
    hashes[0].inputs[0] <== inputs[0];
    for (var i = 1; i < k; i++) {
        hashes[(i - 1) \ 15].inputs[(i - 1) % 15 + 1] <== inputs[i];
    }
    for (var i = (k - 2) % 15 + 2; i < 16; i++) {
        hashes[nHashers-1].inputs[i] <== 0;
    }
    for (var i = 0; i + 1 < nHashers; i++) {
        hashes[i + 1].inputs[0] <== hashes[i].out;
    }
    out <== hashes[nHashers - 1].out;
}

template RSAGroupSigVerify(n, k, levels) {
    component verifier = RSAVerify65537(n, k);
    signal input signature[k];
    signal input modulus[k];
    signal input base_message[k];
    signal input topic;
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
    enableSignerId * (enableSignerId - 1) === 0;

    signal signerIdOpening;
    component privPoseidonK = PoseidonK(k);
    for (var i = 0; i < k; i++) {
        privPoseidonK.inputs[i] <== signature[i];
    }
    component nullifierOpeningPoseidon = Poseidon(2);
    nullifierOpeningPoseidon.inputs[0] <== privPoseidonK.out;
    nullifierOpeningPoseidon.inputs[1] <== topic;
    signerIdOpening <== nullifierOpeningPoseidon.out;
    log(signerIdOpening);

    signal signerId;
    component signerIdPoseidon = Poseidon(2);
    signerIdPoseidon.inputs[0] <== leaf;
    signerIdPoseidon.inputs[1] <== signerIdOpening;
    signerId <== signerIdPoseidon.out * enableSignerId;
    log(signerId);

    signal output hash_of_all_public;
    component all_public_hasher;
    all_public_hasher = Poseidon(6);
    component base_message_hasher;
    base_message_hasher = PoseidonK(k);
    for (var i = 0; i < k; i++) {
        base_message_hasher.inputs[i] <== base_message[i];
    }
    all_public_hasher.inputs[0] <== base_message_hasher.out;
    all_public_hasher.inputs[1] <== signerId;
    all_public_hasher.inputs[2] <== topic;
    all_public_hasher.inputs[3] <== payload;
    all_public_hasher.inputs[4] <== root;
    all_public_hasher.inputs[5] <== enableSignerId;
    hash_of_all_public <== all_public_hasher.out;
}

// before optimization: 12.6nk constraints per FpMul; n,k = 121, 17 => 440895 non-linear constraints

// component main { public [ modulus, base_message ] } = RSAVerify65537(121, 34); // as long as this to be true it's ok: n * 2 + log k < 254

component main = RSAGroupSigVerify(121, 34, 30);
/* private [ signature, modulus, pathElements, pathIndices ] */
/* output [ signerId ] */

/* INPUT =
{"enableSignerId":"1","modulus":["1082364139410815810254667630389669919","1553982345989568435442498573813399005","2575526456461124923199025324125948280","133087395054638332712852052113549316","393424946623852679376497438725228276","102326447130257455822883000341514572","2268342599872019839805068390915262026","1992979686750480742734767796771598418","998554927923055054274564290784722334","2045855023024469057940993096535013429","1897980742786143457935647649225365892","1082571892361447937767415638506668368","2298005631744261039714296341536512253","306469351680161930444472437033574281","1609884821361367335876243710994564051","335308412674886362846856427503287917","4003268657986092411332378261035927","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],"signature":["2125458007190927620810017149424523154","632737700853972236267481229761321574","2202719882434184155152607200729141966","1241323340091221229621734125613530837","2319983104748421848045444356940754821","2156686418066900492002210582970751093","2556906020528435211844522867008474586","150957812668648853881909468877719870","361092573284483661301196327248183585","1597674170046765594718011231816122756","437798271266294201539646486361188258","842579984224460239904441892315509239","2129279318527636296126829448494436138","1717393396647685615457951380404492349","1432304951698010861428626758117098009","719698849166288700744307797723851649","540179082044958712420397287184942","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],"base_message":["435482577974081391675784644045915113","690659351208288161928561770852540664","1290240321119435080370475536169052839","464822816594643771341803003620179867","521827602119457540763846457494146153","108800525607127812","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],"topic":"3137061951271426118593180588750888392284399636551901764720985937739791230300","payload":"17004290866387188744437254940032575184531160647364191587888434703025982312170","pathElements":["170227650858464663381741135433049233683158099257790696775744833135399213683",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"pathIndices":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"root":"5204948105608113267338067064243552543571157493713429695240000500239669067219"}
*/
