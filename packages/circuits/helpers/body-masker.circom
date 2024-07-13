pragma circom 2.1.6;

// Asserts that a given input is binary.
//
// Inputs:
// - in: an input signal, expected to be 0 or 1.
template AssertBit() {
  signal input in;
  in * (in - 1) === 0;
}

// The BodyMasker template masks an input body array using a binary mask array.
// Each element in the body array is multiplied by the corresponding element in the mask array.
// The mask array is validated to ensure all elements are binary (0 or 1).
//
// Parameters:
// - maxBodyLength: The maximum length of the body and mask arrays.
//
// Inputs:
// - body: An array of signals representing the body to be masked.
// - mask: An array of signals representing the binary mask.
//
// Outputs:
// - masked_body: An array of signals representing the masked body.
template BodyMasker(maxBodyLength) {
    signal input body[maxBodyLength];
    signal input mask[maxBodyLength];
    signal output masked_body[maxBodyLength];

    component bit_check[maxBodyLength];

    for (var i = 0; i < maxBodyLength; i++) {
        bit_check[i] = AssertBit();
        bit_check[i].in <== mask[i];
        masked_body[i] <== body[i] * mask[i];
    }
}