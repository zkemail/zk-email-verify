"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Pad = exports.partialSha = exports.shaHash = void 0;
// import { createHash } from "crypto";
const CryptoJS = __importStar(require("crypto"));
const binaryFormat_1 = require("./binaryFormat");
// const { webcrypto, KeyObject } = await import('crypto');
// const { subtle } = webcrypto;
const fast_sha256_1 = require("./fast-sha256");
function shaHash(str) {
    return CryptoJS.createHash('sha256').update(str).digest();
}
exports.shaHash = shaHash;
function partialSha(msg, msgLen) {
    const shaGadget = new fast_sha256_1.Hash();
    return shaGadget.update(msg, msgLen).cacheState();
}
exports.partialSha = partialSha;
// Puts an end selector, a bunch of 0s, then the length, then fill the rest with 0s.
function sha256Pad(prehash_prepad_m, maxShaBytes) {
    let length_bits = prehash_prepad_m.length * 8; // bytes to bits
    let length_in_bytes = (0, binaryFormat_1.int64toBytes)(length_bits);
    prehash_prepad_m = (0, binaryFormat_1.mergeUInt8Arrays)(prehash_prepad_m, (0, binaryFormat_1.int8toBytes)(2 ** 7)); // Add the 1 on the end, length 505
    // while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
    while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
        prehash_prepad_m = (0, binaryFormat_1.mergeUInt8Arrays)(prehash_prepad_m, (0, binaryFormat_1.int8toBytes)(0));
    }
    prehash_prepad_m = (0, binaryFormat_1.mergeUInt8Arrays)(prehash_prepad_m, length_in_bytes);
    (0, binaryFormat_1.assert)((prehash_prepad_m.length * 8) % 512 === 0, "Padding did not complete properly!");
    let messageLen = prehash_prepad_m.length;
    while (prehash_prepad_m.length < maxShaBytes) {
        prehash_prepad_m = (0, binaryFormat_1.mergeUInt8Arrays)(prehash_prepad_m, (0, binaryFormat_1.int64toBytes)(0));
    }
    (0, binaryFormat_1.assert)(prehash_prepad_m.length === maxShaBytes, `Padding to max length did not complete properly! Your padded message is ${prehash_prepad_m.length} long but max is ${maxShaBytes}!`);
    return [prehash_prepad_m, messageLen];
}
exports.sha256Pad = sha256Pad;
