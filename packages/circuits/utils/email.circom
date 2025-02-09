pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/gates.circom";
include "circomlib/circuits/mux1.circom";
include "./hash.circom";

/// @title CleanEmailAddress
/// @notice Verifies that a cleaned email address is derived correctly from the original
/// @notice Assumes that the encoded email address is valid
/// @dev Removes periods and plus aliases from email addresses
/// @param maxLength Maximum length of the email address
/// @input encoded Original email address (e.g., "shreyas.londhe+alias@gmail.com")
/// @input decoded Cleaned email address (e.g., "shreyaslondhe@gmail.com")
/// @output isValid 1 if decoded is valid cleaned version of encoded
template CleanEmailAddress(maxLength) {
    signal input encoded[maxLength];
    signal input decoded[maxLength];
    signal output isValid;

    // Helper signals
    signal r;
    signal isPlus[maxLength];
    signal isAt[maxLength];
    signal isPlusAndAt[maxLength];
    signal isLocalPart[maxLength];
    signal isPeriod[maxLength];
    signal isLocalPeriod[maxLength];
    signal foundPlus[maxLength];
    signal hasAliasPart;
    signal afterPlus[maxLength];
    signal afterAt[maxLength];
    signal inAliasPartTemp[maxLength];
    signal inAliasPart[maxLength];
    signal shouldRemove[maxLength];
    signal processed[maxLength];
    signal rEnc[maxLength];
    signal rDec[maxLength];
    signal sumEnc[maxLength];
    signal sumDec[maxLength];

    // Helper components
    component muxEnc[maxLength];
    component rHasher = PoseidonModular(2 * maxLength);

    // Generate random value r using Poseidon
    for (var i = 0; i < maxLength; i++) {
        rHasher.in[i] <== encoded[i];
        rHasher.in[maxLength + i] <== decoded[i];
    }
    r <== rHasher.out;

    // Check for '+' (43 in ASCII)
    // Check for '@' (64 in ASCII)
    isPlus[0] <== IsEqual()([encoded[0], 43]);
    isAt[0] <== IsEqual()([encoded[0], 64]);
    isPlusAndAt[0] <== (1 - isPlus[0]) * (1 - isAt[0]);
    isLocalPart[0] <== isPlusAndAt[0];
    for (var i = 1; i < maxLength; i++) {
        isPlus[i] <== IsEqual()([encoded[i], 43]);
        isAt[i] <== IsEqual()([encoded[i], 64]);
        isPlusAndAt[i] <== (1 - isPlus[i]) * (1 - isAt[i]);
        isLocalPart[i] <== isLocalPart[i-1] * isPlusAndAt[i];
    }

    // Check for '.' (46 in ASCII)
    for (var i = 0; i < maxLength; i++) {
        isPeriod[i] <== IsEqual()([encoded[i], 46]);
        isLocalPeriod[i] <== isLocalPart[i] * isPeriod[i];
    }

    // Track if we've found a plus and are in alias part
    foundPlus[0] <== isPlus[0];
    for (var i = 1; i < maxLength; i++) {
        foundPlus[i] <== foundPlus[i-1] + isPlus[i];
    }

    // Determine if we're in the alias part (between + and @)
    afterPlus[0] <== (1 - isPlus[0]);
    for (var i = 1; i < maxLength; i++) {
        afterPlus[i] <== afterPlus[i-1] * (1 - isPlus[i]);
    }
    hasAliasPart <== (1 - afterPlus[maxLength - 1]);

    afterAt[0] <== (1 - isAt[0]);
    for (var i = 1; i < maxLength; i++) {
        afterAt[i] <== afterAt[i-1] * (1 - isAt[i]);
    }

    for (var i = 0; i < maxLength; i++) {
        inAliasPartTemp[i] <== afterAt[i] - afterPlus[i];
        inAliasPart[i] <== hasAliasPart * inAliasPartTemp[i];
    }

    // Determine which characters should be removed
    for (var i = 0; i < maxLength; i++) {
        shouldRemove[i] <== isLocalPeriod[i] + inAliasPart[i];
    }

    // Process the encoded input
    for (var i = 0; i < maxLength; i++) {
        processed[i] <== (1 - shouldRemove[i]) * encoded[i];
    }

    // Calculate powers of r for encoded (skip removed chars)
    muxEnc[0] = Mux1();
    muxEnc[0].c[0] <== r;
    muxEnc[0].c[1] <== 1;
    muxEnc[0].s <== shouldRemove[0];
    rEnc[0] <== muxEnc[0].out;

    for (var i = 1; i < maxLength; i++) {
        muxEnc[i] = Mux1();
        muxEnc[i].c[0] <== rEnc[i - 1] * r;
        muxEnc[i].c[1] <== rEnc[i - 1];
        muxEnc[i].s <== shouldRemove[i];
        rEnc[i] <== muxEnc[i].out;
    }

    // Calculate powers of r for decoded
    rDec[0] <== r;
    for (var i = 1; i < maxLength; i++) {
        rDec[i] <== rDec[i - 1] * r;
    }

    // Calculate running sum for processed
    sumEnc[0] <== rEnc[0] * processed[0];
    for (var i = 1; i < maxLength; i++) {
        sumEnc[i] <== sumEnc[i - 1] + rEnc[i] * processed[i];
    }

    // Calculate running sum for decoded
    sumDec[0] <== rDec[0] * decoded[0];
    for (var i = 1; i < maxLength; i++) {
        sumDec[i] <== sumDec[i - 1] + rDec[i] * decoded[i];
    }

    // Verify that processed matches decoded
    isValid <== IsEqual()([sumEnc[maxLength - 1], sumDec[maxLength - 1]]);
}