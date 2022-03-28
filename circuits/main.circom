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

    component modulus_n2b[k];
    component base_message_n2b[k];
    component padded_message_n2b[k];
    signal modulus_bits[n*k];
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
        modulus_n2b[i] = Num2Bits(n);
        modulus_n2b[i].in <== modulus[i];
        for (var j = 0; j < n; j++) {
            modulus_bits[i*n+j] <== modulus_n2b[i].out[j];
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
    component verifier = RSAVerifyPadded(n, k);
    signal input signature[k];
    signal input modulus[k];
    signal input base_message[k];
    signal input padded_message[k];
    signal input payload;

    for (var i = 0; i < k; i++) {
        verifier.signature[i] <== signature[i];
        verifier.modulus[i] <== modulus[i];
        verifier.base_message[i] <== base_message[i];
        verifier.padded_message[i] <== padded_message[i];
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

    signal input useNullifier;
    useNullifier * (useNullifier - 1) === 0;

    signal nullifierOpening;
    component privPoseidonK = PoseidonK(k);
    for (var i = 0; i < k; i++) {
        privPoseidonK.inputs[i] <== signature[i];
    }
    component nullifierOpeningPoseidon = Poseidon(2);
    nullifierOpeningPoseidon.inputs[0] <== privPoseidonK.out;
    nullifierOpeningPoseidon.inputs[1] <== payload;
    nullifierOpening <== nullifierOpeningPoseidon.out;
    log(nullifierOpening);

    signal output nullifier;
    component nullifierPoseidon = Poseidon(2);
    nullifierPoseidon.inputs[0] <== leaf;
    nullifierPoseidon.inputs[1] <== nullifierOpening;
    nullifier <== nullifierPoseidon.out * useNullifier;
    log(nullifier);
}
// const MAGIC_DOUBLE_BLIND_REGEX = /^1(ff)+003051300d0609608648016503040203050004403710c692cc2c46207b0c6f9369e709afe9fcdbe1f7097370c1fc7a55aeef8dd0aa9d0a084526dbe59eb24eee4a5320c1f053def2e404c5b45ade44f9b56143e9$/;

// before optimization: 12.6nk constraints per BigMultModP; n,k = 121, 17 => 440895 non-linear constraints


// component main { public [ modulus, base_message ] } = RSAVerifyPadded(121, 17); // as long as this to be true it's ok: n * 2 + log k < 254
component main { public [ useNullifier, root, base_message, payload ] } = RSAGroupSigVerify(121, 17, 30);

/* INPUT =
{"useNullifier":"1","signature":["2125458007190927620810017149424523154","632737700853972236267481229761321574","2202719882434184155152607200729141966","1241323340091221229621734125613530837","2319983104748421848045444356940754821","2156686418066900492002210582970751093","2556906020528435211844522867008474586","150957812668648853881909468877719870","361092573284483661301196327248183585","1597674170046765594718011231816122756","437798271266294201539646486361188258","842579984224460239904441892315509239","2129279318527636296126829448494436138","1717393396647685615457951380404492349","1432304951698010861428626758117098009","719698849166288700744307797723851649","540179082044958712420397287184942"],"modulus":["1082364139410815810254667630389669919","1553982345989568435442498573813399005","2575526456461124923199025324125948280","133087395054638332712852052113549316","393424946623852679376497438725228276","102326447130257455822883000341514572","2268342599872019839805068390915262026","1992979686750480742734767796771598418","998554927923055054274564290784722334","2045855023024469057940993096535013429","1897980742786143457935647649225365892","1082571892361447937767415638506668368","2298005631744261039714296341536512253","306469351680161930444472437033574281","1609884821361367335876243710994564051","335308412674886362846856427503287917","4003268657986092411332378261035927"],"padded_message":["435482577974081391675784644045915113","690659351208288161928561770852540664","1290240321119435080370475536169052839","464822816594643771341803003620179867","521827602119457540763846457494146153","2658455991569831598342462056491404036","2658455991569831745807614120560689151","2658455991569831745807614120560689151","2658455991569831745807614120560689151","2658455991569831745807614120560689151","2658455991569831745807614120560689151","2658455991569831745807614120560689151","2658455991569831745807614120560689151","2658455991569831745807614120560689151","2658455991569831745807614120560689151","2658455991569831745807614120560689151","158456325028528675187087900671"],"base_message":["435482577974081391675784644045915113","690659351208288161928561770852540664","1290240321119435080370475536169052839","464822816594643771341803003620179867","521827602119457540763846457494146153","108800525607127812","0","0","0","0","0","0","0","0","0","0","0"],"payload":"2328401333974886873383385362411738102359762677572253218035172085337438831147144388051624789144933618951067533458801064187563795115771720046463851513726363","pathElements":["896502772928519850230221990143654399037028401581276431073423287761286388317",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"pathIndices":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"root":"12035463080492256934636139244643271402470422103063682121766838944750994393871"}
*/
