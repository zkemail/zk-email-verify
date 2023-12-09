"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCircuitInputs = exports.generatePartialSHA = exports.padUint8ArrayWithZeros = exports.findIndexInUint8Array = exports.rawEmailToBuffer = exports.insert13Before10 = void 0;
const binaryFormat_1 = require("./binaryFormat");
const constants_1 = require("./constants");
const shaHash_1 = require("./shaHash");
// Sometimes, newline encodings re-encode \r\n as just \n, so re-insert the \r so that the email hashes correctly
function insert13Before10(a) {
    let ret = new Uint8Array(a.length + 1000);
    let j = 0;
    for (let i = 0; i < a.length; i++) {
        // Ensure each \n is preceded by a \r
        if (a[i] === 10 && i > 0 && a[i - 1] !== 13) {
            ret[j] = 13;
            j++;
        }
        ret[j] = a[i];
        j++;
    }
    return ret.slice(0, j);
}
exports.insert13Before10 = insert13Before10;
// Return the Uint8Array of the email after cleaning (/n -> /r/n)
function rawEmailToBuffer(email) {
    const byteArray = new TextEncoder().encode(email);
    const cleaned = insert13Before10(byteArray);
    return Buffer.from(cleaned.buffer);
}
exports.rawEmailToBuffer = rawEmailToBuffer;
function findIndexInUint8Array(array, selector) {
    let i = 0;
    let j = 0;
    while (i < array.length) {
        if (array[i] === selector[j]) {
            j++;
            if (j === selector.length) {
                return i - j + 1;
            }
        }
        else {
            j = 0;
        }
        i++;
    }
    return -1;
}
exports.findIndexInUint8Array = findIndexInUint8Array;
function padUint8ArrayWithZeros(array, length) {
    while (array.length < length) {
        array = (0, binaryFormat_1.mergeUInt8Arrays)(array, (0, binaryFormat_1.int8toBytes)(0));
    }
    return array;
}
exports.padUint8ArrayWithZeros = padUint8ArrayWithZeros;
function generatePartialSHA({ body, bodyLength, selectorString, // String to split the body
maxRemainingBodyLength, // Maximum allowed length of the body after the selector
 }) {
    let selectorIndex = 0;
    // TODO: See if this (no preselector) could be handled at the circuit level
    if (selectorString) {
        const selector = new TextEncoder().encode(selectorString);
        selectorIndex = findIndexInUint8Array(body, selector);
    }
    const shaCutoffIndex = Math.floor(selectorIndex / 64) * 64;
    const precomputeText = body.slice(0, shaCutoffIndex);
    let bodyRemaining = body.slice(shaCutoffIndex);
    const bodyRemainingLength = bodyLength - precomputeText.length;
    if (bodyRemainingLength > maxRemainingBodyLength) {
        throw new Error(`Remaining body ${bodyRemainingLength} after the selector is longer than max (${maxRemainingBodyLength})`);
    }
    if (bodyRemaining.length % 64 !== 0) {
        throw new Error(`Remaining body was not padded correctly with int64s`);
    }
    bodyRemaining = padUint8ArrayWithZeros(bodyRemaining, maxRemainingBodyLength);
    const precomputedSha = (0, shaHash_1.partialSha)(precomputeText, shaCutoffIndex);
    return {
        precomputedSha,
        bodyRemaining,
        bodyRemainingLength,
    };
}
exports.generatePartialSHA = generatePartialSHA;
function generateCircuitInputs(params) {
    const { rsaSignature, rsaPublicKey, body, bodyHash, message, // the message that was signed (header + bodyHash)
    shaPrecomputeSelector, // String to split the body for SHA pre computation
    maxMessageLength = constants_1.MAX_HEADER_PADDED_BYTES, // Maximum allowed length of the message in circuit
    maxBodyLength = constants_1.MAX_BODY_PADDED_BYTES, // Maximum allowed length of the body in circuit
    ignoreBodyHashCheck = false, // To be used when ignore_body_hash_check is true in circuit
     } = params;
    // SHA add padding
    const [messagePadded, messagePaddedLen] = (0, shaHash_1.sha256Pad)(message, maxMessageLength);
    // 65 comes from the 64 at the end and the 1 bit in the start, then 63 comes from the formula to round it up to the nearest 64.
    // see sha256algorithm.com for a more full explanation of padding length
    const bodySHALength = Math.floor((body.length + 63 + 65) / 64) * 64;
    const [bodyPadded, bodyPaddedLen] = (0, shaHash_1.sha256Pad)(body, Math.max(maxBodyLength, bodySHALength));
    const { precomputedSha, bodyRemaining, bodyRemainingLength } = generatePartialSHA({
        body: bodyPadded,
        bodyLength: bodyPaddedLen,
        selectorString: shaPrecomputeSelector,
        maxRemainingBodyLength: maxBodyLength,
    });
    const circuitInputs = {
        in_padded: (0, binaryFormat_1.Uint8ArrayToCharArray)(messagePadded),
        pubkey: (0, binaryFormat_1.toCircomBigIntBytes)(rsaPublicKey),
        signature: (0, binaryFormat_1.toCircomBigIntBytes)(rsaSignature),
        in_len_padded_bytes: messagePaddedLen.toString(),
    };
    if (!ignoreBodyHashCheck) {
        const bodyHashIndex = message.toString().indexOf(bodyHash);
        circuitInputs.precomputed_sha = (0, binaryFormat_1.Uint8ArrayToCharArray)(precomputedSha);
        circuitInputs.body_hash_idx = bodyHashIndex.toString();
        circuitInputs.in_body_padded = (0, binaryFormat_1.Uint8ArrayToCharArray)(bodyRemaining);
        circuitInputs.in_body_len_padded_bytes = bodyRemainingLength.toString();
    }
    return circuitInputs;
}
exports.generateCircuitInputs = generateCircuitInputs;
