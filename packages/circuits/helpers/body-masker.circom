pragma circom 2.1.6;

template BodyMasker(maxBodyLength) {
    signal input body[maxBodyLength];
    signal input mask[maxBodyLength];
    signal output masked_body[maxBodyLength];

    for (var i = 0; i < maxBodyLength; i++) {
        masked_body[i] <== body[i] * mask[i];
    }
}