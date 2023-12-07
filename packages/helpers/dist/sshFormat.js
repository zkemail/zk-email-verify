"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sshSignatureToPubKey = exports.getRawSignature = void 0;
const binaryFormat_1 = require("./binaryFormat");
const atob_1 = __importDefault(require("atob"));
function bytesToInt(bytes) {
    return bytes[3] + 256 * (bytes[2] + 256 * (bytes[1] + 256 * bytes[0]));
}
function unpackSshBytes(bytes, numStrings) {
    const result = [];
    let offset = 0;
    for (let i = 0; i < numStrings; ++i) {
        const lenBytes = bytes.slice(offset, offset + 4);
        // first 4 bytes is length in big endian
        const len = bytesToInt(lenBytes);
        const str = bytes.slice(offset + 4, offset + 4 + len);
        result.push(str);
        offset += 4 + len;
    }
    if (offset !== bytes.length) {
        throw new Error("Error unpacking; offset is not at end of bytes");
    }
    return result;
}
function getRawSignature(signature) {
    // 0. strip out "armor" headers (lines that start with -----)
    // 1. base64 -d
    // 2. skipping first 10 bytes (for MAGIC_PREAMBLE and SIG_VERSION), unpack into 5 strings: publickey, namespace, reserved, hash_algorithm, signature
    // 3. convert public key and signature to bignum
    // #define MAGIC_PREAMBLE "SSHSIG"
    // byte[6]   MAGIC_PREAMBLE
    // string    namespace
    // string    reserved
    // string    hash_algorithm
    // string    H(payload1)
    const encodedPart = signature
        .split("\n")
        .filter((line) => !line.includes("SSH SIGNATURE"))
        .join("");
    const bytes = (0, binaryFormat_1.stringToBytes)((0, atob_1.default)(encodedPart));
    const strings = unpackSshBytes(bytes.slice(10), 5);
    const [pubKeyEncoded, namespace, , hash_algorithm, rawSignatureEncoded] = strings;
    // decrypt pub key https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/sshsig.c#L203-L204
    // https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/sshkey.c#L828-L829
    const pubKeyParts = unpackSshBytes(pubKeyEncoded, 3);
    const pubSSHKeyStr = Array.prototype.map
        .call(pubKeyEncoded, function (ch) {
        return String.fromCharCode(ch);
    })
        .join("");
    // decrypt signature https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/ssh-rsa.c#L223-L224
    const rawSigParts = unpackSshBytes(rawSignatureEncoded, 2);
    const rawSignature = rawSigParts[1];
    return {
        rawSignature,
        namespace,
        hash_algorithm,
        pubKeyEncoded,
        pubKeyParts,
        pubSSHKeyStr,
    };
}
exports.getRawSignature = getRawSignature;
function sshSignatureToPubKey(signature) {
    try {
        const encodedPart = signature
            .split("\n")
            .filter((line) => !line.includes("SSH SIGNATURE"))
            .join("");
        const bytes = (0, binaryFormat_1.stringToBytes)((0, atob_1.default)(encodedPart));
        const strings = unpackSshBytes(bytes.slice(10), 5);
        const [pubKeyEncoded,
        // namespace,
        // reserved,
        // hash_algorithm,
        // rawSignatureEncoded,
        ] = strings;
        const pubKeyParts = unpackSshBytes(pubKeyEncoded, 3);
        const pubSSHKeyStr = Array.prototype.map
            .call(pubKeyEncoded, function (ch) {
            return String.fromCharCode(ch);
        })
            .join("");
        const keytype = new TextDecoder().decode(pubKeyParts[0]);
        if (keytype !== "ssh-rsa") {
            return "ERROR GRR";
        }
        return keytype + " " + btoa(pubSSHKeyStr);
    }
    catch (e) {
        return "";
    }
}
exports.sshSignatureToPubKey = sshSignatureToPubKey;
