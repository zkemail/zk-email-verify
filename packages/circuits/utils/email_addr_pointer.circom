
pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";

// email_addr_pointer = hash(relayerRand, emailAddr||0..0)
template EmailAddrPointer(num_ints) {
    signal input relayer_rand;
    signal input email_addr_ints[num_ints];
    signal output pointer;

    component poseidon = Poseidon(1+num_ints);
    poseidon.inputs[0] <== relayer_rand;
    for(var i=0; i<num_ints; i++) {
        poseidon.inputs[1+i] <== email_addr_ints[i];
    }
    pointer <== poseidon.out;
}
