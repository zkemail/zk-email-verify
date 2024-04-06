pragma circom 2.1.6;

include "./fp.circom";


/// @title RSAVerifier65537 
/// @notice Verifies an RSA signature with exponent 65537.
/// @param n Number of bits per chunk the modulus is split into. Recommended to be 121.
/// @param k Number of chunks the modulus is split into. Recommended to be 17.
/// @input message The message that was signed.
/// @input signature The signature to verify.
/// @input modulus The modulus of the RSA key (pubkey).
template RSAVerifier65537(n, k) {
    signal input message[k];
    signal input signature[k];
    signal input modulus[k];

    component padder = RSAPad(n, k);
    for (var i = 0; i < k; i++) {
        padder.modulus[i] <== modulus[i];
        padder.message[i] <== message[i];
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
        bigPow.out[i] === padder.out[i];
    }
}


/// @title FpPow65537Mod
/// @notice Computes base^65537 mod modulus
/// @dev Does not necessarily reduce fully mod modulus (the answer could be too big by a multiple of modulus)
/// @param n Number of bits per chunk the modulus is split into.
/// @param k Number of chunks the modulus is split into.
/// @input base The base to exponentiate.
template FpPow65537Mod(n, k) {
    signal input base[k];
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
        doublers[0].a[j] <== base[j];
        doublers[0].b[j] <== base[j];
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

/// @title RSAPad
/// @notice Pads a message for RSA signing.
/// @param n Number of bits per chunk the modulus is split into.
/// @param k Number of chunks the modulus is split into.
/// @input modulus The modulus of the RSA key (pubkey).
/// @input message The message to pad.
/// @output out The padded message.
template RSAPad(n, k) {
    signal input modulus[k];
    signal input message[k];
    signal output out[k];

    // The extra 152 bits comes from 0x3031300d060960864801650304020105000420
    // This is due to padding from the RSASSA-PKCS1-v1_5 standard
    var base_len = 408;
    var msg_len = 256;

    signal padded_message_bits[n*k];

    component modulus_n2b[k];
    component message_n2b[k];
    signal modulus_bits[n*k];
    signal message_bits[n*k];
    for (var i = 0; i < k; i++) {
        message_n2b[i] = Num2Bits(n);
        message_n2b[i].in <== message[i];
        for (var j = 0; j < n; j++) {
            message_bits[i*n+j] <== message_n2b[i].out[j];
        }
        modulus_n2b[i] = Num2Bits(n);
        modulus_n2b[i].in <== modulus[i];
        for (var j = 0; j < n; j++) {
            modulus_bits[i*n+j] <== modulus_n2b[i].out[j];
        }
    }

    for (var i = msg_len; i < n*k; i++) {
        message_bits[i] === 0;
    }

    for (var i = 0; i < msg_len; i++) {
        padded_message_bits[i] <== message_bits[i];
    }

    for (var i = base_len; i < base_len + 8; i++) {
        padded_message_bits[i] <== 0;
    }

    for (var i = msg_len; i < base_len; i++) {
        padded_message_bits[i] <== (0x3031300d060960864801650304020105000420 >> (i - msg_len)) & 1;
    }

    component modulus_zero[(n*k + 7 - (base_len + 8))\8];
    {
        var modulus_prefix = 0;
        for (var i = n*k - 1; i >= base_len + 8; i--) {
            if (i+8 < n*k) {
                modulus_prefix += modulus_bits[i+8];
                if (i % 8 == 0) {
                    var idx = (i - (base_len + 8)) \ 8;
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
        out[i] <== padded_message_b2n[i].out;
    }
}
