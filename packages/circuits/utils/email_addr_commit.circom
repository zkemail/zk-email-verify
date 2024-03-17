
pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";

// email_addr_commit = hash(rand, emailAddr||0..0)
template EmailAddrCommit(num_ints) {
    signal input rand;
    signal input email_addr_ints[num_ints];
    signal output commit;

    component poseidon = Poseidon(1+num_ints);
    poseidon.inputs[0] <== rand;
    for(var i=0; i<num_ints; i++) {
        poseidon.inputs[1+i] <== email_addr_ints[i];
    }
    commit <== poseidon.out;
}