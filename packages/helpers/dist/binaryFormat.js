"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packBytesIntoNBytes = exports.packedNBytesToString = exports.assert = exports.mergeUInt8Arrays = exports.uint8ToBits = exports.bitsToUint8 = exports.int8toBytes = exports.int64toBytes = exports.fromHex = exports.toHex = exports.toCircomBigIntBytes = exports.bigIntToChunkedBytes = exports.bytesToBigInt = exports.bufferToString = exports.Uint8ArrayToHex = exports.Uint8ArrayToString = exports.Uint8ArrayToCharArray = exports.bufferToHex = exports.bufferToUint8Array = exports.stringToBytes = exports.bytesToString = void 0;
const constants_1 = require("./constants");
function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
}
exports.bytesToString = bytesToString;
// stringToUint8Array
function stringToBytes(str) {
    const encodedText = new TextEncoder().encode(str);
    const toReturn = Uint8Array.from(str, (x) => x.charCodeAt(0));
    //   const buf = Buffer.from(str, "utf8");
    return toReturn;
    // TODO: Check encoding mismatch if the proof doesnt work
    // Note that our custom encoding function maps (239, 191, 189) -> (253)
    // Note that our custom encoding function maps (207, 181) -> (245)
    // throw Error(
    //   "TextEncoder does not match string2bytes function" +
    //     "\n" +
    //     str +
    //     "\n" +
    //     buf +
    //     "\n" +
    //     Uint8Array.from(buf) +
    //     "\n" +
    //     JSON.stringify(encodedText) +
    //     "\n" +
    //     JSON.stringify(toReturn)
    // );
}
exports.stringToBytes = stringToBytes;
function bufferToUint8Array(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return Uint8Array.from(view);
}
exports.bufferToUint8Array = bufferToUint8Array;
function bufferToHex(buf) {
    return buf.toString("hex");
}
exports.bufferToHex = bufferToHex;
function Uint8ArrayToCharArray(a) {
    return Array.from(a).map((x) => x.toString());
}
exports.Uint8ArrayToCharArray = Uint8ArrayToCharArray;
async function Uint8ArrayToString(a) {
    return Array.from(a)
        .map((x) => x.toString())
        .join(";");
}
exports.Uint8ArrayToString = Uint8ArrayToString;
async function Uint8ArrayToHex(a) {
    return Buffer.from(a).toString("hex");
}
exports.Uint8ArrayToHex = Uint8ArrayToHex;
function bufferToString(buf) {
    let intermediate = bufferToUint8Array(buf);
    return bytesToString(intermediate);
}
exports.bufferToString = bufferToString;
function bytesToBigInt(bytes) {
    let res = 0n;
    for (let i = 0; i < bytes.length; ++i) {
        res = (res << 8n) + BigInt(bytes[i]);
    }
    return res;
}
exports.bytesToBigInt = bytesToBigInt;
function bigIntToChunkedBytes(num, bytesPerChunk, numChunks) {
    const res = [];
    const bigintNum = typeof num == "bigint" ? num : num.valueOf();
    const msk = (1n << BigInt(bytesPerChunk)) - 1n;
    for (let i = 0; i < numChunks; ++i) {
        res.push(((bigintNum >> BigInt(i * bytesPerChunk)) & msk).toString());
    }
    return res;
}
exports.bigIntToChunkedBytes = bigIntToChunkedBytes;
function toCircomBigIntBytes(num) {
    return bigIntToChunkedBytes(num, constants_1.CIRCOM_BIGINT_N, constants_1.CIRCOM_BIGINT_K);
}
exports.toCircomBigIntBytes = toCircomBigIntBytes;
// https://stackoverflow.com/a/69585881
const HEX_STRINGS = "0123456789abcdef";
const MAP_HEX = {
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
    F: 15,
};
// Fast Uint8Array to hex
function toHex(bytes) {
    return Array.from(bytes || [])
        .map((b) => HEX_STRINGS[b >> 4] + HEX_STRINGS[b & 15])
        .join("");
}
exports.toHex = toHex;
// Mimics Buffer.from(x, 'hex') logic
// Stops on first non-hex string and returns
// https://github.com/nodejs/node/blob/v14.18.1/src/string_bytes.cc#L246-L261
function fromHex(hexString) {
    let hexStringTrimmed = hexString;
    if (hexString[0] === "0" && hexString[1] === "x") {
        hexStringTrimmed = hexString.slice(2);
    }
    const bytes = new Uint8Array(Math.floor((hexStringTrimmed || "").length / 2));
    let i;
    for (i = 0; i < bytes.length; i++) {
        const a = MAP_HEX[hexStringTrimmed[i * 2]];
        const b = MAP_HEX[hexStringTrimmed[i * 2 + 1]];
        if (a === undefined || b === undefined) {
            break;
        }
        bytes[i] = (a << 4) | b;
    }
    return i === bytes.length ? bytes : bytes.slice(0, i);
}
exports.fromHex = fromHex;
// Works only on 32 bit sha text lengths
function int64toBytes(num) {
    let arr = new ArrayBuffer(8); // an Int32 takes 4 bytes
    let view = new DataView(arr);
    view.setInt32(4, num, false); // byteOffset = 0; litteEndian = false
    return new Uint8Array(arr);
}
exports.int64toBytes = int64toBytes;
// Works only on 32 bit sha text lengths
function int8toBytes(num) {
    let arr = new ArrayBuffer(1); // an Int8 takes 4 bytes
    let view = new DataView(arr);
    view.setUint8(0, num); // byteOffset = 0; litteEndian = false
    return new Uint8Array(arr);
}
exports.int8toBytes = int8toBytes;
function bitsToUint8(bits) {
    let bytes = new Uint8Array(bits.length);
    for (let i = 0; i < bits.length; i += 1) {
        bytes[i] = parseInt(bits[i], 2);
    }
    return bytes;
}
exports.bitsToUint8 = bitsToUint8;
function uint8ToBits(uint8) {
    return uint8.reduce((acc, byte) => acc + byte.toString(2).padStart(8, "0"), "");
}
exports.uint8ToBits = uint8ToBits;
function mergeUInt8Arrays(a1, a2) {
    // sum of individual array lengths
    var mergedArray = new Uint8Array(a1.length + a2.length);
    mergedArray.set(a1);
    mergedArray.set(a2, a1.length);
    return mergedArray;
}
exports.mergeUInt8Arrays = mergeUInt8Arrays;
function assert(cond, errorMessage) {
    if (!cond) {
        throw new Error(errorMessage);
    }
}
exports.assert = assert;
function packedNBytesToString(packedBytes, n = 7) {
    let chars = [];
    for (let i = 0; i < packedBytes.length; i++) {
        for (var k = 0n; k < n; k++) {
            chars.push(Number((packedBytes[i] >> (k * 8n)) % 256n));
        }
    }
    return bytesToString(Uint8Array.from(chars));
}
exports.packedNBytesToString = packedNBytesToString;
function packBytesIntoNBytes(messagePaddedRaw, n = 7) {
    const messagePadded = typeof messagePaddedRaw === "string" ? stringToBytes(messagePaddedRaw) : messagePaddedRaw;
    let output = [];
    for (let i = 0; i < messagePadded.length; i++) {
        if (i % n === 0) {
            output.push(0n);
        }
        const j = (i / n) | 0;
        console.assert(j === output.length - 1, "Not editing the index of the last element -- packing loop invariants bug!");
        output[j] += BigInt(messagePadded[i]) << BigInt((i % n) * 8);
    }
    return output;
}
exports.packBytesIntoNBytes = packBytesIntoNBytes;
// Usage: let in_padded_n_bytes = packBytesIntoNBytes(messagePadded, 7).map((x) => x.toString()); // Packed into 7 byte signals
// console.log(packedNBytesToString([30680772461461504n, 129074054722665n, 30794022159122432n, 30803244232763745n]));
