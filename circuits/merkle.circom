pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";

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
    signal zeroCheckers[levels+1];

    zeroCheckers[0] <== leaf - root;

    for (var i = 0; i < levels; i++) {
        selectors[i] = DualMux();
        selectors[i].in[0] <== i == 0 ? leaf : hashers[i - 1].out;
        selectors[i].in[1] <== pathElements[i];
        selectors[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];
        zeroCheckers[i+1] <== zeroCheckers[i] * (hashers[i].out - root);
    }

    zeroCheckers[levels] === 0;
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
