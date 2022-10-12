"use strict";
exports.__esModule = true;
exports.fromHex = exports.toHex = exports.toCircomBigIntBytes = exports.bytesToBigInt = exports.stringToBytes = void 0;
var constants_1 = require("./constants");
function stringToBytes(str) {
    return Uint8Array.from(str, function (x) { return x.charCodeAt(0); });
}
exports.stringToBytes = stringToBytes;
function bytesToBigInt(bytes) {
    var res = 0n;
    for (var i = 0; i < bytes.length; ++i) {
        res = (res << 8n) + BigInt(bytes[i]);
    }
    return res;
}
exports.bytesToBigInt = bytesToBigInt;
function toCircomBigIntBytes(num) {
    var res = [];
    var msk = (1n << BigInt(constants_1.CIRCOM_BIGINT_N)) - 1n;
    for (var i = 0; i < constants_1.CIRCOM_BIGINT_K; ++i) {
        res.push(((num >> BigInt(i * constants_1.CIRCOM_BIGINT_N)) & msk).toString());
    }
    return res;
}
exports.toCircomBigIntBytes = toCircomBigIntBytes;
// https://stackoverflow.com/a/69585881
var HEX_STRINGS = "0123456789abcdef";
var MAP_HEX = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15
};
// Fast Uint8Array to hex
function toHex(bytes) {
    return Array.from(bytes || [])
        .map(function (b) { return HEX_STRINGS[b >> 4] + HEX_STRINGS[b & 15]; })
        .join("");
}
exports.toHex = toHex;
// Mimics Buffer.from(x, 'hex') logic
// Stops on first non-hex string and returns
// https://github.com/nodejs/node/blob/v14.18.1/src/string_bytes.cc#L246-L261
function fromHex(hexString) {
    var bytes = new Uint8Array(Math.floor((hexString || "").length / 2));
    var i;
    for (i = 0; i < bytes.length; i++) {
        var a = MAP_HEX[hexString[i * 2]];
        var b = MAP_HEX[hexString[i * 2 + 1]];
        if (a === undefined || b === undefined) {
            break;
        }
        bytes[i] = (a << 4) | b;
    }
    return i === bytes.length ? bytes : bytes.slice(0, i);
}
exports.fromHex = fromHex;
