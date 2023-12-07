"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRSA = void 0;
function modExp(a, b, c) {
    let res = 1n;
    for (let i = 0; i < 30; ++i) {
        if ((b >> i) & 1)
            res = (res * a) % c;
        a = (a * a) % c;
    }
    return res;
}
function verifyRSA(sig, modulus) {
    return modExp(sig, 65537, modulus);
}
exports.verifyRSA = verifyRSA;
