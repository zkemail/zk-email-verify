pragma circom 2.1.6;

/// @function log2Ceil
/// @notice This function actually calculates `ceil(log2(a+2))`
/// @param a The input value
/// @return The result of the log2Ceil
function log2Ceil(a) {
    var n = a + 1;
    var r = 0;

    while (n > 0) {
        r++;
        n \= 2;
    }

    return r;
}
